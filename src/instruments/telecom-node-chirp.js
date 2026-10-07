// telecom-node-chirp.js — Phase 3 instrument #17 (Step 6, previously unbuilt).
// Ported from src/audio-layers.js's _triggerTelecomChirp (~lines 580-602 at
// the time of porting) — see docs/Implementation_Plan.md Step 6.
//
// Debounce guard, not a time cooldown: production's _telecomDebounce Set is
// checked and cleared INSIDE _triggerTelecomChirp itself (cleared by the
// oscillator's own onended, ~0.2s later) — unlike feeder crackle, where the
// equivalent re-fire guard lives in the CALLER (audio-layers.js's update()
// loop, ported to ab-compare.html's crackleTriggeredIds Set, not into
// feeder-crackle.js). Where production puts the guard is what this port
// follows, per layer — here it belongs inside the class.

import { Instrument } from './instrument-base.js';

// Sharper (squared) proximity falloff, independent from ProximityEngine's own
// TELECOM_NODE_RADIUS trigger gate — same trigger-gate-vs-falloff-radius split
// feeder-crackle.js documents and uses. No distance was specified by Robin's
// "closer to the data nodes, sharper rolloff" request, so this defaults to the
// new 25m trigger radius itself (gain -> 0 right at the gate edge).
const CHIRP_FALLOFF_RADIUS = 25; // metres — gain -> 0 at this distance

export default class TelecomNodeChirp extends Instrument {
  constructor(ctx, outputNode) {
    super(ctx, outputNode);
    this._debounce = new Set();
  }

  isDebounced(id) {
    return this._debounce.has(id);
  }

  // { id, dist }
  trigger({ id, dist }) {
    if (this._debounce.has(id)) return;
    this._debounce.add(id);

    // Floored, not 0 — exponentialRampToValueAtTime below throws if the gain
    // node's value is ever exactly 0 at the time the ramp starts.
    const gainScalar = (typeof dist === 'number')
      ? Math.max(Math.pow(1 - Math.min(dist / CHIRP_FALLOFF_RADIUS, 1), 2), 0.001)
      : 1;

    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const duration = 0.2;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t0);
    osc.frequency.linearRampToValueAtTime(4000, t0 + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08 * gainScalar, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.08 * gainScalar * 0.0125, t0 + duration);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(t0);
    osc.stop(t0 + duration);
    osc.onended = () => this._debounce.delete(id);
  }

  destroy() {
    this._debounce.clear();
  }
}
