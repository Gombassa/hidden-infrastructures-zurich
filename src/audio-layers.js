/**
 * audio-layers.js — Web Audio API synthesis for all 6 infrastructure layers.
 *
 * Layers: tram electrical, water, sewage, electricity, telecom, fernwärme.
 * All synthesis is procedural (no samples). These are pipeline-validation placeholders,
 * not finished sound design.
 *
 * API:
 *   AudioLayers.init(audioContext)
 *   AudioLayers.update(proximity, listenerLat, listenerLng, heading)
 *   AudioLayers.onListenerMove(lat, lng, heading)   — call on GPS fix between tram ticks
 *   AudioLayers.stop()
 *   AudioLayers.LAYER_ENABLED  — object with per-layer boolean flags
 */

const ELEC_POOL_SIZE = 4;

// ── TRAM ELECTRICAL CONSTANTS ─────────────────────────────────────────────────
const HISS_COMB_DELAYS       = [0.0023, 0.0031, 0.0041, 0.0057, 0.0071, 0.0089]; // seconds
const HISS_COMB_FEEDBACK     = 0.7;
const FEEDER_HISS_RADIUS     = 25;    // metres — listener within this hears continuous hiss
const CRACKLE_FALLOFF_RADIUS = 150;   // metres — crackle gain → 0 at this distance
const DRONE_LFO_RATE_1       = 0.017; // Hz — ~60 s cycle
const DRONE_LFO_RATE_2       = 0.023; // Hz — ~43 s cycle, drifts against LFO 1
const DRONE_LFO_DEPTH        = 8;     // Hz — ±8 Hz sweep around centre frequency
const REVERB_DECAY           = 2.0;   // seconds
const REVERB_WET             = 0.03;  // 3% wet mix

