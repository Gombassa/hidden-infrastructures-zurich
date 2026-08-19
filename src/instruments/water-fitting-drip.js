// water-fitting-drip.js — Phase 3 instrument #2 (Step 3).
// Ported from src/audio-layers.js's _triggerWaterDrip/_scheduleWaterDrip/
// _setWaterDripRate (~lines 772-811 at the time of porting) — see
// docs/Implementation_Plan.md Step 3 and the plan at
// C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md.
//
// Distinct shape from WaterProximityPulse (cooldown-gated one-shot) and
// LineCrossingVoice (binary alongside flag): this is a continuous-rate
// scheduler, rate driven by fitting-cluster density at the call site
// (production: min(fittingsWithin15m * 0.5, 3.0) Hz). No other layer in the
// 24-item inventory currently uses this shape, so its constants stay inline
// rather than in a shared presets module — LineCrossingVoice was split out
// because 4 layers already needed it; this isn't there (yet).
//
// Parity note: no reverb send, no panning — matches production, which
// connects straight to ctx.destination.

import { Instrument } from './instrument-base.js';

export default class WaterFittingDrip extends Instrument {
  // onFire() — optional hook, same pattern as LineCrossingVoice's onFire from
  // Step 2. Lets a control surface log/visualize real fires, which are
  // otherwise invisible to the caller since the class schedules them itself.
  constructor(ctx, outputNode, { onFire } = {}) {
    super(ctx, outputNode);
    this._rate = 0;
    this._timer = null;
    this._onFire = onFire || (() => {});
  }

  // hz: drips per second, 0 stops the loop. Ports _setWaterDripRate.
  setRate(hz) {
    this._rate = hz;
    if (hz > 0 && this._timer === null) this._schedule();
  }

  _schedule() {
    if (this._rate <= 0) { this._timer = null; return; }
    this._fire();
    this._onFire();
    // ±25% jitter so drips sound organic rather than metronomic — matches
    // _scheduleWaterDrip exactly.
    const base = 1000 / this._rate;
    const jitter = base * 0.25 * (Math.random() * 2 - 1);
    this._timer = setTimeout(() => this._schedule(), base + jitter);
  }

  _fire() {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const duration = 0.04;

    const bufLen = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2800;
    bp.Q.value = 6;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.outputNode);
    src.start(t0);
    src.stop(t0 + duration);
  }

  destroy() {
    if (this._timer !== null) { clearTimeout(this._timer); this._timer = null; }
    this._rate = 0;
  }
}
