// tram-hiss-voice.js — one persistent voice per tram feeder, part of Phase 3
// instrument #9 (Step 4)'s deliberate redesign. See tram-hiss-pool.js's
// docblock for why this departs from production's stateless nearest-N
// reassignment model, and docs/Implementation_Plan.md Step 4.
//
// Ported from instruments/hiss-voice.html's HissVoice class (a pre-Step-1
// prototype that explored this exact redesign but never shipped it), with
// one substitution: StereoPanner -> real HRTF PannerNode via
// tram-spatial.js's feederToXYZ, since the prototype explicitly deferred
// bearing-driven positioning ("this walk is for the voice model and
// allocation policy first; positioning is next" — hiss-voice.html's own
// hint text). Peak gain (0.15) and radius (25m) are ported from production's
// _updateHissGains instead of the prototype's own values (which used 50m and
// implied full-scale gain) — the audible range/loudness is not part of the
// redesign, only the identity/allocation model and per-voice timbre are.

import { Instrument } from './instrument-base.js';
import { feederToXYZ } from './tram-spatial.js';

const RADIUS = 25;       // metres — matches production's FEEDER_HISS_RADIUS
const PEAK_GAIN = 0.15;  // matches production's (1-dist/25)*0.15
const FALLOFF_EXP = 1;   // linear, matches production
const ATTACK_S = 0.9;
const RELEASE_S = 1.6;
const NOISE_LEVEL = 0.85 * 0.5; // matches the prototype's default noiseLvl(0.85) * 0.5 gain-staging
const TONE_HZ = 600;            // 50Hz mains x 12-pulse rectification
const TONE2_RATIO = 0.3;        // second-harmonic level relative to fundamental

// Comb delay / feedback / filter / LFO parameter ranges — ported from the
// prototype's default panel values (hiss-voice.html), which are themselves a
// continuum replacing production's 6 fixed HISS_COMB_DELAYS slots.
const RANGES = {
  combMs: [2.3, 8.9], fb: [0.35, 0.72], fc: [900, 3400], q: [0.8, 4],
  l1rate: [0.08, 0.42], l1depth: [0.15, 0.9],
  l2rate: [0.05, 0.31], l2depth: [120, 1100],
  toneLvl: [0.02, 0.09], toneDet: 3.5,
};

