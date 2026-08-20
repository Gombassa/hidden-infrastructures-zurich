// telecom-click-voice.js — Phase 3 instruments #19+#20 (Step 6), consolidated.
// Ported from src/audio-layers.js's _triggerTelecomClick/_scheduleTelecomSnap/
// _setTelecomSnapActive (~lines 664-695 at the time of porting) — see
// docs/Implementation_Plan.md Step 6.
//
// Deliberately NOT a LineCrossingVoice instance, even though telecom's
// crossing/alongside pairing matches electricity's and water's shape exactly
// (same sound re-fired both ways, single shared boolean for alongside) —
// unlike sewage, where the PAIRING itself differs. What breaks here is the
// SOUND: _triggerTelecomClick is a swept sine oscillator (3500->6000Hz
// exponential ramp), not filtered noise like every other crossing sound
// built so far. LineCrossingVoice._fire() is hardcoded to noise+bandpass, so
// a preset alone can't reproduce a sweep. Decided with the project owner:
// a separate class with the identical trigger()/setAlongsideActive()
// interface shape (so callers don't need to know which one they're holding)
// but its own _fire(), rather than adding a synthesis-mode switch to the
// already-shipped, 3-layer-validated LineCrossingVoice. This is the SECOND
// revision to Decision Point 4's "one class serves all 4 layers" claim (the
// first was sewage's alongside-sound divergence in Step 5) — see
// src/instruments/line-crossing-presets.js's note and
// docs/Implementation_Plan.md Step 6/Decision Point 4 for the full record.
//
// Constants stay inline (telecom-only shape, same reasoning water-fitting-
// drip.js and sewage-junction-thud.js give for shapes only one layer uses) —
// no line-crossing-presets.js entry, since that file is specifically for
// LineCrossingVoice instances and this isn't one.

import { Instrument } from './instrument-base.js';

const FREQ_FROM = 3500;
const FREQ_TO = 6000;
const DURATION = 0.06;
const PEAK_GAIN = 0.10;
const CROSSING_COOLDOWN_MS = 3000;
const ALONGSIDE_BASE_MS = 4000;
const ALONGSIDE_JITTER = 0.45;

export default class TelecomClickVoice extends Instrument {
  // onFire(kind, detail) — kind is 'crossing'|'alongside', detail is {id}
  // for crossing, undefined for alongside — same shape as LineCrossingVoice's
  // onFire.
  constructor(ctx, outputNode, { onFire } = {}) {
    super(ctx, outputNode);
    this._crossingCooldown = new Map();
    this._alongsideActive = false;
    this._alongsideTimer = null;
    this._onFire = onFire || (() => {});
  }

  isOnCooldown(id) {
    return Date.now() - (this._crossingCooldown.get(id) || 0) <= CROSSING_COOLDOWN_MS;
  }

  // { id } — one-shot, cooldown-gated per cable id.
  trigger({ id }) {
    const now = Date.now();
    if (now - (this._crossingCooldown.get(id) || 0) <= CROSSING_COOLDOWN_MS) return;
    this._crossingCooldown.set(id, now);
    this._fire();
    this._onFire('crossing', { id });
  }

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
    const jitter = ALONGSIDE_BASE_MS * ALONGSIDE_JITTER * (Math.random() * 2 - 1);
    this._alongsideTimer = setTimeout(() => this._scheduleAlongside(), ALONGSIDE_BASE_MS + jitter);
  }

  _fire() {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(FREQ_FROM, t0);
    osc.frequency.exponentialRampToValueAtTime(FREQ_TO, t0 + DURATION);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + DURATION);

    osc.connect(gain);
    gain.connect(this.outputNode);
    osc.start(t0);
    osc.stop(t0 + DURATION);
  }

  destroy() {
    if (this._alongsideTimer !== null) { clearTimeout(this._alongsideTimer); this._alongsideTimer = null; }
    this._alongsideActive = false;
    this._crossingCooldown.clear();
  }
}
