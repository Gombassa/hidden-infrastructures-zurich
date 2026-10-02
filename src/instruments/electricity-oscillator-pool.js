// electricity-oscillator-pool.js — Phase 3 instrument #5 (Step 1 proof instrument,
// the pool-paradigm proof case). Ported from src/audio-layers.js's
// _initElecPool/_elecClaim/_elecRelease and the electricity block of update()
// (density gain + master gain formulas) — see docs/Implementation_Plan.md Step 1
// and the plan at C:\Users\fiona\.claude\plans\abundant-seeking-stallman.md.
//
// One deliberate parity deviation from production, decided (not inherited by
// accident) as part of this step: pool exhaustion is steal-furthest + margin
// (20%) via PoolAllocator, replacing production's silent-drop
// (`if (!slot) return;` in audio-layers.js's _elecClaim). Note that a "steal"
// here has no audible effect beyond bookkeeping — this pool's 8 slots are
// fixed-frequency (1490-1510Hz spread by slot index), not per-feature timbres
// like the tram hiss pool, so reassigning a slot's featureId doesn't change
// what's heard; only which physical node the slot's sound currently "belongs
// to" changes.
//
// Cable-crossing snap and alongside loop (behaviours #6/#7) are NOT part of
// this instrument — they're separate Step 2 work.

import { Instrument } from './instrument-base.js';
import { PoolAllocator } from './pool-allocator.js';

const ELEC_POOL_SIZE = 8;
const ELEC_CABLE_RADIUS = 40;

// Field-walk finding (2026-09, Step 8 reintegration test): electricity read
// as too loud overall against the other layers. Trimmed 9dB at the master
// gain stage — after the density/proximity formula, not baked into its
// individual constants — so it scales the whole layer uniformly (including
// its shared-reverb-bus send, which taps off the same _masterGain) without
// disturbing the proximity/density balance those constants encode.
const FIELD_TRIM_DB = -9;
const FIELD_TRIM = Math.pow(10, FIELD_TRIM_DB / 20);

export default class ElectricityOscillatorPool extends Instrument {
  // onEvent(type, detail) — optional hook for HTML control-surface logging or a
  // future score-archive (see docs/Technical_Architecture_v5.md, "Score archive"
  // trade-off column). type is 'claim'|'steal'|'refuse'|'release'; detail carries
  // {featureId, dist, stolenFeatureId?}. Purely observational — never affects
  // audio-graph decisions, which live entirely in PoolAllocator/this class.
  constructor(ctx, outputNode, { reverbBus, onEvent } = {}) {
    super(ctx, outputNode);
    this._allocator = new PoolAllocator({ size: ELEC_POOL_SIZE, policy: 'margin', marginPct: 20 });
    this._slots = [];
    this._onEvent = onEvent || (() => {});

    this._masterGain = ctx.createGain();
    this._masterGain.gain.value = 0;
    this._masterGain.connect(outputNode);
    if (reverbBus) this._masterGain.connect(reverbBus);
    this._track(this._masterGain);

    for (let i = 0; i < ELEC_POOL_SIZE; i++) {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      // Spread frequencies evenly across 1490-1510Hz; osc2 offset +3Hz per slot for slight beating
      const baseFreq = 1490 + (i / (ELEC_POOL_SIZE - 1)) * 20;
      osc1.frequency.value = baseFreq;
      osc2.frequency.value = baseFreq + 3;

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.4;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);

      const slotGain = ctx.createGain();
      slotGain.gain.value = 0;
      lfoGain.connect(slotGain.gain);

      osc1.connect(slotGain);
      osc2.connect(slotGain);
      slotGain.connect(this._masterGain);

      osc1.start();
      osc2.start();
      lfo.start();

      this._track(osc1);
      this._track(osc2);
      this._track(lfo);
      this._slots.push({ slotGain });
    }
  }

  // { nodes: [{id, dist, triggered}], nearestCableDist }
  update({ nodes, nearestCableDist = Infinity }) {
    const inRangeIds = new Set(nodes.filter(n => n.triggered).map(n => n.id));
    const distById = new Map(nodes.map(n => [n.id, n.dist]));

    for (const id of this._allocator.activeFeatureIds()) {
      if (!inRangeIds.has(id)) this._release(id);
    }
    for (const id of inRangeIds) this._claim(id, distById.get(id));

    let masterTarget = this._allocator.activeCount > 0 ? 0.175 : 0;
    if (nearestCableDist <= ELEC_CABLE_RADIUS) {
      masterTarget = Math.min(0.25, masterTarget + (1 - nearestCableDist / ELEC_CABLE_RADIUS) * 0.075);
    }

    // Node cluster density: count nodes within 30m, scale pool gain up in dense areas
    const clusterCount = nodes.filter(n => n.dist <= 30).length;
    const densityMult   = 1.0 + Math.min(clusterCount / 5, 1.0) * 0.8; // 1.0 -> 1.8 at 5+ nodes
    masterTarget = Math.min(0.45, masterTarget * densityMult) * FIELD_TRIM;
    this._masterGain.gain.setTargetAtTime(masterTarget, this.ctx.currentTime, 0.8);
  }

  _claim(id, dist) {
    const result = this._allocator.claim(id, dist);
    if (result.action === 'claim') {
      this._slots[result.slotIndex].slotGain.gain.setTargetAtTime(0.06, this.ctx.currentTime, 0.3);
      this._onEvent('claim', { featureId: id, dist });
    } else if (result.action === 'steal') {
      this._onEvent('steal', { featureId: id, dist, stolenFeatureId: result.stolenFeatureId });
    } else if (result.action === 'refuse') {
      this._onEvent('refuse', { featureId: id, dist });
    }
    // 'update' (distance refreshed only) needs no audio-graph change or event.
  }

  _release(id) {
    const slotIndex = this._allocator.release(id);
    if (slotIndex === -1) return;
    this._slots[slotIndex].slotGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
    this._onEvent('release', { featureId: id });
  }

  // Read-only accessors for control-surface readouts — never used internally.
  get activeCount() { return this._allocator.activeCount; }
  get masterGainValue() { return this._masterGain.gain.value; }
  activeFeatureIds() { return this._allocator.activeFeatureIds(); }

  setPolicy(policy, marginPct) {
    this._allocator.policy = policy;
    if (marginPct !== undefined) this._allocator.marginPct = marginPct;
  }

  destroy() {
    this._teardown(this._masterGain, 0.9);
    this._slots = [];
  }
}
