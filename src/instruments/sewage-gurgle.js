// sewage-gurgle.js — Phase 3 instruments #14 + #15 combined (Step 5).
// Ported from src/audio-layers.js's _triggerSewageGurgle/_scheduleSewageGurgle/
// _setSewageGurgleActive (rhythmic gurgle) and _scheduleSewageKnock/
// _setSewageKnockActive (alongside loop) — ~lines 363-391, 427-439 at the
// time of porting. See docs/Implementation_Plan.md Step 5.
//
// Production runs these as two independent timer state machines
// (_sewageGurgleActive/_sewageGurgleTimer for the below-20m rhythmic gurgle,
// _sewageKnockActive/_sewageKnockTimer for the alongside loop) that happen to
// share one fire function. This class mirrors that exactly: setGurgleActive()
// and setAlongsideActive() are independently toggled loops with their own
// timers, both calling the same _fire(). This is NOT the crossing/alongside
// shape LineCrossingVoice serves — sewage's alongside loop re-fires the
// gurgle sound, not the crossing-snap sound (confirmed against
// docs/Technical_Architecture_v5.md: "Alongside loop: gurgle rhythm ~4s
// ±35% jitter") — so it deliberately isn't built on that class. See
// docs/Implementation_Plan.md Step 5 and instruments/crossing-family.html's
// sewage carve-out for the caller-side consequence of this.
//
// DELIBERATE REDESIGN, decided with the project owner this step (same
// category as Step 4's hiss-pool redesign): production's gurgle burst has a
// fixed 100Hz bandpass center on every fire. This class instead retunes the
// bandpass center to sewage-chords.js's current circle-of-fifths note
// (MIDI-to-Hz) on every fire, realizing the original Max spec's intent
// ("gives the sewage layer a coherent but slowly drifting harmonic
// identity") that audio-layers.js never actually implemented. Everything
// else about the fire (duration, attack, gain, Q) is unchanged from
// production. Consequence: this instrument will NOT sound like
// audio-layers.js's gurgle/alongside — that mismatch is intentional, not a
// bug, same as Step 4's hiss pool vs. Path A in ab-compare.html.

import { Instrument } from './instrument-base.js';
import CircleOfFifths from './sewage-chords.js';

const GURGLE_MIN_MS = 1250;
const GURGLE_MAX_MS = 5000;
const ALONGSIDE_BASE_MS = 4000;
const ALONGSIDE_JITTER = 0.35;
const FIRE_DURATION = 0.15;
const FIRE_Q = 2.5;
const FIRE_GAIN = 0.06;

function midiToHz(note) {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export default class SewageGurgle extends Instrument {
  // onFire({ note, chordName, chordChanged, source }) — source is
  // 'gurgle'|'alongside', which loop caused this fire. Optional hook,
  // same pattern as LineCrossingVoice's onFire.
  constructor(ctx, outputNode, { onFire } = {}) {
    super(ctx, outputNode);
    this._chords = new CircleOfFifths();
    this._gurgleActive = false;
    this._gurgleTimer = null;
    this._alongsideActive = false;
    this._alongsideTimer = null;
    this._onFire = onFire || (() => {});
  }

  get chordName() {
    return this._chords.chordName;
  }

  setGurgleActive(active) {
    if (active === this._gurgleActive) return;
    this._gurgleActive = active;
    if (active && this._gurgleTimer === null) this._scheduleGurgle();
  }

  setAlongsideActive(active) {
    if (active === this._alongsideActive) return;
    this._alongsideActive = active;
    if (active && this._alongsideTimer === null) this._scheduleAlongside();
  }

  _scheduleGurgle() {
    if (!this._gurgleActive) { this._gurgleTimer = null; return; }
    this._fire('gurgle');
    const interval = GURGLE_MIN_MS + Math.random() * (GURGLE_MAX_MS - GURGLE_MIN_MS);
    this._gurgleTimer = setTimeout(() => this._scheduleGurgle(), interval);
  }

  _scheduleAlongside() {
    if (!this._alongsideActive) { this._alongsideTimer = null; return; }
    this._fire('alongside');
    const jitter = ALONGSIDE_BASE_MS * ALONGSIDE_JITTER * (Math.random() * 2 - 1);
    this._alongsideTimer = setTimeout(() => this._scheduleAlongside(), ALONGSIDE_BASE_MS + jitter);
  }

  _fire(source) {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;
    const dur = FIRE_DURATION;

    const { note, chordName, chordChanged } = this._chords.bang();
    const freq = midiToHz(note);

    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = FIRE_Q;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(FIRE_GAIN, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.outputNode);
    src.start(t0);
    src.stop(t0 + dur);

    this._onFire({ note, chordName, chordChanged, freq, source });
  }

  destroy() {
    if (this._gurgleTimer !== null) { clearTimeout(this._gurgleTimer); this._gurgleTimer = null; }
    if (this._alongsideTimer !== null) { clearTimeout(this._alongsideTimer); this._alongsideTimer = null; }
    this._gurgleActive = false;
    this._alongsideActive = false;
  }
}
