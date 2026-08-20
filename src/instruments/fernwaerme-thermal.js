// fernwaerme-thermal.js — Phase 3 instruments #21+#22+#23 combined (Step 7).
// Ported from src/audio-layers.js's _initFernwaerme, _triggerFernCrossing/
// _scheduleFernKnock/_setFernKnockActive, and the update() call site
// (~lines 630-662, 699-726, 1080-1113 at the time of porting) — see
// docs/Implementation_Plan.md Step 7.
//
// One class for all three behaviours, deliberately: production's crossing
// burst connects to `_fernPanner || _ctx.destination`, not straight to
// destination like every other layer's crossing sound — it inherits the
// continuous tone's own bearing-driven pan position. max/fernwaerme/
// fernwaerme-spec.md diagrams this explicitly ("Burst path... [pan~] <- same
// pan line~"). This isn't a Decision Point 4 revision like sewage's (Step 5)
// or telecom's (Step 6) — Fernwärme's crossing/alongside were never part of
// crossing-family.html's "8 rows" candidate set to begin with, so there's no
// generic-class claim being broken here, just the correct shape for a layer
// whose one-shots need the continuous instrument's own spatial state.
//
// StereoPanner, not HRTF PannerNode — carried forward unchanged: HRTF
// localises poorly below ~200Hz, and this tone is 60Hz.

import { Instrument } from './instrument-base.js';

const RADIUS_M = 30;
const GAIN_TC = 0.4; // seconds — fast ramp for dramatic entry
const PAN_TC = 1.0; // seconds
const PEAK_GAIN = 0.12;
const TREMOLO_RATE = 0.3; // Hz
const TREMOLO_DEPTH = 0.4; // +/-0.4 around carrier base of 1.0, multiplicative
const CROSSING_COOLDOWN_MS = 3000;
const ALONGSIDE_BASE_MS = 6000;
const ALONGSIDE_JITTER = 0.4;
const BURST_FREQ = 60;
const BURST_DURATION = 0.5;
const BURST_GAIN = 0.15;

export default class FernwaermeThermal extends Instrument {
  constructor(ctx, outputNode, { reverbBus } = {}) {
    super(ctx, outputNode);

    this._panner = ctx.createStereoPanner();
    this._panner.pan.value = 0;
    this._panner.connect(outputNode);

    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = 0;
    this._masterGain.connect(this._panner);
    // Reverb tap pre-panner — stays centred in the wash, matches production.
    // The crossing/alongside burst does NOT send to reverb (see _fire()).
    if (reverbBus) this._masterGain.connect(reverbBus);

    this._carrierGain = ctx.createGain();
    this._carrierGain.gain.value = 1.0;
    this._carrierGain.connect(this._masterGain);

    this._osc = ctx.createOscillator();
    this._osc.type = 'sine';
    this._osc.frequency.value = 60;
    this._osc.connect(this._carrierGain);

    this._tremolo = ctx.createOscillator();
    this._tremolo.type = 'sine';
    this._tremolo.frequency.value = TREMOLO_RATE;
    this._tremoloGain = ctx.createGain();
    this._tremoloGain.gain.value = TREMOLO_DEPTH;
    this._tremolo.connect(this._tremoloGain);
    this._tremoloGain.connect(this._carrierGain.gain); // multiplicative — no bleed when master=0

    this._osc.start();
    this._tremolo.start();
    this._track(this._osc);
    this._track(this._tremolo);

    this._crossingCooldown = new Map();
    this._alongsideActive = false;
    this._alongsideTimer = null;
  }

  // { nearestDist, nearestBearing, heading }
  update({ nearestDist, nearestBearing, heading }) {
    const t = this.ctx.currentTime;
    const inRange = nearestDist !== null && nearestDist !== undefined && nearestDist <= RADIUS_M;
    const target = inRange ? (1 - nearestDist / RADIUS_M) * PEAK_GAIN : 0.0001;
    this._masterGain.gain.setTargetAtTime(target, t, GAIN_TC);

    if (nearestBearing !== null && nearestBearing !== undefined && inRange) {
      const relBearing = ((nearestBearing - (heading || 0)) + 360) % 360;
      const pan = Math.sin(relBearing * Math.PI / 180);
      this._panner.pan.setTargetAtTime(pan, t, PAN_TC);
    } else {
      this._panner.pan.setTargetAtTime(0, t, PAN_TC);
    }
  }

  isOnCooldown(id) {
    return Date.now() - (this._crossingCooldown.get(id) || 0) <= CROSSING_COOLDOWN_MS;
  }

  // { id } — one-shot, cooldown-gated per pipe id.
  trigger({ id }) {
    const now = Date.now();
    if (now - (this._crossingCooldown.get(id) || 0) <= CROSSING_COOLDOWN_MS) return;
    this._crossingCooldown.set(id, now);
    this._fire();
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
    const jitter = ALONGSIDE_BASE_MS * ALONGSIDE_JITTER * (Math.random() * 2 - 1);
    this._alongsideTimer = setTimeout(() => this._scheduleAlongside(), ALONGSIDE_BASE_MS + jitter);
  }

  _fire() {
    const ctx = this.ctx;
    const t0 = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = BURST_FREQ;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(BURST_GAIN, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + BURST_DURATION);

    osc.connect(gain);
    gain.connect(this._panner); // through the panner, not outputNode/reverbBus — localises with the tone
    osc.start(t0);
    osc.stop(t0 + BURST_DURATION);
  }

  destroy() {
    if (this._alongsideTimer !== null) { clearTimeout(this._alongsideTimer); this._alongsideTimer = null; }
    this._alongsideActive = false;
    this._crossingCooldown.clear();
    this._teardown(this._masterGain, GAIN_TC * 1.5);
  }
}
