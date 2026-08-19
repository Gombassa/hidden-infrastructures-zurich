// instrument-base.js — shared lifecycle base for Phase 3 instrument modules.
// Pure logic + Web Audio: no DOM dependencies. See docs/Technical_Architecture_v5.md
// ("The interface contract") for why this shape (Option A) was chosen over a
// declarative-config runner (Option B) or an unenforced duck-typed shape (Option C).

export class Instrument {
  constructor(ctx, outputNode) {
    this.ctx = ctx;
    this.outputNode = outputNode;
    this._trackedNodes = [];
  }

  // Subclasses call this for every AudioNode that needs stopping/disconnecting
  // on destroy() — oscillators and buffer sources need .stop(), plain gain/filter
  // nodes only need .disconnect(); track() figures out which from the node type.
  _track(node) {
    this._trackedNodes.push(node);
    return node;
  }

  // Ramps a gain node to (near-)silence then tears down every tracked node after
  // `tailSeconds`. Centralises the ramp-then-stop-then-disconnect pattern that
  // was previously re-implemented per-layer in audio-layers.js (e.g. release()/
  // teardown() in the hiss-voice prototype, stop() in the electricity pool).
  _teardown(envGain, tailSeconds = 0.3) {
    const t = this.ctx.currentTime;
    if (envGain) {
      envGain.gain.cancelScheduledValues(t);
      envGain.gain.setTargetAtTime(0.0001, t, tailSeconds / 3);
    }
    const stopAt = t + tailSeconds;
    for (const node of this._trackedNodes) {
      try { node.stop && node.stop(stopAt); } catch (e) { /* already stopped */ }
    }
    setTimeout(() => {
      for (const node of this._trackedNodes) {
        try { node.disconnect(); } catch (e) { /* already disconnected */ }
      }
      this._trackedNodes = [];
    }, (tailSeconds + 0.05) * 1000);
  }

  // params: whatever ProximityEngine emits for this behaviour's feature(s),
  // called once per TramEngine tick. One-shot instruments (no continuous state)
  // can leave this as a no-op and rely on trigger() alone.
  update(params) {}

  // params: the single feature that just crossed into trigger range. One-shot
  // and pool instruments both implement this; continuous-only instruments can
  // leave it as a no-op.
  trigger(params) {}

  // Full teardown — ramps to silence and disconnects every tracked node.
  // Default implementation assumes no shared envelope; subclasses with a
  // single master gain should override to call _teardown(masterGain).
  destroy() {
    this._teardown(null, 0.3);
  }
}
