// feeder-crackle.js — Phase 3 instrument #8 (Step 4).
// Ported from src/audio-layers.js's _triggerCrackle (~lines 290-333 at the
// time of porting), strict parity — no redesign here, unlike this step's
// hiss pool. See docs/Implementation_Plan.md Step 4 and the plan at
// C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md.
//
// Firing is gated by the CALLER on proximity.feeders[].triggered — which
// means "within 50m of a currently-moving tram" (ProximityEngine's
// FEEDER_TRIGGER_RADIUS), NOT "near the listener." This instrument's own
// gain scaling is separately listener-distance-driven out to
// CRACKLE_FALLOFF_RADIUS (150m) — two different distance semantics feeding
// one instrument. ProximityEngine's feeder objects carry no `dist` field, so
// distance is computed here from listener/feeder lat-lng, same as production.
//
// Parity note: production computes gainScalar at the call site; this class
// computes it internally from listener+feeder coordinates instead, matching
// every other Step 1-3 instrument's shape — the numbers are identical, only
// which side of the boundary computes them changed.

import { Instrument } from './instrument-base.js';
import { feederToXYZ, flatEarthDist } from './tram-spatial.js';

const CRACKLE_FALLOFF_RADIUS = 150; // metres — gain -> 0 at this distance

export default class FeederCrackle extends Instrument {
  // { feederLat, feederLng, listenerLat, listenerLng, listenerHeading } — no
  // internal cooldown/debounce: unlike WaterProximityPulse or
  // LineCrossingVoice, production's crackle has none of its own either — the
  // caller's triggered-streak Set is what prevents repeat fires (see docblock).
  trigger({ feederLat, feederLng, listenerLat, listenerLng, listenerHeading }) {
    let gainScalar = 1;
    if (listenerLat !== null && listenerLng !== null) {
      const dist = flatEarthDist(listenerLat, listenerLng, feederLat, feederLng);
      gainScalar = Math.pow(1 - Math.min(dist / CRACKLE_FALLOFF_RADIUS, 1), 2);
    }

    const ctx = this.ctx;
    const burstCount = 6;
    const spacing = 0.050;   // 50ms between burst onsets
    const bufLen = Math.floor(ctx.sampleRate * 0.020); // 20ms per burst

    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 1;
    panner.maxDistance = 500;
    panner.rolloffFactor = 1;
    const pos = feederToXYZ(listenerLat, listenerLng, listenerHeading, feederLat, feederLng);
    panner.positionX.value = pos.x;
    panner.positionY.value = pos.y;
    panner.positionZ.value = pos.z;
    panner.connect(this.outputNode);

    for (let i = 0; i < burstCount; i++) {
      const t0 = ctx.currentTime + i * spacing;
      const amplitude = (0.1 + i * 0.1) * gainScalar; // 0.1 -> 0.6 scaled by distance

      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let s = 0; s < bufLen; s++) d[s] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource();
      src.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(amplitude, t0 + 0.002);  // 2ms attack
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.012); // 10ms decay

      src.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      src.start(t0);
      src.stop(t0 + 0.020);
    }
  }
}
