// sewage-junction-thud.js — Phase 3 instrument #12 (Step 5).
// Ported from src/audio-layers.js's _triggerSewageThud (~lines 394-408 at
// the time of porting) — see docs/Implementation_Plan.md Step 5.
//
// Deliberately its own tiny class rather than a LineCrossingVoice instance:
// thud is a standalone spec'd behaviour with no alongside pairing at all
// (Decision Point 4's consolidation only covers the crossing/alongside
// family — #3/4/6/7/13/15/19/20 — thud isn't one of those rows), so routing
// it through that class would misrepresent its shape even though the
// trigger()-with-cooldown mechanics happen to fit. Constants stay inline,
// same reasoning water-fitting-drip.js gives for shapes only one layer uses.

import { Instrument } from './instrument-base.js';

const COOLDOWN_MS = 10_000;

export default class SewageJunctionThud extends Instrument {
  constructor(ctx, outputNode, { onFire } = {}) {
    super(ctx, outputNode);
    this._cooldown = new Map(); // junction id -> last-fire ms
    this._onFire = onFire || (() => {});
  }

  isOnCooldown(id) {
    return Date.now() - (this._cooldown.get(id) || 0) <= COOLDOWN_MS;
  }

  // { id } — one-shot, cooldown-gated per junction id.
  trigger({ id }) {
    const now = Date.now();
    if (now - (this._cooldown.get(id) || 0) <= COOLDOWN_MS) return;
    this._cooldown.set(id, now);
    this._fire();
    this._onFire({ id });
  }

  _fire() {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = 0.6;

    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 55;
    bp.Q.value = 3;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.outputNode);
    src.start(t0);
    src.stop(t0 + dur);
  }

  destroy() {
    this._cooldown.clear();
  }
}