export function hashId(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

function phasedSine(ctx, phase) {
  const real = new Float32Array([0, Math.sin(phase)]);
  const imag = new Float32Array([0, Math.cos(phase)]);
  return ctx.createPeriodicWave(real, imag, { disableNormalization: true });
}

function gainForDistance(d) {
  const t = Math.min(1, Math.max(0, d / RADIUS));
  return Math.pow(1 - t, FALLOFF_EXP);
}

// Read-only reproduction of the per-voice param derivation, for control
// surfaces that want to display a feeder's hashed timbre (e.g. a "sounding
// feeders" table) without reaching into a live TramHissVoice instance.
export function paramsForKey(key) {
  const rnd = mulberry32(hashId(key));
  return {
    combMs:  lerp(...RANGES.combMs, rnd()),
    fb:      lerp(...RANGES.fb, rnd()),
    fc:      lerp(...RANGES.fc, rnd()),
    q:       lerp(...RANGES.q, rnd()),
    l1rate:  lerp(...RANGES.l1rate, rnd()),
    l1depth: lerp(...RANGES.l1depth, rnd()),
    l1phase: rnd() * Math.PI * 2,
    l2rate:  lerp(...RANGES.l2rate, rnd()),
    l2depth: lerp(...RANGES.l2depth, rnd()),
    l2phase: rnd() * Math.PI * 2,
    toneLvl: lerp(...RANGES.toneLvl, rnd()),
    toneOff: (rnd() * 2 - 1) * RANGES.toneDet,
  };
}

export default class TramHissVoice extends Instrument {
  // feederKey: stable identity key (see tram-spatial.js's feederKey()) — the
  // timbre seed and never anything logged, matching the prototype's identity
  // split (seed is internal-only, never exported).
  constructor(ctx, outputNode, { feederKey, feederLat, feederLng, distance }) {
    super(ctx, outputNode);
    this.feederLat = feederLat;
    this.feederLng = feederLng;
    this.distance = distance;
    this.releasing = false;

    const seed = hashId(feederKey);
    const rnd = mulberry32(seed);
    const p = this.params = {
      combMs:  lerp(...RANGES.combMs, rnd()),
      fb:      lerp(...RANGES.fb, rnd()),
      fc:      lerp(...RANGES.fc, rnd()),
      q:       lerp(...RANGES.q, rnd()),
      l1rate:  lerp(...RANGES.l1rate, rnd()),
      l1depth: lerp(...RANGES.l1depth, rnd()),
      l1phase: rnd() * Math.PI * 2,
      l2rate:  lerp(...RANGES.l2rate, rnd()),
      l2depth: lerp(...RANGES.l2depth, rnd()),
      l2phase: rnd() * Math.PI * 2,
      toneLvl: lerp(...RANGES.toneLvl, rnd()),
      toneOff: (rnd() * 2 - 1) * RANGES.toneDet,
    };

    const t = ctx.currentTime;

    this.env = ctx.createGain();
    this.env.gain.value = 0.0001;
    this.panner = ctx.createPanner();
    this.panner.panningModel = 'HRTF';
    this.panner.distanceModel = 'inverse';
    this.panner.refDistance = 1;
    this.panner.maxDistance = 500;
    this.panner.rolloffFactor = 1;
    this.env.connect(this.panner).connect(outputNode);

    this.noiseSrc = ctx.createBufferSource();
    this.noiseSrc.buffer = TramHissVoice._sharedNoiseBuf(ctx);
    this.noiseSrc.loop = true;

    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = NOISE_LEVEL;

    this.delay = ctx.createDelay(0.06);
    this.delay.delayTime.value = p.combMs / 1000;
    this.fb = ctx.createGain();
    this.fb.gain.value = p.fb;

    this.bp = ctx.createBiquadFilter();
    this.bp.type = 'bandpass';
    this.bp.frequency.value = p.fc;
    this.bp.Q.value = p.q;

    this.noiseSrc.connect(this.noiseGain);
    this.noiseGain.connect(this.bp);
    this.noiseGain.connect(this.delay);
    this.delay.connect(this.fb);
    this.fb.connect(this.delay);
    this.delay.connect(this.bp);
    this.bp.connect(this.env);

    this.tone = ctx.createOscillator();
    this.tone.type = 'sine';
    this.tone.frequency.value = TONE_HZ + p.toneOff;
    this.toneGain = ctx.createGain();
    this.toneGain.gain.value = p.toneLvl;
    this.tone.connect(this.toneGain).connect(this.env);

    this.tone2 = ctx.createOscillator();
    this.tone2.type = 'sine';
    this.tone2.frequency.value = (TONE_HZ + p.toneOff) * 2;
    this.tone2Gain = ctx.createGain();
    this.tone2Gain.gain.value = p.toneLvl * TONE2_RATIO;
    this.tone2.connect(this.tone2Gain).connect(this.env);

    this.lfo1 = ctx.createOscillator();
    this.lfo1.setPeriodicWave(phasedSine(ctx, p.l1phase));
    this.lfo1.frequency.value = p.l1rate;
    this.lfo1Depth = ctx.createGain();
    this.lfo1Depth.gain.value = p.l1depth / 1000;
    this.lfo1.connect(this.lfo1Depth).connect(this.delay.delayTime);

    this.lfo2 = ctx.createOscillator();
    this.lfo2.setPeriodicWave(phasedSine(ctx, p.l2phase));
    this.lfo2.frequency.value = p.l2rate;
    this.lfo2Depth = ctx.createGain();
    this.lfo2Depth.gain.value = p.l2depth;
    this.lfo2.connect(this.lfo2Depth).connect(this.bp.frequency);

    this.noiseSrc.start(t);
    this.tone.start(t);
    this.tone2.start(t);
    this.lfo1.start(t);
    this.lfo2.start(t);
    [this.noiseSrc, this.tone, this.tone2, this.lfo1, this.lfo2].forEach(n => this._track(n));

    this.target = gainForDistance(distance);
    this.env.gain.setValueAtTime(0.0001, t);
    this.env.gain.exponentialRampToValueAtTime(Math.max(0.0002, this.target), t + ATTACK_S);

    this.setListenerState({ lat: null, lng: null, heading: null });
  }

  static _sharedNoiseBuf(ctx) {
    // One shared 2s noise buffer for all voices on a given context — each
    // voice reads it independently via its own looping BufferSource, so
    // sharing the buffer (not the source) is safe and avoids rebuilding
    // identical random data per voice.
    if (!TramHissVoice.__noiseBuf || TramHissVoice.__noiseBufCtx !== ctx) {
      const len = ctx.sampleRate * 2;
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      TramHissVoice.__noiseBuf = buf;
      TramHissVoice.__noiseBufCtx = ctx;
    }
    return TramHissVoice.__noiseBuf;
  }

  setDistance(dist) {
    if (this.releasing) return;
    this.distance = dist;
    this.target = gainForDistance(dist);
    this.env.gain.setTargetAtTime(Math.max(0.0002, this.target), this.ctx.currentTime, 0.25);
  }

  setListenerState({ lat, lng, heading }) {
    if (this.releasing) return;
    const pos = feederToXYZ(lat, lng, heading, this.feederLat, this.feederLng);
    const t = this.ctx.currentTime;
    this.panner.positionX.setTargetAtTime(pos.x, t, 0.1);
    this.panner.positionY.setTargetAtTime(pos.y, t, 0.1);
    this.panner.positionZ.setTargetAtTime(pos.z, t, 0.1);
  }

  release() {
    if (this.releasing) return;
    this.releasing = true;
    const ctx = this.ctx, t = ctx.currentTime, r = RELEASE_S;
    this.env.gain.cancelScheduledValues(t);
    this.env.gain.setValueAtTime(Math.max(0.0002, this.env.gain.value), t);
    this.env.gain.exponentialRampToValueAtTime(0.0001, t + r);
    for (const n of this._trackedNodes) { try { n.stop(t + r + 0.05); } catch (e) { /* already stopped */ } }
    setTimeout(() => this._disconnectAll(), (r + 0.2) * 1000);
  }

  _disconnectAll() {
    [...this._trackedNodes, this.noiseGain, this.delay, this.fb, this.bp,
     this.toneGain, this.tone2Gain, this.lfo1Depth, this.lfo2Depth,
     this.env, this.panner].forEach(n => { try { n.disconnect(); } catch (e) { /* already disconnected */ } });
    this._trackedNodes = [];
  }

  destroy() {
    this.release();
  }
}
