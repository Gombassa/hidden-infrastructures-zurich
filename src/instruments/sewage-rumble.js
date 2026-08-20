// sewage-rumble.js — Phase 3 instrument #11 (Step 5).
// Ported from src/audio-layers.js's _initSewage and the sewage update() gain
// block (~lines 337-361, 949-961 at the time of porting) — see
// docs/Implementation_Plan.md Step 5.
//
// Strict parity port, dual-send like tram-drone.js (destination + optional
// shared reverb bus). No chamber-resonance bandpass tap — that's
// instruments/sewage-rumble.html's own exploratory addition, not something
// production ever shipped; not carried into this port.

import { Instrument } from './instrument-base.js';

const LOWPASS_HZ = 180;
const LOWPASS_Q = 0.8;
const RADIUS_M = 80;
const PEAK_GAIN = 0.18;
const GAIN_TC = 1.5; // seconds

function makeNoiseBuffer(ctx) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export default class SewageRumble extends Instrument {
  constructor(ctx, outputNode, { reverbBus } = {}) {
    super(ctx, outputNode);

    this._src = ctx.createBufferSource();
    this._src.buffer = makeNoiseBuffer(ctx);
    this._src.loop = true;

    this._lp = ctx.createBiquadFilter();
    this._lp.type = 'lowpass';
    this._lp.frequency.value = LOWPASS_HZ;
    this._lp.Q.value = LOWPASS_Q;

    this._gain = ctx.createGain();
    this._gain.gain.value = 0;

    this._src.connect(this._lp);
    this._lp.connect(this._gain);
    this._gain.connect(outputNode);
    if (reverbBus) this._gain.connect(reverbBus);

    this._src.start();
    this._track(this._src);
  }

  // { nearestDist } — metres to the nearest sewage pipe, or null/Infinity if none in range.
  update({ nearestDist }) {
    const t = this.ctx.currentTime;
    const inRange = nearestDist !== null && nearestDist !== undefined && nearestDist <= RADIUS_M;
    const target = inRange ? (1 - nearestDist / RADIUS_M) * PEAK_GAIN : 0.0001;
    this._gain.gain.setTargetAtTime(target, t, GAIN_TC);
  }

  destroy() {
    this._teardown(this._gain, GAIN_TC * 1.5);
  }
}
