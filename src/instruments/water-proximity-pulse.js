// water-proximity-pulse.js — Phase 3 instrument #1 (Step 1 proof instrument).
// Ported from src/audio-layers.js's _triggerWaterPulse (lines 731-770 at the
// time of porting) — see docs/Implementation_Plan.md Step 1 and the plan at
// C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md for context.
//
// Two deliberate parity notes, not silently resolved:
//  1. No send to the shared density reverb bus. Production doesn't send water's
//     pulse to _sharedReverbBus either (unlike every continuous-gain layer) —
//     reconciling that 6th send is tracked separately as open Phase 3 work
//     (CLAUDE.md, "reconcile the shared density reverb bus for a 6th (water)
//     send"), not fixed here.
//  2. Nearest-only firing (only the single nearest triggered pipe and nearest
//     triggered fitting sound per tick) is NOT built into this class — that
//     reduce happens at the call site in audio-layers.js today, so it stays the
//     caller's responsibility here too. A caller that wants to trigger every
//     in-range feature, not just the nearest, can do so — this class doesn't
//     enforce either policy.

import { Instrument } from './instrument-base.js';

export default class WaterProximityPulse extends Instrument {
  constructor(ctx, outputNode) {
    super(ctx, outputNode);
    this._lastTrigger = new Map(); // featureId -> ms timestamp
    this._cooldownMs = 30_000;
  }

  // Read-only cooldown check for control surfaces that want to log/show
  // held-vs-fired state without duplicating the cooldown logic themselves.
  isOnCooldown(id) {
    return Date.now() - (this._lastTrigger.get(id) || 0) < this._cooldownMs;
  }

  // { id, dist, isFitting }
  trigger({ id, dist, isFitting }) {
    const now = Date.now();
    if (now - (this._lastTrigger.get(id) || 0) < this._cooldownMs) return;
    this._lastTrigger.set(id, now);

    const freq     = isFitting ? 1200 : 800;
    const duration = isFitting ? 0.08 : 0.25;

    const radius  = isFitting ? 25 : 50;
    const proxT   = Math.max(0, 1 - dist / radius);
    const maxGain = 0.04 + proxT * 0.14;

    const ctx = this.ctx;
    const bufLen = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 3;

    const gain = ctx.createGain();
    const t0     = ctx.currentTime;
    const attack = 0.005;
    const decay  = duration * 0.8;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(maxGain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(this.outputNode);
    src.start(t0);
    src.stop(t0 + duration);

    // Buffer sources auto-disconnect after stop(); nothing to track for teardown.
  }

  // Test-harness convenience — production never needs this, since it never
  // wants to force a feature back into range early.
  resetCooldowns() {
    this._lastTrigger.clear();
  }

  destroy() {
    this._lastTrigger.clear();
  }
}
