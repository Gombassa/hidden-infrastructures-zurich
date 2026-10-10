// telecom-node-handshake.js — Phase 3 instrument #18 (Step 6).
// Ported from src/audio-layers.js's _triggerTelecomHandshake (~lines 604-626
// at the time of porting) — see docs/Implementation_Plan.md Step 6.
//
// 8s cooldown is internal (production checks/sets _telecomHandshakeCooldown
// inside _triggerTelecomHandshake itself). The 5s DWELL-duration bookkeeping
// that decides WHEN to call trigger() is deliberately NOT part of this class:
// production keeps _telecomNodeDwell (first-seen-ms per node id, cleared when
// no longer triggered) in the update() call site, not inside the trigger
// function — same place feeder crackle's re-fire guard lives relative to
// FeederCrackle. Callers (control surface, ab-compare.html) own that Map and
// call trigger({id}) once a node has been continuously triggered for >5s.

import { Instrument } from './instrument-base.js';

const COOLDOWN_MS = 8_000;

// Sharper (squared) proximity falloff, independent from ProximityEngine's own
// TELECOM_NODE_RADIUS trigger gate — same trigger-gate-vs-falloff-radius split
// feeder-crackle.js documents and uses. No distance was specified by Robin's
// "closer to the data nodes, sharper rolloff" request, so this defaults to the
// 25m trigger radius itself (gain -> 0 right at the gate edge), matching
// telecom-node-chirp.js's CHIRP_FALLOFF_RADIUS.
const HANDSHAKE_FALLOFF_RADIUS = 20; // metres — gain -> 0 at this distance

// -9dB per Robin's field-by-ear request, 2026-10-07 (was a flat 0.18 peak)
const PEAK_GAIN = 0.18 * Math.pow(10, -9 / 20); // ≈ 0.0639

export default class TelecomNodeHandshake extends Instrument {
  constructor(ctx, outputNode) {
    super(ctx, outputNode);
    this._cooldown = new Map(); // node id -> last-fire ms
  }

  isOnCooldown(id) {
    return Date.now() - (this._cooldown.get(id) || 0) < COOLDOWN_MS;
  }

  // { id, dist }
  trigger({ id, dist }) {
    const now = Date.now();
    if (now - (this._cooldown.get(id) || 0) < COOLDOWN_MS) return;
    this._cooldown.set(id, now);

    // Floored, not 0 — exponentialRampToValueAtTime below throws if the gain
    // node's value is ever exactly 0 at the time the ramp starts.
    const gainScalar = (typeof dist === 'number')
      ? Math.max(Math.pow(1 - Math.min(dist / HANDSHAKE_FALLOFF_RADIUS, 1), 2), 0.001)
      : 1;

    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const duration = 0.4;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t0);
    osc.frequency.exponentialRampToValueAtTime(8000, t0 + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN * gainScalar, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(PEAK_GAIN * gainScalar * (0.001 / 0.18), t0 + duration);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  destroy() {
    this._cooldown.clear();
  }
}
