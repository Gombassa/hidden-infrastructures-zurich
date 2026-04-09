/**
 * audio-layers.js — Placeholder Web Audio API synthesis for 5 new infrastructure layers.
 *
 * Layers: water, sewage, electricity, telecom, fernwärme.
 * All synthesis is procedural (no samples). These are pipeline-validation placeholders,
 * not finished sound design.
 *
 * API:
 *   AudioLayers.init(audioContext)
 *   AudioLayers.update(proximity, listenerLat, listenerLng, heading)
 *   AudioLayers.stop()
 *   AudioLayers.LAYER_ENABLED  — object with per-layer boolean flags
 */

const ELEC_POOL_SIZE = 4;

const AudioLayers = (() => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  let _ctx = null;

  // Water
  const _waterDebounce  = new Set(); // feature IDs that have fired a pulse this tick

  // Sewage
  let _sewageSrc   = null; // BufferSource — held for stop()
  let _sewageGain  = null; // GainNode — modulated by distance
  let _sewageReady = false;

  // Electricity
  let _elecPool      = [];  // array of slot objects { osc1, osc2, lfo, lfoGain, slotGain, active }
  let _elecMasterGain = null;
  const _elecActive  = new Set(); // feature IDs occupying a pool slot

  // Telecom
  const _telecomDebounce = new Set();
  let _telecomCableSrc   = null; // BufferSource — held for stop()
  let _telecomCableGain  = null;
  let _telecomCableReady = false;

  // Fernwärme
  let _fernOsc        = null;
  let _fernTremolo    = null;
  let _fernTremoloGain = null;
  let _fernMasterGain = null;
  let _fernReady      = false;

  // ── PUBLIC FLAGS ──────────────────────────────────────────────────────────
  const LAYER_ENABLED = {
    water:      true,
    sewage:     true,
    electricity: true,
    telecom:    true,
    fernwaerme: true,
  };

  // ── INIT ──────────────────────────────────────────────────────────────────
  let _initialized = false;

  function init(audioContext) {
    if (_initialized) return;
    _initialized = true;
    _ctx = audioContext;
    _initSewage();
    _initElecPool();
    _initTelecomCable();
    _initFernwaerme();
  }

  function _initSewage() {
    const bufSize = _ctx.sampleRate * 2;
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

    _sewageSrc = _ctx.createBufferSource();
    _sewageSrc.buffer = buf;
    _sewageSrc.loop = true;

    const lp = _ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    lp.Q.value = 0.8;

    _sewageGain = _ctx.createGain();
    _sewageGain.gain.value = 0;

    _sewageSrc.connect(lp);
    lp.connect(_sewageGain);
    _sewageGain.connect(_ctx.destination);
    _sewageSrc.start();
    _sewageReady = true;
  }

  function _initElecPool() {
    _elecMasterGain = _ctx.createGain();
    _elecMasterGain.gain.value = 0;
    _elecMasterGain.connect(_ctx.destination);

    for (let i = 0; i < ELEC_POOL_SIZE; i++) {
      const osc1 = _ctx.createOscillator();
      const osc2 = _ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.value = 1500;
      osc2.frequency.value = 1503;

      const lfo = _ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.4;
      const lfoGain = _ctx.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);

      const slotGain = _ctx.createGain();
      slotGain.gain.value = 0;
      lfoGain.connect(slotGain.gain);

      osc1.connect(slotGain);
      osc2.connect(slotGain);
      slotGain.connect(_elecMasterGain);

      osc1.start();
      osc2.start();
      lfo.start();

      _elecPool.push({ osc1, osc2, lfo, lfoGain, slotGain, active: false, featureId: null });
    }
  }

  function _initTelecomCable() {
    const bufSize = _ctx.sampleRate * 2;
    const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

    _telecomCableSrc = _ctx.createBufferSource();
    _telecomCableSrc.buffer = buf;
    _telecomCableSrc.loop = true;

    const hp = _ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 6000;

    _telecomCableGain = _ctx.createGain();
    _telecomCableGain.gain.value = 0;

    _telecomCableSrc.connect(hp);
    hp.connect(_telecomCableGain);
    _telecomCableGain.connect(_ctx.destination);
    _telecomCableSrc.start();
    _telecomCableReady = true;
  }

  function _initFernwaerme() {
    _fernOsc = _ctx.createOscillator();
    _fernOsc.type = 'sine';
    _fernOsc.frequency.value = 60;

    _fernTremolo = _ctx.createOscillator();
    _fernTremolo.type = 'sine';
    _fernTremolo.frequency.value = 0.3;
    _fernTremoloGain = _ctx.createGain();
    _fernTremoloGain.gain.value = 0.4; // tremolo depth ±0.4 around carrier base of 1.0
    _fernTremolo.connect(_fernTremoloGain);

    // Carrier gain sits between oscillator and master. Tremolo modulates it around 1.0
    // (multiplicative effect: 0.6–1.4 range). Master gain is a clean on/off gate —
    // when master = 0, output is 0 regardless of LFO state, so stop() works correctly.
    const carrierGain = _ctx.createGain();
    carrierGain.gain.value = 1.0;
    _fernTremoloGain.connect(carrierGain.gain);

    _fernMasterGain = _ctx.createGain();
    _fernMasterGain.gain.value = 0;

    _fernOsc.connect(carrierGain);
    carrierGain.connect(_fernMasterGain);
    _fernMasterGain.connect(_ctx.destination);
    _fernOsc.start();
    _fernTremolo.start();
    _fernReady = true;
  }

  // ── ONE-SHOT TRIGGERS ─────────────────────────────────────────────────────

  function _triggerWaterPulse(id, dist, isFitting) {
    if (_waterDebounce.has(id)) return;
    _waterDebounce.add(id);

    const freq     = isFitting ? 1200 : 800;
    const duration = isFitting ? 0.08  : 0.25;
    const maxGain  = 0.12;

    const bufLen = Math.floor(_ctx.sampleRate * duration);
    const buf = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = _ctx.createBufferSource();
    src.buffer = buf;

    const bp = _ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = 3;

    const gain = _ctx.createGain();
    const t0 = _ctx.currentTime;
    const attack = 0.005;
    const decay  = duration * 0.8;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(maxGain, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + attack + decay);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(_ctx.destination);
    src.start(t0);
    src.stop(t0 + duration);

    // release debounce after one update cycle so re-entry is possible
    src.onended = () => _waterDebounce.delete(id);
  }

  function _triggerTelecomChirp(id) {
    if (_telecomDebounce.has(id)) return;
    _telecomDebounce.add(id);

    const duration = 0.2;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, _ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(4000, _ctx.currentTime + duration);

    const gain = _ctx.createGain();
    const t0 = _ctx.currentTime;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);

    osc.onended = () => _telecomDebounce.delete(id);
  }

  // ── ELECTRICITY POOL MANAGEMENT ───────────────────────────────────────────

  function _elecClaim(featureId) {
    if (_elecActive.has(featureId)) return;
    const slot = _elecPool.find(s => !s.active);
    if (!slot) return;
    slot.active = true;
    slot.featureId = featureId;
    slot.slotGain.gain.setTargetAtTime(0.06, _ctx.currentTime, 0.3);
    _elecActive.add(featureId);
  }

  function _elecRelease(featureId) {
    const slot = _elecPool.find(s => s.featureId === featureId);
    if (!slot) return;
    slot.slotGain.gain.setTargetAtTime(0, _ctx.currentTime, 0.5);
    slot.active = false;
    slot.featureId = null;
    _elecActive.delete(featureId);
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  function update(proximity, listenerLat, listenerLng, heading) {
    if (!_ctx || !_initialized) return;
    const t = _ctx.currentTime;

    // ── WATER ──────────────────────────────────────────────────────────────
    // reads: proximity.water.pipes, proximity.water.fittings
    if (LAYER_ENABLED.water) {
      // Trigger pulse on nearest newly-in-range pipe or fitting
      const inRangePipes    = (proximity.water?.pipes    || []).filter(f => f.triggered);
      const inRangeFittings = (proximity.water?.fittings || []).filter(f => f.triggered);

      // Trigger only the nearest newly-in-range pipe
      if (inRangePipes.length > 0) {
        const nearest = inRangePipes.reduce((a, b) => a.dist < b.dist ? a : b);
        _triggerWaterPulse(nearest.id, nearest.dist, false);
      }
      // Trigger only the nearest newly-in-range fitting
      if (inRangeFittings.length > 0) {
        const nearest = inRangeFittings.reduce((a, b) => a.dist < b.dist ? a : b);
        _triggerWaterPulse(nearest.id, nearest.dist, true);
      }
    }

    // ── SEWAGE ─────────────────────────────────────────────────────────────
    // reads: proximity.sewage.pipes
    if (LAYER_ENABLED.sewage && _sewageReady) {
      const pipes = proximity.sewage?.pipes || [];
      let nearestDist = Infinity;
      for (const p of pipes) {
        if (p.dist < nearestDist) nearestDist = p.dist;
      }
      let targetGain = 0;
      const SEWAGE_RADIUS = 80;
      if (nearestDist <= SEWAGE_RADIUS) {
        targetGain = (1 - nearestDist / SEWAGE_RADIUS) * 0.18;
      }
      _sewageGain.gain.setTargetAtTime(targetGain, t, 1.5);
    }

    // ── ELECTRICITY ────────────────────────────────────────────────────────
    // reads: proximity.electricity.nodes, proximity.electricity.cables
    if (LAYER_ENABLED.electricity) {
      const nodes  = proximity.electricity?.nodes  || [];
      const cables = proximity.electricity?.cables || [];

      // Pool: claim slots for in-range nodes, release out-of-range
      const inRangeNodeIds = new Set(nodes.filter(n => n.triggered).map(n => n.id));
      for (const id of [..._elecActive]) {
        if (!inRangeNodeIds.has(id)) _elecRelease(id);
      }
      for (const id of inRangeNodeIds) {
        _elecClaim(id);
      }

      // Master gain modulated by nearest cable distance
      let nearestCableDist = Infinity;
      for (const c of cables) {
        if (c.dist < nearestCableDist) nearestCableDist = c.dist;
      }
      const ELEC_CABLE_RADIUS = 40;
      let masterTarget = _elecActive.size > 0 ? 0.7 : 0;
      if (nearestCableDist <= ELEC_CABLE_RADIUS) {
        const cableBoost = (1 - nearestCableDist / ELEC_CABLE_RADIUS) * 0.3;
        masterTarget = Math.min(1.0, masterTarget + cableBoost);
      }
      _elecMasterGain.gain.setTargetAtTime(masterTarget, t, 0.8);
    }

    // ── TELECOM ────────────────────────────────────────────────────────────
    // reads: proximity.telecom.nodes, proximity.telecom.cables
    if (LAYER_ENABLED.telecom) {
      const nodes  = proximity.telecom?.nodes  || [];
      const cables = proximity.telecom?.cables || [];

      // Chirp on newly-in-range nodes
      for (const n of nodes.filter(n => n.triggered)) {
        _triggerTelecomChirp(n.id);
      }

      // Cable: continuous high-freq texture modulated by distance
      let nearestCableDist = Infinity;
      for (const c of cables) {
        if (c.dist < nearestCableDist) nearestCableDist = c.dist;
      }
      const TELECOM_CABLE_RADIUS = 30;
      let cableTarget = 0;
      if (nearestCableDist <= TELECOM_CABLE_RADIUS && _telecomCableReady) {
        cableTarget = (1 - nearestCableDist / TELECOM_CABLE_RADIUS) * 0.06;
      }
      if (_telecomCableReady) {
        _telecomCableGain.gain.setTargetAtTime(cableTarget, t, 0.8);
      }
    }

    // ── FERNWÄRME ──────────────────────────────────────────────────────────
    // reads: proximity.fernwaerme.pipes
    if (LAYER_ENABLED.fernwaerme && _fernReady) {
      const pipes = proximity.fernwaerme?.pipes || [];
      let nearestDist = Infinity;
      for (const p of pipes) {
        if (p.dist < nearestDist) nearestDist = p.dist;
      }
      const FERN_RADIUS = 60;
      let fernTarget = 0;
      if (nearestDist <= FERN_RADIUS) {
        fernTarget = (1 - nearestDist / FERN_RADIUS) * 0.12;
      }
      // tremolo LFO adds ±0.4 * fernTarget; base gain must accommodate that
      _fernMasterGain.gain.setTargetAtTime(fernTarget, t, 2.5);
    }
  }

  // ── STOP ──────────────────────────────────────────────────────────────────
  function stop() {
    if (!_ctx) return;
    const t = _ctx.currentTime;
    const TC = 0.3; // fade time constant (seconds)

    // Ramp all continuous-layer gains to silence
    if (_sewageGain)       _sewageGain.gain.setTargetAtTime(0, t, TC);
    if (_elecMasterGain)   _elecMasterGain.gain.setTargetAtTime(0, t, TC);
    for (const slot of _elecPool) slot.slotGain.gain.setTargetAtTime(0, t, TC);
    if (_telecomCableGain) _telecomCableGain.gain.setTargetAtTime(0, t, TC);
    if (_fernMasterGain)   _fernMasterGain.gain.setTargetAtTime(0, t, TC);

    // Schedule source/oscillator stops after ~3 time constants (≥95% decayed)
    const stopAt = t + TC * 3;
    try { if (_sewageSrc)       _sewageSrc.stop(stopAt);       } catch {}
    try { if (_telecomCableSrc) _telecomCableSrc.stop(stopAt); } catch {}
    for (const slot of _elecPool) {
      try { slot.osc1.stop(stopAt); slot.osc2.stop(stopAt); slot.lfo.stop(stopAt); } catch {}
    }
    try { if (_fernOsc)     _fernOsc.stop(stopAt);     } catch {}
    try { if (_fernTremolo) _fernTremolo.stop(stopAt); } catch {}

    // Null all references synchronously — next init() creates fresh nodes
    _sewageSrc = null;        _sewageGain = null;       _sewageReady = false;
    _elecPool = [];           _elecMasterGain = null;
    _elecActive.clear();
    _telecomCableSrc = null;  _telecomCableGain = null; _telecomCableReady = false;
    _fernOsc = null; _fernTremolo = null; _fernTremoloGain = null;
    _fernMasterGain = null;   _fernReady = false;
    _waterDebounce.clear();
    _telecomDebounce.clear();
    _initialized = false;
  }

  return { init, update, stop, LAYER_ENABLED };
})();

export default AudioLayers;
