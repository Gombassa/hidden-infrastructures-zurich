// line-crossing-voice.js — Phase 3 instruments #6+#7 (Step 2), consolidated.
// Ported from src/audio-layers.js's _triggerElecSnap/_scheduleElecSnap/_setElecSnapActive
// (~lines 502-529 at the time of porting) — see docs/Implementation_Plan.md Step 2
// and the plan at C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md.
//
// Production's cable-crossing snap and alongside loop are literally the same sound
// (a bandpass noise burst) triggered two different ways — a per-id cooldown-gated
// one-shot on crossing, and a single shared jittered re-fire loop while ANY feature
// in the layer has alongside===true. This class serves both behaviours from one
// preset (docs/Implementation_Plan.md instrument #6 via trigger(), #7 via
// setAlongsideActive()) — this IS the granularity consolidation Decision Point 4
// resolves toward, not a shortcut around it. instruments/crossing-family.html
// (a pre-Step-1 prototype) independently discovered the same shape across water,
// sewage, electricity, and telecom's crossing/alongside pairs; this class is the
// first production-parity realization of that finding — see
// src/instruments/line-crossing-presets.js for the per-layer preset(s).
//
// Deliberate parity notes, not silently resolved:
//  1. No panning, no shared-reverb-bus send. Production's _triggerElecSnap()
//     connects straight to ctx.destination — preserved as-is.
//  2. No bearing-driven positioning is possible even if wanted: electricity (and
//     water/sewage/telecom) cables/pipes carry no bearing field from
//     ProximityEngine — only fernwaerme.pipes gets nearestSegmentBearing. Adding
//     one would be a proximity-engine.js change, out of scope here.
//  3. alongsideActive is a SINGLE shared flag per instance, not per-feature-id —
//     matches production's _elecSnapActive boolean (one timer for the whole
//     layer) exactly. A caller with N alongside-qualifying features still only
//     gets one re-firing loop, same as today.

import { Instrument } from './instrument-base.js';

export default class LineCrossingVoice extends Instrument {
  // preset: { freq, q, duration, attack, gain, crossingCooldownMs, alongsideBaseMs, alongsideJitter }
  // onFire(kind, detail) — optional hook, kind is 'crossing'|'alongside', detail is
  // {id} for crossing (undefined for alongside, which isn't per-id). Purely
  // observational, same as ElectricityOscillatorPool's onEvent from Step 1 — lets
  // a control surface log/visualize real fires, including the alongside loop's
  // self-scheduled re-fires, which are otherwise invisible to the caller.
  constructor(ctx, outputNode, preset, { onFire } = {}) {
    super(ctx, outputNode);
    this._preset = preset;
    this._crossingCooldown = new Map(); // featureId -> last-fire ms, mirrors _elecCrossingCooldown
    this._alongsideActive = false;      // single shared flag, mirrors _elecSnapActive
    this._alongsideTimer = null;
    this._onFire = onFire || (() => {});
  }

  // Read-only cooldown check for control surfaces that want to log/show
  // held-vs-fired state without duplicating the cooldown logic themselves —
  // same pattern as WaterProximityPulse.isOnCooldown() from Step 1.
  isOnCooldown(id) {
    return Date.now() - (this._crossingCooldown.get(id) || 0) <= this._preset.crossingCooldownMs;
  }

  // { id } — one-shot, cooldown-gated per id. Ports _triggerElecSnap's caller-side
  // cooldown check (audio-layers.js's update() loop) into the instrument itself.
  trigger({ id }) {
    const now = Date.now();
    const { crossingCooldownMs } = this._preset;
    if (now - (this._crossingCooldown.get(id) || 0) <= crossingCooldownMs) return;
    this._crossingCooldown.set(id, now);
    this._fire();
    this._onFire('crossing', { id });
  }

  // Starts/stops the jittered re-fire loop — ports _setElecSnapActive/_scheduleElecSnap.
  setAlongsideActive(active) {
    if (active === this._alongsideActive) return;
    this._alongsideActive = active;
    if (active) {
      this._scheduleAlongside();
    } else if (this._alongsideTimer !== null) {
      clearTimeout(this._alongsideTimer);
      this._alongsideTimer = null;
    }
  }

  _scheduleAlongside() {
    if (!this._alongsideActive) { this._alongsideTimer = null; return; }
    this._fire();
    this._onFire('alongside');
    const { alongsideBaseMs, alongsideJitter } = this._preset;
    const jitter = alongsideBaseMs * alongsideJitter * (Math.random() * 2 - 1);
    this._alongsideTimer = setTimeout(() => this._scheduleAlongside(), alongsideBaseMs + jitter);
  }

  _fire() {
    const { freq, q, duration, attack, gain: peakGain } = this._preset;
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const bufLen = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.outputNode);
    src.start(t0);
    src.stop(t0 + duration);

    // BufferSource auto-disconnects after stop() — nothing to _track() for teardown.
  }

  destroy() {
    if (this._alongsideTimer !== null) { clearTimeout(this._alongsideTimer); this._alongsideTimer = null; }
    this._alongsideActive = false;
    this._crossingCooldown.clear();
  }
}
