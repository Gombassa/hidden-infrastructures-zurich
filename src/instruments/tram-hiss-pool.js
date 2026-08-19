// tram-hiss-pool.js — Phase 3 instrument #9 (Step 4), a deliberate departure
// from production parity. See docs/Implementation_Plan.md Step 4 and the
// plan at C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md for the
// full reasoning; summary:
//
// Production's hiss pool (src/audio-layers.js's _updateHissGains) is
// STATELESS: 6 fixed comb-delay slots, built once at init, get reassigned
// each tick to whichever feeders are currently nearest the listener — slot 3
// always has the same 4.1ms comb delay no matter which feeder occupies it,
// and a feeder's sound depends on which slot it lands in, not on its own
// identity. This class instead builds on instruments/hiss-voice.html (a
// pre-Step-1 prototype that already explored a PERSISTENT per-feeder-identity
// redesign but never shipped it): one voice permanently claimed per feeder,
// timbre hashed once from the feeder's own identity, so a given feeder always
// sounds like itself. The project owner chose this redesign explicitly this
// session — for consistency with the steal/margin/refuse allocator
// philosophy already established for electricity's pool (Step 1), and
// because the sound already existed, just unwired. Feeder crackle
// (feeder-crackle.js) and drone (tram-drone.js), this step's other two
// instruments, have no such fork and are strict parity ports as usual.
//
// IMPORTANT: fed live from ab-compare.html, Path B's hiss pool will NOT
// sound like Path A's (production) even when both are working correctly —
// this is the one intentionally non-matching A/B pairing in that harness.
//
// Claim/release/steal mechanics reuse src/instruments/pool-allocator.js's
// PoolAllocator (policy 'margin', 20% — the same exhaustion policy Step 1
// established for electricity, not a new decision). Only the per-voice audio
// graph is tram-specific (src/instruments/tram-hiss-voice.js).
//
// ProximityEngine's feeder objects carry no `dist` field and `triggered`
// means "near a tram" (see tram-spatial.js's docblock) — this pool computes
// listener-distance itself and does NOT filter by `triggered` at all,
// matching production's _updateHissGains exactly (hiss is purely
// listener-distance-driven, independent of tram activity).

import { Instrument } from './instrument-base.js';
import { PoolAllocator } from './pool-allocator.js';
import TramHissVoice from './tram-hiss-voice.js';
import { flatEarthDist, feederKey } from './tram-spatial.js';

const RADIUS = 25; // metres — matches production's FEEDER_HISS_RADIUS
const POOL_SIZE = 6; // matches production's slot count

export default class TramHissPool extends Instrument {
  constructor(ctx, outputNode, { onEvent } = {}) {
    super(ctx, outputNode);
    this._allocator = new PoolAllocator({ size: POOL_SIZE, policy: 'margin', marginPct: 20 });
    this._voices = new Map(); // key -> TramHissVoice
    this._onEvent = onEvent || (() => {});
  }

  // { feeders, listenerLat, listenerLng, listenerHeading }
  update({ feeders, listenerLat, listenerLng, listenerHeading }) {
    if (listenerLat === null || listenerLng === null) return;

    const inRange = [];
    for (const f of feeders) {
      const dist = flatEarthDist(listenerLat, listenerLng, f.lat, f.lng);
      if (dist <= RADIUS) inRange.push({ key: feederKey(f.lat, f.lng), lat: f.lat, lng: f.lng, dist });
    }

    const seenKeys = new Set();
    for (const { key, lat, lng, dist } of inRange) {
      seenKeys.add(key);
      const result = this._allocator.claim(key, dist);
      if (result.action === 'claim') {
        const voice = new TramHissVoice(this.ctx, this.outputNode, { feederKey: key, feederLat: lat, feederLng: lng, distance: dist });
        this._voices.set(key, voice);
        this._onEvent('claim', { featureId: key, dist });
      } else if (result.action === 'steal') {
        const stolen = this._voices.get(result.stolenFeatureId);
        if (stolen) { stolen.release(); this._voices.delete(result.stolenFeatureId); }
        const voice = new TramHissVoice(this.ctx, this.outputNode, { feederKey: key, feederLat: lat, feederLng: lng, distance: dist });
        this._voices.set(key, voice);
        this._onEvent('steal', { featureId: key, dist, stolenFeatureId: result.stolenFeatureId });
      } else if (result.action === 'update') {
        const voice = this._voices.get(key);
        if (voice) voice.setDistance(dist);
      } else if (result.action === 'refuse') {
        this._onEvent('refuse', { featureId: key, dist });
      }
    }

    for (const key of this._allocator.activeFeatureIds()) {
      if (!seenKeys.has(key)) {
        this._allocator.release(key);
        const voice = this._voices.get(key);
        if (voice) { voice.release(); this._voices.delete(key); }
        this._onEvent('release', { featureId: key });
      }
    }

    for (const voice of this._voices.values()) {
      voice.setListenerState({ lat: listenerLat, lng: listenerLng, heading: listenerHeading });
    }
  }

  get activeCount() { return this._allocator.activeCount; }
  activeFeatureIds() { return this._allocator.activeFeatureIds(); }

  // Manual single-voice release, for control-surface "Release" buttons — the
  // next update() call won't re-claim this key unless the caller still
  // includes it in the feeders list it passes in.
  release(key) {
    const slotIndex = this._allocator.release(key);
    if (slotIndex === -1) return;
    const voice = this._voices.get(key);
    if (voice) { voice.release(); this._voices.delete(key); }
    this._onEvent('release', { featureId: key });
  }

  setPolicy(policy, marginPct) {
    this._allocator.policy = policy;
    if (marginPct !== undefined) this._allocator.marginPct = marginPct;
  }

  destroy() {
    for (const voice of this._voices.values()) voice.release();
    this._voices.clear();
  }
}
