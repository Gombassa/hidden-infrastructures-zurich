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

const ELEC_POOL_SIZE = 8;
const TELECOM_BURST_POOL_SIZE = 4;
const TELECOM_BURST_RATES = [22, 38, 54, 78]; // Hz — amplitude gate rates per slot

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

  // Water — Map<id, lastTriggerMs> for 30s cooldown re-trigger
  const _waterLastTrigger   = new Map();
  let   _waterDripTimer     = null;
  let   _waterDripRate      = 0;      // drips/sec, 0 = silent
  let   _waterKnockTimer    = null;   // alongside loop timer
  let   _waterKnockActive   = false;  // true while listener alongside a pipe
  const _waterCrossingCooldown = new Map(); // id → lastCrossMs, prevents double-fire

  // Sewage
  let _sewageSrc   = null;
  let _sewageGain  = null;
  let _sewageReady = false;
  let _sewageGurgleTimer   = null;   // rhythmic pulse below 20m
  let _sewageGurgleActive  = false;
  let _sewageKnockTimer    = null;   // alongside loop
  let _sewageKnockActive   = false;
  const _sewageCrossingCooldown  = new Map();
  const _sewageJunctionCooldown  = new Map();

  // Electricity
  let _elecPool       = [];
  let _elecMasterGain = null;
  const _elecActive   = new Set();
  let   _elecSnapTimer  = null;    // alongside loop
  let   _elecSnapActive = false;
  const _elecCrossingCooldown = new Map();

  // Telecom
  const _telecomDebounce          = new Set();    // prevents chirp re-fire before osc.onended
  const _telecomNodeDwell         = new Map();    // id → firstSeenMs — dwell tracking
  const _telecomHandshakeCooldown = new Map();    // id → lastMs — 8s cooldown per node
  let _telecomBurstPool           = [];           // [{src, lfo, lfoGain, slotGain, baseRate}]
  let _telecomBurstMasterGain     = null;
  let _telecomBurstReady          = false;
  const _telecomCrossingCooldown  = new Map();    // id → lastMs — cable crossing
  let _telecomSnapTimer           = null;         // alongside loop
  let _telecomSnapActive          = false;

  // Fernwärme
  let _fernOsc         = null;
  let _fernTremolo     = null;
  let _fernTremoloGain = null;
  let _fernMasterGain  = null;
  let _fernPanner      = null;   // StereoPanner — bearing-driven left/right
  let _fernReady       = false;
  let _fernKnockTimer  = null;   // alongside loop
  let _fernKnockActive = false;
  const _fernCrossingCooldown = new Map();

  // Shared density reverb
  let _sharedReverbBus = null;  // GainNode — aggregates sends from all continuous layers
  let _sharedConvolver = null;  // ConvolverNode
  let _sharedReverbOut = null;  // GainNode — wet level driven by density score (0-6)

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
    _initSharedReverb();   // must come first — layers send into it during their own init
    _initTramElectrical();
    _initSewage();
    _initElecPool();
    _initTelecomBurst();
    _initFernwaerme();
  }

  function _initSharedReverb() {
    _sharedReverbBus = _ctx.createGain();
    _sharedReverbBus.gain.value = 1.0;
    _sharedConvolver = _buildReverb(1.8); // shorter than tram's 2.0s — more space, less wash
    _sharedReverbOut = _ctx.createGain();
    _sharedReverbOut.gain.value = 0;
    _sharedReverbBus.connect(_sharedConvolver);
    _sharedConvolver.connect(_sharedReverbOut);
    _sharedReverbOut.connect(_ctx.destination);
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
    _droneGain.connect(_sharedReverbBus);
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
    _sewageGain.connect(_sharedReverbBus);
    _sewageSrc.start();
    _sewageReady = true;
  }

  function _triggerSewageGurgle() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime, dur = 0.15;
    const buf = _ctx.createBuffer(1, Math.floor(_ctx.sampleRate * dur), _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource(); src.buffer = buf;
    const bp = _ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 100; bp.Q.value = 2.5;
    const g = _ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.06, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(_ctx.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  function _scheduleSewageGurgle() {
    if (!_initialized || !_sewageGurgleActive) { _sewageGurgleTimer = null; return; }
    _triggerSewageGurgle();
    // Random interval 1.25s–5s (= 0.8Hz–0.2Hz)
    const interval = 1250 + Math.random() * 3750;
    _sewageGurgleTimer = setTimeout(_scheduleSewageGurgle, interval);
  }

  function _setSewageGurgleActive(active) {
    if (active === _sewageGurgleActive) return;
    _sewageGurgleActive = active;
    if (active && _sewageGurgleTimer === null) _scheduleSewageGurgle();
  }

  // Junction thud — louder, very low frequency burst
  function _triggerSewageThud() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime, dur = 0.6;
    const buf = _ctx.createBuffer(1, Math.floor(_ctx.sampleRate * dur), _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource(); src.buffer = buf;
    const bp = _ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 55; bp.Q.value = 3;
    const g = _ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.14, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(_ctx.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  // Crossing transient — mid-low thump
  function _triggerSewageCrossing() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime, dur = 0.35;
    const buf = _ctx.createBuffer(1, Math.floor(_ctx.sampleRate * dur), _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource(); src.buffer = buf;
    const bp = _ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 200; bp.Q.value = 3.5;
    const g = _ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(_ctx.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  // Alongside loop — slow looping gurgle while walking parallel to a sewage pipe
  function _scheduleSewageKnock() {
    if (!_initialized || !_sewageKnockActive) { _sewageKnockTimer = null; return; }
    _triggerSewageGurgle();
    const base = 4000, jitter = base * 0.35 * (Math.random() * 2 - 1);
    _sewageKnockTimer = setTimeout(_scheduleSewageKnock, base + jitter);
  }

  function _setSewageKnockActive(active) {
    if (active === _sewageKnockActive) return;
    _sewageKnockActive = active;
    if (active && _sewageKnockTimer === null) _scheduleSewageKnock();
  }

  // ── ELECTRICITY ───────────────────────────────────────────────────────────

  function _initElecPool() {
    _elecMasterGain = _ctx.createGain();
    _elecMasterGain.gain.value = 0;
    _elecMasterGain.connect(_ctx.destination);
    _elecMasterGain.connect(_sharedReverbBus);

    for (let i = 0; i < ELEC_POOL_SIZE; i++) {
      const osc1 = _ctx.createOscillator();
      const osc2 = _ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      // Spread frequencies evenly across 1490–1510Hz; osc2 offset +3Hz per slot for slight beating
      const baseFreq = 1490 + (i / (ELEC_POOL_SIZE - 1)) * 20;
      osc1.frequency.value = baseFreq;
      osc2.frequency.value = baseFreq + 3;

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

  // Cable crossing snap/zap — short high-frequency electrical burst
  function _triggerElecSnap() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime, dur = 0.08;
    const buf = _ctx.createBuffer(1, Math.floor(_ctx.sampleRate * dur), _ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = _ctx.createBufferSource(); src.buffer = buf;
    const bp = _ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2200; bp.Q.value = 8;
    const g = _ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.10, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp); bp.connect(g); g.connect(_ctx.destination);
    src.start(t0); src.stop(t0 + dur);
  }

  function _scheduleElecSnap() {
    if (!_initialized || !_elecSnapActive) { _elecSnapTimer = null; return; }
    _triggerElecSnap();
    const base = 5000, jitter = base * 0.4 * (Math.random() * 2 - 1);
    _elecSnapTimer = setTimeout(_scheduleElecSnap, base + jitter);
  }

  function _setElecSnapActive(active) {
    if (active === _elecSnapActive) return;
    _elecSnapActive = active;
    if (active && _elecSnapTimer === null) _scheduleElecSnap();
  }

  // ── TELECOM ───────────────────────────────────────────────────────────────

  function _initTelecomBurst() {
    _telecomBurstMasterGain = _ctx.createGain();
    _telecomBurstMasterGain.gain.value = 0;
    _telecomBurstMasterGain.connect(_ctx.destination);
    _telecomBurstMasterGain.connect(_sharedReverbBus);

    const bufSize = _ctx.sampleRate * 2;
    _telecomBurstPool = [];

    for (let i = 0; i < TELECOM_BURST_POOL_SIZE; i++) {
      const buf = _ctx.createBuffer(1, bufSize, _ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < bufSize; j++) d[j] = Math.random() * 2 - 1;

      const src = _ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;

      const hp = _ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 5000 + i * 600; // 5000, 5600, 6200, 6800Hz per slot

      // Amplitude gate LFO — each slot has a distinct burst rate (20–80Hz)
      const lfo = _ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = TELECOM_BURST_RATES[i];

      const lfoGain = _ctx.createGain();
      lfoGain.gain.value = 0.45; // ±0.45 → slot gain swings 0.05–0.95

      const slotGain = _ctx.createGain();
      slotGain.gain.value = 0.5; // center; LFO modulates around this

      lfo.connect(lfoGain);
      lfoGain.connect(slotGain.gain);
      src.connect(hp);
      hp.connect(slotGain);
      slotGain.connect(_telecomBurstMasterGain);

      src.start();
      lfo.start();

      _telecomBurstPool.push({ src, lfo, lfoGain, slotGain, baseRate: TELECOM_BURST_RATES[i] });
    }
    _telecomBurstReady = true;
  }

  // Regular node-entry chirp (2→4kHz, 0.2s)
  function _triggerTelecomChirp(id) {
    if (_telecomDebounce.has(id)) return;
    _telecomDebounce.add(id);

    const t0 = _ctx.currentTime;
    const duration = 0.2;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, t0);
    osc.frequency.linearRampToValueAtTime(4000, t0 + duration);

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
    osc.onended = () => _telecomDebounce.delete(id);
  }

  // Handshake chirp — wider sweep (1→8kHz), louder, fires after 5s dwell in node range
  function _triggerTelecomHandshake(id) {
    const now = Date.now();
    if (now - (_telecomHandshakeCooldown.get(id) || 0) < 8000) return;
    _telecomHandshakeCooldown.set(id, now);

    const t0 = _ctx.currentTime;
    const duration = 0.4;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, t0);
    osc.frequency.exponentialRampToValueAtTime(8000, t0 + duration);

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
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

    _fernPanner = _ctx.createStereoPanner();
    _fernPanner.pan.value = 0;

    _fernOsc.connect(carrierGain);
    carrierGain.connect(_fernMasterGain);
    _fernMasterGain.connect(_fernPanner);
    _fernPanner.connect(_ctx.destination);
    _fernMasterGain.connect(_sharedReverbBus); // reverb tap pre-panner — stays centred in the wash
    _fernOsc.start();
    _fernTremolo.start();
    _fernReady = true;
  }

  // ── TELECOM CABLE CROSSING / ALONGSIDE ───────────────────────────────────

  function _triggerTelecomClick() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime;
    const duration = 0.06;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3500, t0);
    osc.frequency.exponentialRampToValueAtTime(6000, t0 + duration);
    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.10, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function _scheduleTelecomSnap() {
    if (!_initialized || !_telecomSnapActive) { _telecomSnapTimer = null; return; }
    _triggerTelecomClick();
    const base = 4000, jitter = base * 0.45 * (Math.random() * 2 - 1);
    _telecomSnapTimer = setTimeout(_scheduleTelecomSnap, base + jitter);
  }

  function _setTelecomSnapActive(active) {
    if (active === _telecomSnapActive) return;
    _telecomSnapActive = active;
    if (active && _telecomSnapTimer === null) _scheduleTelecomSnap();
  }

  // ── FERNWÄRME CROSSING / ALONGSIDE ───────────────────────────────────────

  function _triggerFernCrossing() {
    if (!_ctx || !_initialized) return;
    const t0 = _ctx.currentTime;
    const duration = 0.5;
    const osc = _ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 60;
    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.15, t0 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(_fernPanner || _ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration);
  }

  function _scheduleFernKnock() {
    if (!_initialized || !_fernKnockActive) { _fernKnockTimer = null; return; }
    _triggerFernCrossing();
    const base = 6000, jitter = base * 0.4 * (Math.random() * 2 - 1);
    _fernKnockTimer = setTimeout(_scheduleFernKnock, base + jitter);
  }

  function _setFernKnockActive(active) {
    if (active === _fernKnockActive) return;
    _fernKnockActive = active;
    if (active && _fernKnockTimer === null) _scheduleFernKnock();
  }

  // ── ONE-SHOT WATER PULSE ──────────────────────────────────────────────────

  function _triggerWaterPulse(id, dist, isFitting) {
    const now = Date.now();
    if (now - (_waterLastTrigger.get(id) || 0) < 30_000) return;
    _waterLastTrigger.set(id, now);

    const freq     = isFitting ? 1200 : 800;
    const duration = isFitting ? 0.08  : 0.25;

    // Gain scales with proximity: louder when closer
    const radius  = isFitting ? 25 : 50;
    const proxT   = Math.max(0, 1 - dist / radius);   // 1 at 0m, 0 at threshold
    const maxGain = 0.04 + proxT * 0.14;               // 0.04 at edge → 0.18 at surface

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
  }

  function _triggerWaterDrip() {
    if (!_ctx || !_initialized) return;
    const t0       = _ctx.currentTime;
    const duration = 0.04;
    const bufLen   = Math.floor(_ctx.sampleRate * duration);
    const buf      = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
    const d        = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = _ctx.createBufferSource();
    src.buffer = buf;

    const bp = _ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2800;
    bp.Q.value = 6;

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.08, t0 + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    src.connect(bp); bp.connect(gain); gain.connect(_ctx.destination);
    src.start(t0);
    src.stop(t0 + duration);
  }

  function _scheduleWaterDrip() {
    if (!_initialized || _waterDripRate <= 0) { _waterDripTimer = null; return; }
    _triggerWaterDrip();
    // Add ±25% jitter so drips sound organic rather than metronomic
    const base   = 1000 / _waterDripRate;
    const jitter = base * 0.25 * (Math.random() * 2 - 1);
    _waterDripTimer = setTimeout(_scheduleWaterDrip, base + jitter);
  }

  function _setWaterDripRate(rate) {
    _waterDripRate = rate;
    if (rate > 0 && _waterDripTimer === null) _scheduleWaterDrip();
  }

  // Hydraulic knock — quieter and lower than the pipe burst, for crossings + alongside loop
  function _triggerWaterKnock() {
    if (!_ctx || !_initialized) return;
    const t0       = _ctx.currentTime;
    const duration = 0.4;
    const bufLen   = Math.floor(_ctx.sampleRate * duration);
    const buf      = _ctx.createBuffer(1, bufLen, _ctx.sampleRate);
    const d        = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;

    const src = _ctx.createBufferSource();
    src.buffer = buf;

    const bp = _ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 380;
    bp.Q.value = 4;

    const gain = _ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.07, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    src.connect(bp); bp.connect(gain); gain.connect(_ctx.destination);
    src.start(t0);
    src.stop(t0 + duration);
  }

  function _scheduleWaterKnock() {
    if (!_initialized || !_waterKnockActive) { _waterKnockTimer = null; return; }
    _triggerWaterKnock();
    const base   = 3500;
    const jitter = base * 0.3 * (Math.random() * 2 - 1);
    _waterKnockTimer = setTimeout(_scheduleWaterKnock, base + jitter);
  }

  function _setWaterKnockActive(active) {
    if (active === _waterKnockActive) return;
    _waterKnockActive = active;
    if (active && _waterKnockTimer === null) _scheduleWaterKnock();
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
      // Fitting cluster drip: count non-hydrant fittings within 15m, map to drip rate
      const clusterCount = (proximity.water?.fittings || []).filter(f => f.dist <= 15).length;
      _setWaterDripRate(Math.min(clusterCount * 0.5, 3.0));

      // Pipe crossing: one-shot knock per pipe (3s cooldown to prevent double-fire)
      const pipes = proximity.water?.pipes || [];
      for (const pipe of pipes) {
        if (pipe.crossing) {
          const now = Date.now();
          if (now - (_waterCrossingCooldown.get(pipe.id) || 0) > 3000) {
            _waterCrossingCooldown.set(pipe.id, now);
            _triggerWaterKnock();
          }
        }
      }

      // Alongside loop: active while any pipe is alongside
      _setWaterKnockActive(pipes.some(p => p.alongside));
    } else {
      _setWaterDripRate(0);
      _setWaterKnockActive(false);
    }

    // ── SEWAGE ─────────────────────────────────────────────────────────────
    // reads: proximity.sewage.pipes, proximity.sewage.junctions
    if (LAYER_ENABLED.sewage && _sewageReady) {
      const pipes     = proximity.sewage?.pipes     || [];
      const junctions = proximity.sewage?.junctions || [];

      // Continuous rumble gain driven by nearest pipe distance
      let nearestDist = Infinity;
      for (const p of pipes) { if (p.dist < nearestDist) nearestDist = p.dist; }
      const SEWAGE_RADIUS = 80;
      const targetGain = nearestDist <= SEWAGE_RADIUS
        ? (1 - nearestDist / SEWAGE_RADIUS) * 0.18 : 0;
      _sewageGain.gain.setTargetAtTime(targetGain, t, 1.5);

      // Rhythmic gurgle below 20m
      _setSewageGurgleActive(nearestDist <= 20);

      // Junction thud on entry (10s cooldown per junction)
      const now = Date.now();
      for (const j of junctions) {
        if (j.triggered && now - (_sewageJunctionCooldown.get(j.id) || 0) > 10_000) {
          _sewageJunctionCooldown.set(j.id, now);
          _triggerSewageThud();
        }
      }

      // Pipe crossing — one-shot transient (3s cooldown)
      for (const p of pipes) {
        if (p.crossing && now - (_sewageCrossingCooldown.get(p.id) || 0) > 3000) {
          _sewageCrossingCooldown.set(p.id, now);
          _triggerSewageCrossing();
        }
      }

      // Alongside loop
      _setSewageKnockActive(pipes.some(p => p.alongside));
    } else if (!LAYER_ENABLED.sewage && _sewageGain) {
      _sewageGain.gain.setTargetAtTime(0, t, 0.5);
      _setSewageGurgleActive(false);
      _setSewageKnockActive(false);
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

      // Node cluster density: count nodes within 30m, scale pool gain up in dense areas
      const clusterCount  = nodes.filter(n => n.dist <= 30).length;
      const densityMult   = 1.0 + Math.min(clusterCount / 5, 1.0) * 0.8; // 1.0 → 1.8 at 5+ nodes
      masterTarget = Math.min(0.45, masterTarget * densityMult);
      _elecMasterGain.gain.setTargetAtTime(masterTarget, t, 0.8);

      // Cable crossing snap (3s cooldown) + alongside loop
      const nowE = Date.now();
      for (const c of cables) {
        if (c.crossing && nowE - (_elecCrossingCooldown.get(c.id) || 0) > 3000) {
          _elecCrossingCooldown.set(c.id, nowE);
          _triggerElecSnap();
        }
      }
      _setElecSnapActive(cables.some(c => c.alongside));
    } else if (!LAYER_ENABLED.electricity && _elecMasterGain) {
      _elecMasterGain.gain.setTargetAtTime(0, t, 0.5);
      _setElecSnapActive(false);
    }

    // ── TELECOM ────────────────────────────────────────────────────────────
    // reads: proximity.telecom.nodes, proximity.telecom.cables
    if (LAYER_ENABLED.telecom) {
      const nodes  = proximity.telecom?.nodes  || [];
      const cables = proximity.telecom?.cables || [];

      // Regular chirp on node entry
      for (const n of nodes.filter(n => n.triggered)) _triggerTelecomChirp(n.id);

      // Node dwell: fire handshake chirp after 5s continuous proximity
      const nowT = Date.now();
      const triggeredNodeIds = new Set(nodes.filter(n => n.triggered).map(n => n.id));
      for (const id of [..._telecomNodeDwell.keys()]) {
        if (!triggeredNodeIds.has(id)) _telecomNodeDwell.delete(id);
      }
      for (const id of triggeredNodeIds) {
        if (!_telecomNodeDwell.has(id)) _telecomNodeDwell.set(id, nowT);
        else if (nowT - _telecomNodeDwell.get(id) > 5000) _triggerTelecomHandshake(id);
      }

      // Cable burst pool: master gain from nearest cable, rate from density
      let nearestCableDist = Infinity;
      for (const c of cables) { if (c.dist < nearestCableDist) nearestCableDist = c.dist; }
      const TELECOM_CABLE_RADIUS = 30;
      if (_telecomBurstReady) {
        const cableTarget = nearestCableDist <= TELECOM_CABLE_RADIUS
          ? (1 - nearestCableDist / TELECOM_CABLE_RADIUS) * 0.06
          : 0;
        _telecomBurstMasterGain.gain.setTargetAtTime(cableTarget, t, 0.8);

        // Dense cable areas → faster burst gating (simulates more data traffic)
        const denseCableCount = cables.filter(c => c.dist <= TELECOM_CABLE_RADIUS).length;
        const rateMult = 0.5 + Math.min(denseCableCount / 4, 1.0) * 1.5; // 0.5–2.0
        for (const slot of _telecomBurstPool) {
          slot.lfo.frequency.setTargetAtTime(slot.baseRate * rateMult, t, 0.5);
        }
      }

      // Cable crossing click (3s cooldown) + alongside loop
      const nowTC = Date.now();
      for (const c of cables) {
        if (c.crossing && nowTC - (_telecomCrossingCooldown.get(c.id) || 0) > 3000) {
          _telecomCrossingCooldown.set(c.id, nowTC);
          _triggerTelecomClick();
        }
      }
      _setTelecomSnapActive(cables.some(c => c.alongside));
    } else if (!LAYER_ENABLED.telecom) {
      if (_telecomBurstReady) _telecomBurstMasterGain.gain.setTargetAtTime(0, t, 0.5);
      _telecomNodeDwell.clear();
      _setTelecomSnapActive(false);
    }

    // ── FERNWÄRME ──────────────────────────────────────────────────────────
    // reads: proximity.fernwaerme.pipes  (each has dist, triggered, crossing, alongside, bearing)
    if (LAYER_ENABLED.fernwaerme && _fernReady) {
      const pipes = proximity.fernwaerme?.pipes || [];
      let nearestDist = Infinity;
      let nearestBearing = null;
      for (const p of pipes) {
        if (p.dist < nearestDist) { nearestDist = p.dist; nearestBearing = p.bearing; }
      }
      const FERN_RADIUS = 30;
      const fernTarget = nearestDist <= FERN_RADIUS
        ? (1 - nearestDist / FERN_RADIUS) * 0.12
        : 0;
      _fernMasterGain.gain.setTargetAtTime(fernTarget, t, 0.4); // fast ramp for dramatic entry

      // Pan toward bearing of nearest pipe relative to listener heading
      if (nearestBearing !== null && nearestDist <= FERN_RADIUS) {
        const relBearing = ((nearestBearing - (heading || 0)) + 360) % 360;
        const pan = Math.sin(relBearing * Math.PI / 180);
        _fernPanner.pan.setTargetAtTime(pan, t, 1.0);
      } else {
        _fernPanner.pan.setTargetAtTime(0, t, 1.0);
      }

      // Pipe crossing (3s cooldown) + alongside loop
      const nowF = Date.now();
      for (const p of pipes) {
        if (p.crossing && nowF - (_fernCrossingCooldown.get(p.id) || 0) > 3000) {
          _fernCrossingCooldown.set(p.id, nowF);
          _triggerFernCrossing();
        }
      }
      _setFernKnockActive(pipes.some(p => p.alongside));
    } else if (!LAYER_ENABLED.fernwaerme && _fernMasterGain) {
      _fernMasterGain.gain.setTargetAtTime(0, t, 0.5);
      _setFernKnockActive(false);
    }

    // ── DENSITY REVERB ────────────────────────────────────────────────────
    // Count enabled layers with triggered features; drive shared reverb wet level.
    // Bahnhofstrasse (tram+water+elec+telecom = 4) should feel noticeably richer.
    if (_sharedReverbOut) {
      let density = 0;
      if (LAYER_ENABLED.tram &&
          ((proximity.feeders || []).some(f => f.triggered) ||
           (proximity.nearestPowerlineDist !== null && proximity.nearestPowerlineDist <= 20)))
        density++;
      if (LAYER_ENABLED.water &&
          ((proximity.water?.pipes    || []).some(p => p.triggered) ||
           (proximity.water?.fittings || []).some(f => f.triggered)))
        density++;
      if (LAYER_ENABLED.sewage &&
          (proximity.sewage?.pipes || []).some(p => p.triggered))
        density++;
      if (LAYER_ENABLED.electricity &&
          ((proximity.electricity?.nodes  || []).some(n => n.triggered) ||
           (proximity.electricity?.cables || []).some(c => c.triggered)))
        density++;
      if (LAYER_ENABLED.telecom &&
          ((proximity.telecom?.nodes  || []).some(n => n.triggered) ||
           (proximity.telecom?.cables || []).some(c => c.triggered)))
        density++;
      if (LAYER_ENABLED.fernwaerme &&
          (proximity.fernwaerme?.pipes || []).some(p => p.triggered))
        density++;

      // Kicks in at 2+ overlapping layers; exponential curve makes the 5→6 jump dramatic
      // Wet levels: 2→0.006, 3→0.018, 4→0.033, 5→0.050, 6→0.070
      const reverbTarget = density >= 2
        ? Math.pow((density - 1) / 5, 1.5) * 0.07
        : 0;
      _sharedReverbOut.gain.setTargetAtTime(reverbTarget, t, 2.5);
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
    if (_telecomBurstMasterGain) _telecomBurstMasterGain.gain.setTargetAtTime(0, t, TC);
    if (_fernMasterGain)   _fernMasterGain.gain.setTargetAtTime(0, t, TC);
    if (_sharedReverbOut)  _sharedReverbOut.gain.setTargetAtTime(0, t, TC);

    // Schedule oscillator/source stops after fade
    try { if (_droneOsc1) _droneOsc1.stop(stopAt); } catch {}
    try { if (_droneOsc2) _droneOsc2.stop(stopAt); } catch {}
    try { if (_droneLfo1) _droneLfo1.stop(stopAt); } catch {}
    try { if (_droneLfo2) _droneLfo2.stop(stopAt); } catch {}
    if (_idlePool) {
      for (const node of _idlePool) try { node.source.stop(stopAt); } catch {}
    }
    try { if (_sewageSrc)       _sewageSrc.stop(stopAt);       } catch {}
    for (const slot of _telecomBurstPool) {
      try { slot.src.stop(stopAt); slot.lfo.stop(stopAt); } catch {}
    }
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

    _sewageSrc = null; _sewageGain = null; _sewageReady = false;
    if (_sewageGurgleTimer !== null) { clearTimeout(_sewageGurgleTimer); _sewageGurgleTimer = null; }
    if (_sewageKnockTimer  !== null) { clearTimeout(_sewageKnockTimer);  _sewageKnockTimer  = null; }
    _sewageGurgleActive = false; _sewageKnockActive = false;
    _sewageCrossingCooldown.clear(); _sewageJunctionCooldown.clear();
    _elecPool = []; _elecMasterGain = null; _elecActive.clear();
    if (_elecSnapTimer !== null) { clearTimeout(_elecSnapTimer); _elecSnapTimer = null; }
    _elecSnapActive = false; _elecCrossingCooldown.clear();
    _telecomBurstPool = []; _telecomBurstMasterGain = null; _telecomBurstReady = false;
    _telecomNodeDwell.clear(); _telecomHandshakeCooldown.clear();
    _telecomCrossingCooldown.clear();
    if (_telecomSnapTimer !== null) { clearTimeout(_telecomSnapTimer); _telecomSnapTimer = null; }
    _telecomSnapActive = false;
    _fernOsc = null; _fernTremolo = null; _fernTremoloGain = null;
    _fernMasterGain = null; _fernPanner = null; _fernReady = false;
    if (_fernKnockTimer !== null) { clearTimeout(_fernKnockTimer); _fernKnockTimer = null; }
    _fernKnockActive = false; _fernCrossingCooldown.clear();
    _sharedReverbBus = null; _sharedConvolver = null; _sharedReverbOut = null;
    _waterLastTrigger.clear();
    if (_waterDripTimer  !== null) { clearTimeout(_waterDripTimer);  _waterDripTimer  = null; }
    if (_waterKnockTimer !== null) { clearTimeout(_waterKnockTimer); _waterKnockTimer = null; }
    _waterDripRate    = 0;
    _waterKnockActive = false;
    _waterCrossingCooldown.clear();
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
        if (_telecomBurstReady) _telecomBurstMasterGain.gain.setTargetAtTime(0, t, TC);
        _telecomNodeDwell.clear();
        _setTelecomSnapActive(false);
        break;
      case 'fernwaerme':
        if (_fernMasterGain) _fernMasterGain.gain.setTargetAtTime(0, t, TC);
        _setFernKnockActive(false);
        break;
      // water: one-shot pulses only, no continuous gain to ramp
    }
  }

  return { init, update, onListenerMove, stop, setLayerEnabled, LAYER_ENABLED };
})();

export default AudioLayers;
