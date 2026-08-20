// telecom-burst-pool.js — Phase 3 instrument #16 (Step 6).
// Ported from src/audio-layers.js's _initTelecomBurst and its update() gain/
// rate block (~lines 533-578, 1047-1063 at the time of porting) — see
// docs/Implementation_Plan.md Step 6.
//
// NO PoolAllocator here — confirmed, not an oversight. Unlike electricity's
// or tram's pools, telecom's 4 slots are never claimed/released/stolen by
// feature id: they're built once and run continuously, gated collectively by
// AGGREGATE proximity stats (nearest cable distance, cable count), not by
// per-feature identity. This is the escape hatch docs/Implementation_Plan.md
// Step 6 anticipated as the likeliest place the pool contract wouldn't
// generalise — it's the allocator sub-component that doesn't apply here, not
// the Instrument base class contract itself, which this class still follows
// (update()/destroy() lifecycle) same as every other instrument.
//
// Dual-send (destination + optional shared reverb bus) like tram-drone.js.

import { Instrument } from './instrument-base.js';

const POOL_SIZE = 4;
const BASE_RATES = [22, 38, 54, 78]; // Hz — per-slot LFO amplitude-gate rate
const HP_FREQS = [5000, 5600, 6200, 6800]; // Hz — per-slot highpass cutoff
const LFO_DEPTH = 0.45; // slot gain swings 0.05-0.95 around a 0.5 center
const CABLE_RADIUS = 30; // metres
const PEAK_GAIN = 0.06;
const GAIN_TC = 0.8; // seconds
const RATE_TC = 0.5; // seconds

function makeNoiseBuffer(ctx) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export default class TelecomBurstPool extends Instrument {
  constructor(ctx, outputNode, { reverbBus } = {}) {
    super(ctx, outputNode);

    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = 0;
    this._masterGain.connect(outputNode);
    if (reverbBus) this._masterGain.connect(reverbBus);

    this._slots = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const src = ctx.createBufferSource();
      src.buffer = makeNoiseBuffer(ctx);
      src.loop = true;

      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = HP_FREQS[i];

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = BASE_RATES[i];

      const lfoGain = ctx.createGain();
      lfoGain.gain.value = LFO_DEPTH;

      const slotGain = ctx.createGain();
      slotGain.gain.value = 0.5;

      lfo.connect(lfoGain);
      lfoGain.connect(slotGain.gain);
      src.connect(hp);
      hp.connect(slotGain);
      slotGain.connect(this._masterGain);

      src.start();
      lfo.start();
      this._track(src);
      this._track(lfo);

      this._slots.push({ lfo, baseRate: BASE_RATES[i] });
    }
  }

  // { nearestCableDist, cableCount } — cableCount is cables within CABLE_RADIUS.
  update({ nearestCableDist, cableCount }) {
    const t = this.ctx.currentTime;
    const inRange = nearestCableDist !== null && nearestCableDist !== undefined && nearestCableDist <= CABLE_RADIUS;
    const target = inRange ? (1 - nearestCableDist / CABLE_RADIUS) * PEAK_GAIN : 0.0001;
    this._masterGain.gain.setTargetAtTime(target, t, GAIN_TC);

    const rateMult = 0.5 + Math.min((cableCount || 0) / 4, 1.0) * 1.5;
    for (const slot of this._slots) {
      slot.lfo.frequency.setTargetAtTime(slot.baseRate * rateMult, t, RATE_TC);
    }
  }

  destroy() {
    this._teardown(this._masterGain, GAIN_TC * 1.5);
  }
}
