// pool-allocator.js — shared claim/steal/margin/refuse bookkeeping for pooled
// instruments (electricity oscillator pool now; tram hiss pool, telecom burst
// pool later — see docs/Implementation_Plan.md Steps 4 and 6).
//
// This is the logic that instruments/hiss-voice.html and instruments/electricity-hum.html
// each independently reimplemented (byte-identical furthest-scan + margin-threshold
// check) before the interface contract was decided — extracting it here is the
// concrete fix for that duplication. Pure bookkeeping: never touches Web Audio
// nodes, so the owning instrument decides what to actually do with a claim/steal/
// refuse outcome.
//
// Policy decided for Step 1 (docs/Technical_Architecture_v5.md, "Pool-exhaustion
// behaviour"): steal-furthest + margin, 20% margin, replacing production's
// accidental silent-drop (audio-layers.js's `if (!slot) return;`).

export class PoolAllocator {
  constructor({ size, policy = 'margin', marginPct = 20 }) {
    this.size = size;
    this.policy = policy;       // 'margin' | 'steal' | 'refuse'
    this.marginPct = marginPct;
    this._slots = new Array(size).fill(null); // { featureId, dist } | null
    this._byFeature = new Map();               // featureId -> slotIndex
  }

  isActive(featureId) {
    return this._byFeature.has(featureId);
  }

  get activeCount() {
    return this._byFeature.size;
  }

  // Call once per in-range feature per tick/event. Returns one of:
  //   { action: 'update', slotIndex }                       — already active, distance refreshed
  //   { action: 'claim',  slotIndex }                        — free slot found
  //   { action: 'steal',  slotIndex, stolenFeatureId }        — pool full, took the furthest voice's slot
  //   { action: 'refuse' }                                    — pool full, held (margin not met, or refuse policy)
  claim(featureId, dist) {
    if (this._byFeature.has(featureId)) {
      const slotIndex = this._byFeature.get(featureId);
      this._slots[slotIndex].dist = dist;
      return { action: 'update', slotIndex };
    }

    const freeIndex = this._slots.findIndex(s => s === null);
    if (freeIndex !== -1) {
      this._slots[freeIndex] = { featureId, dist };
      this._byFeature.set(featureId, freeIndex);
      return { action: 'claim', slotIndex: freeIndex };
    }

    // Pool full — find the furthest currently-active slot.
    let furthestIndex = 0;
    for (let i = 1; i < this._slots.length; i++) {
      if (this._slots[i].dist > this._slots[furthestIndex].dist) furthestIndex = i;
    }
    const furthest = this._slots[furthestIndex];

    if (this.policy === 'refuse') {
      return { action: 'refuse' };
    }
    if (this.policy === 'margin') {
      const threshold = furthest.dist * (1 - this.marginPct / 100);
      if (dist >= threshold) return { action: 'refuse' };
    }

    const stolenFeatureId = furthest.featureId;
    this._byFeature.delete(stolenFeatureId);
    this._slots[furthestIndex] = { featureId, dist };
    this._byFeature.set(featureId, furthestIndex);
    return { action: 'steal', slotIndex: furthestIndex, stolenFeatureId };
  }

  release(featureId) {
    const slotIndex = this._byFeature.get(featureId);
    if (slotIndex === undefined) return -1;
    this._byFeature.delete(featureId);
    this._slots[slotIndex] = null;
    return slotIndex;
  }

  getSlot(featureId) {
    const slotIndex = this._byFeature.get(featureId);
    return slotIndex === undefined ? -1 : slotIndex;
  }

  activeFeatureIds() {
    return [...this._byFeature.keys()];
  }
}