const AudioLayers = (() => {
  // ── STATE ─────────────────────────────────────────────────────────────────
  let _ctx = null;

  // Tram electrical
  let _droneOsc1        = null;
  let _droneOsc2        = null;
  let _droneLfo1        = null;
  let _droneLfo2        = null;
  let _droneLfoGain1    = null;
  let _droneLfoGain2    = null;
  let _droneGain        = null; // GainNode — modulated by powerline proximity
  let _droneConvolver   = null;
  let _droneReverbGain  = null;
  let _idlePool         = null; // Array<hiss node> — 6 comb-filtered noise slots
  const _activeCrackleIds = new Set();
  let _lastFeeders      = [];
  let _lastListenerLat     = null;
  let _lastListenerLng     = null;
  let _lastListenerHeading = null;

  // Water
  const _waterDebounce  = new Set();

  // Sewage
  let _sewageSrc   = null;
  let _sewageGain  = null;
  let _sewageReady = false;

  // Electricity
  let _elecPool       = [];
  let _elecMasterGain = null;
  const _elecActive   = new Set();

  // Telecom
  const _telecomDebounce = new Set();
  let _telecomCableSrc   = null;
  let _telecomCableGain  = null;
  let _telecomCableReady = false;

  // Fernwärme
  let _fernOsc         = null;
  let _fernTremolo     = null;
  let _fernTremoloGain = null;
  let _fernMasterGain  = null;
  let _fernReady       = false;

  // ── PUBLIC FLAGS ──────────────────────────────────────────────────────────
  const LAYER_ENABLED = {
    tram:        true,
    water:       true,
    sewage:      true,
    electricity: true,
    telecom:     true,
    fernwaerme:  true,
  };

  // ── INIT ──────────────────────────────────────────────────────────────────
  let _initialized = false;

  function init(audioContext) {
    if (_initialized) return;
    _initialized = true;
    _ctx = audioContext;
    _initTramElectrical();
    _initSewage();
    _initElecPool();
    _initTelecomCable();
    _initFernwaerme();
  }

  // ── TRAM ELECTRICAL ───────────────────────────────────────────────────────

  function _feederToXYZ(feederLat, feederLng) {
    const lat     = _lastListenerLat;
    const lng     = _lastListenerLng;
    const heading = _lastListenerHeading;
    if (lat === null || lng === null || heading === null) return { x: 0, y: 0, z: -1 };
    const metersPerDegLat = 111320;
    const metersPerDegLng = 111320 * Math.cos(lat * Math.PI / 180);
    const dNorth = (feederLat - lat) * metersPerDegLat;
    const dEast  = (feederLng - lng) * metersPerDegLng;
    const headingRad = heading * Math.PI / 180;
    const x =  dEast  * Math.cos(headingRad) - dNorth * Math.sin(headingRad);
    const z = -(dEast * Math.sin(headingRad) + dNorth * Math.cos(headingRad));
    const dist = Math.sqrt(x * x + z * z) || 1;
    const scale = Math.min(dist, 500) / dist;
    return { x: x * scale / 500, y: 0, z: z * scale / 500 };
  }

  function _buildReverb(decaySeconds) {
    const length  = _ctx.sampleRate * decaySeconds;
    const impulse = _ctx.createBuffer(2, length, _ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    const convolver = _ctx.createConvolver();
    convolver.buffer = impulse;
    return convolver;
  }

  function _makeHissNode(combDelayTime) {
    const bufferSize = _ctx.sampleRate * 2;
    const buffer = _ctx.createBuffer(1, bufferSize, _ctx.sampleRate);
    const data   = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source   = _ctx.createBufferSource();
    source.buffer  = buffer;
    source.loop    = true;

    const delay    = _ctx.createDelay(0.02);
    delay.delayTime.value = combDelayTime;
    const feedback = _ctx.createGain();
    feedback.gain.value = HISS_COMB_FEEDBACK;
    const gain     = _ctx.createGain();
    gain.gain.value = 0;

    const panner = _ctx.createPanner();
    panner.panningModel  = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance   = 1;
    panner.maxDistance   = 500;
    panner.rolloffFactor = 1;
    panner.positionX.value = 0;
    panner.positionY.value = 0;
    panner.positionZ.value = -1;

    source.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(gain);
    gain.connect(panner);
    panner.connect(_ctx.destination);
    source.start();

    return { gain, delay, source, panner, feeder: null };
  }

  function _initTramElectrical() {
    // Drone — two detuned oscillators with independent dual-LFO frequency sweeps
    _droneOsc1 = _ctx.createOscillator();
    _droneOsc2 = _ctx.createOscillator();
    _droneOsc1.frequency.value = 110;
    _droneOsc2.frequency.value = 112;

    _droneLfo1 = _ctx.createOscillator();
    _droneLfoGain1 = _ctx.createGain();
    _droneLfo1.type = 'sine';
    _droneLfo1.frequency.value = DRONE_LFO_RATE_1;
    _droneLfoGain1.gain.value = DRONE_LFO_DEPTH;
    _droneLfo1.connect(_droneLfoGain1);
    _droneLfoGain1.connect(_droneOsc1.frequency);

    _droneLfo2 = _ctx.createOscillator();
    _droneLfoGain2 = _ctx.createGain();
    _droneLfo2.type = 'sine';
    _droneLfo2.frequency.value = DRONE_LFO_RATE_2;
    _droneLfoGain2.gain.value = DRONE_LFO_DEPTH;
    _droneLfo2.connect(_droneLfoGain2);
    _droneLfoGain2.connect(_droneOsc2.frequency);

    _droneGain = _ctx.createGain();
    _droneGain.gain.value = 0;

    // Reverb send off drone
    _droneConvolver  = _buildReverb(REVERB_DECAY);
    _droneReverbGain = _ctx.createGain();
    _droneReverbGain.gain.value = REVERB_WET;

    _droneOsc1.connect(_droneGain);
    _droneOsc2.connect(_droneGain);
    _droneGain.connect(_ctx.destination);
    _droneGain.connect(_droneConvolver);
    _droneConvolver.connect(_droneReverbGain);
    _droneReverbGain.connect(_ctx.destination);

    _droneOsc1.start();
    _droneOsc2.start();
    _droneLfo1.start();
    _droneLfo2.start();

    // Hiss pool — 6 comb-filtered noise nodes, each with a distinct delay time
    _idlePool = HISS_COMB_DELAYS.map(dt => _makeHissNode(dt));
  }

  function _updateHissGains(lat, lng, feeders) {
    if (!_ctx || lat === null || lng === null || !_idlePool) return;
    const nearby = feeders
      .map(f => {
        const dlat = (f.lat - lat) * 111320;
        const dlng = (f.lng - lng) * 111320 * Math.cos(lat * Math.PI / 180);
        return { f, dist: Math.sqrt(dlat * dlat + dlng * dlng) };
      })
      .filter(({ dist }) => dist < FEEDER_HISS_RADIUS)
      .sort((a, b) => a.dist - b.dist);

    for (let i = 0; i < _idlePool.length; i++) {
      const node = _idlePool[i];
      if (i < nearby.length) {
        const { f, dist } = nearby[i];
        const targetGain = LAYER_ENABLED.tram ? (1 - dist / FEEDER_HISS_RADIUS) * 0.15 : 0;
        node.gain.gain.setTargetAtTime(targetGain, _ctx.currentTime, 0.5);
        node.feeder = f;
        const pos = _feederToXYZ(f.lat, f.lng);
        node.panner.positionX.setTargetAtTime(pos.x, _ctx.currentTime, 0.1);
        node.panner.positionY.setTargetAtTime(pos.y, _ctx.currentTime, 0.1);
        node.panner.positionZ.setTargetAtTime(pos.z, _ctx.currentTime, 0.1);
      } else {
        node.gain.gain.setTargetAtTime(0, _ctx.currentTime, 0.5);
        node.feeder = null;
      }
    }
  }

  function _triggerCrackle(feederLat, feederLng, gainScalar) {
    const burstCount = 6;
    const spacing    = 0.050; // 50ms between burst onsets
    const bufLen     = Math.floor(_ctx.sampleRate * 0.020); // 20ms per burst

    const panner = _ctx.createPanner();
    panner.panningModel  = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance   = 1;
    panner.maxDistance   = 500;
    panner.rolloffFactor = 1;
    const pos = _feederToXYZ(feederLat, feederLng);
    panner.positionX.value = pos.x;
    panner.positionY.value = pos.y;
    panner.positionZ.value = pos.z;
    panner.connect(_ctx.destination);

    for (let i = 0; i < burstCount; i++) {
      const t0        = _ctx.currentTime + i * spacing;
      const amplitude = (0.1 + i * 0.1) * gainScalar; // 0.1→0.6 scaled by distance

      const buffer = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
      const data   = buffer.getChannelData(0);
      for (let s = 0; s < bufLen; s++) data[s] = Math.random() * 2 - 1;

      const source = _ctx.createBufferSource();
      source.buffer = buffer;

      const filter = _ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 1200;

      const gain = _ctx.createGain();
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(amplitude, t0 + 0.002);  // 2ms attack
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.012); // 10ms decay

      source.connect(filter);
      filter.connect(gain);
      gain.connect(panner);
      source.start(t0);
      source.stop(t0 + 0.020);
    }
  }

  // ── SEWAGE ────────────────────────────────────────────────────────────────

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

  // ── ELECTRICITY ───────────────────────────────────────────────────────────

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

  // ── TELECOM ───────────────────────────────────────────────────────────────

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

  // ── FERNWÄRME ─────────────────────────────────────────────────────────────

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
    // (multiplicative: 0.6–1.4 range). Master gain is a clean on/off gate.
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

  // ── ONE-SHOT WATER PULSE ──────────────────────────────────────────────────

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
    const t0     = _ctx.currentTime;
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

    src.onended = () => _waterDebounce.delete(id);
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  function update(proximity, listenerLat, listenerLng, heading) {
    if (!_ctx || !_initialized) return;
    const t = _ctx.currentTime;

    // Cache listener position — used by spatial audio helpers (_feederToXYZ)
    _lastListenerLat     = listenerLat;
    _lastListenerLng     = listenerLng;
    _lastListenerHeading = heading;

    // ── TRAM ELECTRICAL ────────────────────────────────────────────────────
    // reads: proximity.feeders, proximity.nearestPowerlineDist
    const feeders = proximity.feeders || [];
    if (LAYER_ENABLED.tram) {
      // Drone: gain modulated by nearest tram trasse distance (20m→5m)
      if (_droneGain) {
        const dist = proximity.nearestPowerlineDist;
        let targetGain;
        if (dist === null || dist > 20) targetGain = 0;
        else if (dist <= 5)             targetGain = 0.3;
        else                            targetGain = 0.01 + (20 - dist) / 15 * (0.3 - 0.01);
        _droneGain.gain.setTargetAtTime(targetGain, t, 2.0);
      }

      // Crackle: fire once per feeder entry (debounced via _activeCrackleIds)
      const triggeredIds = new Set(feeders.filter(f => f.triggered).map(f => f.id));
      for (const id of _activeCrackleIds) {
        if (!triggeredIds.has(id)) _activeCrackleIds.delete(id);
      }
      for (const f of feeders.filter(f => f.triggered)) {
        if (!_activeCrackleIds.has(f.id)) {
          let gainScalar = 1;
          if (listenerLat !== null && listenerLng !== null) {
            const dlat = (f.lat - listenerLat) * 111320;
            const dlng = (f.lng - listenerLng) * 111320 * Math.cos(listenerLat * Math.PI / 180);
            const dist = Math.sqrt(dlat * dlat + dlng * dlng);
            gainScalar = Math.pow(1 - Math.min(dist / CRACKLE_FALLOFF_RADIUS, 1), 2);
          }
          _triggerCrackle(f.lat, f.lng, gainScalar);
          _activeCrackleIds.add(f.id);
        }
      }

      // Hiss: continuous proximity-scaled texture on nearest feeders
      _lastFeeders = feeders;
      _updateHissGains(listenerLat, listenerLng, feeders);
    } else {
      // Layer disabled — ramp all tram gains to silence
      if (_droneGain) _droneGain.gain.setTargetAtTime(0, t, 0.5);
      if (_idlePool) {
        for (const node of _idlePool) node.gain.gain.setTargetAtTime(0, t, 0.5);
      }
      _lastFeeders = feeders;
    }

    // ── WATER ──────────────────────────────────────────────────────────────
    // reads: proximity.water.pipes, proximity.water.fittings
    if (LAYER_ENABLED.water) {
      const inRangePipes    = (proximity.water?.pipes    || []).filter(f => f.triggered);
      const inRangeFittings = (proximity.water?.fittings || []).filter(f => f.triggered);
      if (inRangePipes.length > 0) {
        const nearest = inRangePipes.reduce((a, b) => a.dist < b.dist ? a : b);
        _triggerWaterPulse(nearest.id, nearest.dist, false);
      }
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
      for (const p of pipes) { if (p.dist < nearestDist) nearestDist = p.dist; }
      const SEWAGE_RADIUS = 80;
      const targetGain = nearestDist <= SEWAGE_RADIUS
        ? (1 - nearestDist / SEWAGE_RADIUS) * 0.18
        : 0;
      _sewageGain.gain.setTargetAtTime(targetGain, t, 1.5);
    } else if (!LAYER_ENABLED.sewage && _sewageGain) {
      _sewageGain.gain.setTargetAtTime(0, t, 0.5);
    }

    // ── ELECTRICITY ────────────────────────────────────────────────────────
    // reads: proximity.electricity.nodes, proximity.electricity.cables
    if (LAYER_ENABLED.electricity) {
      const nodes  = proximity.electricity?.nodes  || [];
      const cables = proximity.electricity?.cables || [];
      const inRangeNodeIds = new Set(nodes.filter(n => n.triggered).map(n => n.id));
      for (const id of [..._elecActive]) {
        if (!inRangeNodeIds.has(id)) _elecRelease(id);
      }
      for (const id of inRangeNodeIds) _elecClaim(id);
      let nearestCableDist = Infinity;
      for (const c of cables) { if (c.dist < nearestCableDist) nearestCableDist = c.dist; }
      const ELEC_CABLE_RADIUS = 40;
      let masterTarget = _elecActive.size > 0 ? 0.175 : 0;
      if (nearestCableDist <= ELEC_CABLE_RADIUS) {
        masterTarget = Math.min(0.25, masterTarget + (1 - nearestCableDist / ELEC_CABLE_RADIUS) * 0.075);
      }
      _elecMasterGain.gain.setTargetAtTime(masterTarget, t, 0.8);
    } else if (!LAYER_ENABLED.electricity && _elecMasterGain) {
      _elecMasterGain.gain.setTargetAtTime(0, t, 0.5);
    }

    // ── TELECOM ────────────────────────────────────────────────────────────
    // reads: proximity.telecom.nodes, proximity.telecom.cables
    if (LAYER_ENABLED.telecom) {
      const nodes  = proximity.telecom?.nodes  || [];
      const cables = proximity.telecom?.cables || [];
      for (const n of nodes.filter(n => n.triggered)) _triggerTelecomChirp(n.id);
      let nearestCableDist = Infinity;
      for (const c of cables) { if (c.dist < nearestCableDist) nearestCableDist = c.dist; }
      const TELECOM_CABLE_RADIUS = 30;
      const cableTarget = (nearestCableDist <= TELECOM_CABLE_RADIUS && _telecomCableReady)
        ? (1 - nearestCableDist / TELECOM_CABLE_RADIUS) * 0.06
        : 0;
      if (_telecomCableReady) _telecomCableGain.gain.setTargetAtTime(cableTarget, t, 0.8);
    } else if (!LAYER_ENABLED.telecom && _telecomCableGain) {
      _telecomCableGain.gain.setTargetAtTime(0, t, 0.5);
    }

    // ── FERNWÄRME ──────────────────────────────────────────────────────────
    // reads: proximity.fernwaerme.pipes
    if (LAYER_ENABLED.fernwaerme && _fernReady) {
      const pipes = proximity.fernwaerme?.pipes || [];
      let nearestDist = Infinity;
      for (const p of pipes) { if (p.dist < nearestDist) nearestDist = p.dist; }
      const FERN_RADIUS = 60;
      const fernTarget = nearestDist <= FERN_RADIUS
        ? (1 - nearestDist / FERN_RADIUS) * 0.12
        : 0;
      _fernMasterGain.gain.setTargetAtTime(fernTarget, t, 2.5);
    } else if (!LAYER_ENABLED.fernwaerme && _fernMasterGain) {
      _fernMasterGain.gain.setTargetAtTime(0, t, 0.5);
    }
  }

  // ── ON LISTENER MOVE ─────────────────────────────────────────────────────
  // Called from GPS watchPosition between TramEngine ticks.
  // Updates hiss panner positions and gains as the listener moves.
  function onListenerMove(lat, lng, heading) {
    if (!_ctx || !_initialized) return;
    _lastListenerLat     = lat;
    _lastListenerLng     = lng;
    _lastListenerHeading = heading;
    if (LAYER_ENABLED.tram) {
      _updateHissGains(lat, lng, _lastFeeders);
    }
  }

  // ── STOP ──────────────────────────────────────────────────────────────────
  function stop() {
    if (!_ctx) return;
    const t   = _ctx.currentTime;
    const TC  = 0.3;
    const stopAt = t + TC * 3;

    // Ramp all continuous gains to silence
    if (_droneGain)       _droneGain.gain.setTargetAtTime(0, t, TC);
    if (_idlePool) {
      for (const node of _idlePool) node.gain.gain.setTargetAtTime(0, t, TC);
    }
    if (_sewageGain)       _sewageGain.gain.setTargetAtTime(0, t, TC);
    if (_elecMasterGain)   _elecMasterGain.gain.setTargetAtTime(0, t, TC);
    for (const slot of _elecPool) slot.slotGain.gain.setTargetAtTime(0, t, TC);
    if (_telecomCableGain) _telecomCableGain.gain.setTargetAtTime(0, t, TC);
    if (_fernMasterGain)   _fernMasterGain.gain.setTargetAtTime(0, t, TC);

    // Schedule oscillator/source stops after fade
    try { if (_droneOsc1) _droneOsc1.stop(stopAt); } catch {}
    try { if (_droneOsc2) _droneOsc2.stop(stopAt); } catch {}
    try { if (_droneLfo1) _droneLfo1.stop(stopAt); } catch {}
    try { if (_droneLfo2) _droneLfo2.stop(stopAt); } catch {}
    if (_idlePool) {
      for (const node of _idlePool) try { node.source.stop(stopAt); } catch {}
    }
    try { if (_sewageSrc)       _sewageSrc.stop(stopAt);       } catch {}
    try { if (_telecomCableSrc) _telecomCableSrc.stop(stopAt); } catch {}
    for (const slot of _elecPool) {
      try { slot.osc1.stop(stopAt); slot.osc2.stop(stopAt); slot.lfo.stop(stopAt); } catch {}
    }
    try { if (_fernOsc)     _fernOsc.stop(stopAt);     } catch {}
    try { if (_fernTremolo) _fernTremolo.stop(stopAt); } catch {}

    // Null all references — next init() creates fresh nodes
    _droneOsc1 = null;   _droneOsc2 = null;
    _droneLfo1 = null;   _droneLfo2 = null;
    _droneLfoGain1 = null; _droneLfoGain2 = null;
    _droneGain = null;   _droneConvolver = null; _droneReverbGain = null;
    _idlePool = null;
    _activeCrackleIds.clear();
    _lastFeeders = [];

    _sewageSrc = null;        _sewageGain = null;       _sewageReady = false;
    _elecPool = [];           _elecMasterGain = null;   _elecActive.clear();
    _telecomCableSrc = null;  _telecomCableGain = null; _telecomCableReady = false;
    _fernOsc = null; _fernTremolo = null; _fernTremoloGain = null;
    _fernMasterGain = null;   _fernReady = false;
    _waterDebounce.clear();
    _telecomDebounce.clear();
    _initialized = false;
  }

  // ── SET LAYER ENABLED ─────────────────────────────────────────────────────
  // Call from toggle handler instead of writing LAYER_ENABLED directly.
  // Immediately ramps the layer's continuous gains to silence on disable
  // so audio stops within ~50ms rather than waiting for the next update() tick.
  function setLayerEnabled(layer, enabled) {
    LAYER_ENABLED[layer] = enabled;
    if (!_ctx || !_initialized || enabled) return;
    const t  = _ctx.currentTime;
    const TC = 0.05; // ~50ms — feels immediate
    switch (layer) {
      case 'tram':
        if (_droneGain) _droneGain.gain.setTargetAtTime(0, t, TC);
        if (_idlePool) for (const node of _idlePool) node.gain.gain.setTargetAtTime(0, t, TC);
        break;
      case 'sewage':
        if (_sewageGain) _sewageGain.gain.setTargetAtTime(0, t, TC);
        break;
      case 'electricity':
        if (_elecMasterGain) _elecMasterGain.gain.setTargetAtTime(0, t, TC);
        for (const slot of _elecPool) slot.slotGain.gain.setTargetAtTime(0, t, TC);
        _elecActive.clear();
        break;
      case 'telecom':
        if (_telecomCableGain) _telecomCableGain.gain.setTargetAtTime(0, t, TC);
        break;
      case 'fernwaerme':
        if (_fernMasterGain) _fernMasterGain.gain.setTargetAtTime(0, t, TC);
        break;
      // water: one-shot pulses only, no continuous gain to ramp
    }
  }

  return { init, update, onListenerMove, stop, setLayerEnabled, LAYER_ENABLED };
})();

export default AudioLayers;
