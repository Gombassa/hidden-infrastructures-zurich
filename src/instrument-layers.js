// instrument-layers.js — Phase 3 Step 8 (reintegration). Replaces AudioLayers
// (Archive/audio-layers.js) as what index.html actually runs on, orchestrating
// the 17 real src/instruments/*.js instances that together voice all 24
// behaviours built in Steps 1-7, per docs/Implementation_Plan.md Step 8.
//
// Public shape: { init, update, onListenerMove, stop, setLayerEnabled,
// LAYER_ENABLED, setLayerLevel, getLayerLevel, getLayerMeter }. The first six
// match AudioLayers exactly (index.html's original call sites needed only an
// import/name change, not a shape change); the last three are the per-layer
// mixer (feature/layer-mixer branch) — a fader (setLayerLevel/getLayerLevel)
// and a meter tap (getLayerMeter) per layer, sitting between each layer's
// instruments and the master chain (feature/layer-trim: layer buses + the
// shared reverb output -> master makeup gain -> limiter -> ctx.destination;
// see LAYER_TRIM_DB and MASTER_MAKEUP_DB below). Mute (setLayerEnabled) is
// unchanged by this — it still silences a layer by feeding its instruments
// an out-of-range update, independently of the fader/bus/trim.
//
// audio-layers.js is NOT deleted or modified — it stays in the repo as the
// reference implementation until a field walk confirms no regression (Step
// 8's own explicit gate; see the Risks section of the Implementation Plan).
// ab-compare.html keeps its own independent import of it, unaffected by this
// file's existence.
//
// The per-tick, per-layer driving logic below (which features to filter,
// what to pass to trigger()/update(), caller-side state like the crackle
// debounce Set and telecom dwell Map) is ported directly from ab-compare.html's
// Path B code — built up and step-by-step field-verified across Steps 1-7,
// not re-derived from audio-layers.js a second time. Two things exist only at
// this orchestration level, not inside any single instrument class, and are
// ported fresh from audio-layers.js instead:
//   1. The shared density reverb bus (_initSharedReverb, ~L131-140) and its
//      density-score formula (~L1118-1152) — 5 of the 17 instances send into
//      it via their optional `reverbBus` constructor argument.
//   2. onListenerMove's hiss-panner repositioning between TramEngine ticks
//      (~L1155-1166) — caches the last feeders array and re-drives
//      TramHissPool.update() with it, which is safe to call more often than
//      once per tick (claim/release only changes when the feeder set does).
//
// DELIBERATE SIMPLIFICATION, not an oversight: production's LAYER_ENABLED
// disable branches ramp each layer's master gain to silence with a uniform
// 0.5s time constant, via direct gain-node access this module doesn't have.
// Here, disabling a layer with a continuous voice (tram drone, sewage
// rumble, electricity pool, telecom pool, Fernwärme) instead feeds that
// instrument's own update() an out-of-range value, so it silences itself via
// its own existing in-range/out-of-range logic and time constant (0.4-2.0s
// depending on the instrument) rather than production's separate faster
// disable-specific ramp. The end state (silent) is identical; only the
// transition speed differs, and layer toggles are a debug feature, not part
// of the core GPS-driven experience — not worth a bespoke "force silence"
// method on five classes for a debug-only speed difference.

import WaterProximityPulse from './instruments/water-proximity-pulse.js';
import WaterFittingDrip from './instruments/water-fitting-drip.js';
import ElectricityOscillatorPool from './instruments/electricity-oscillator-pool.js';
import LineCrossingVoice from './instruments/line-crossing-voice.js';
import { ELECTRICITY_CROSSING, WATER_CROSSING, SEWAGE_CROSSING } from './instruments/line-crossing-presets.js';
import FeederCrackle from './instruments/feeder-crackle.js';
import TramDrone from './instruments/tram-drone.js';
import TramHissPool from './instruments/tram-hiss-pool.js';
import SewageRumble from './instruments/sewage-rumble.js';
import SewageJunctionThud from './instruments/sewage-junction-thud.js';
import SewageGurgle from './instruments/sewage-gurgle.js';
import TelecomBurstPool from './instruments/telecom-burst-pool.js';
import TelecomNodeChirp from './instruments/telecom-node-chirp.js';
import TelecomNodeHandshake from './instruments/telecom-node-handshake.js';
import TelecomClickVoice from './instruments/telecom-click-voice.js';
import FernwaermeThermal from './instruments/fernwaerme-thermal.js';

const LAYER_ENABLED = {
  tram: true,
  water: true,
  sewage: true,
  electricity: true,
  telecom: true,
  fernwaerme: true,
};

const LAYER_KEYS = ['tram', 'water', 'sewage', 'electricity', 'telecom', 'fernwaerme'];

let _ctx = null;
let _initialized = false;

// Shared density reverb (ported from _initSharedReverb, audio-layers.js ~L131-140)
let _reverbBus = null;
let _reverbConvolver = null;
let _reverbOut = null;

// Per-layer mixer: one GainNode (fader) and one AnalyserNode (meter tap) per
// layer, interposed between each layer's instruments and the master chain
// (see _initMasterChain below). _layerLevel is deliberately NOT reset in
// stop() — fader positions must survive a Stop/Start cycle (same
// AudioContext persists across both, see index.html's
// btn-audio/btn-start/btn-stop handlers).
let _layerBus = {};
let _layerAnalyser = {};
let _layerMeterBuf = {}; // one reusable Float32Array per layer, for getLayerMeter
let _layerLevel = { tram: 1, water: 1, sewage: 1, electricity: 1, telecom: 1, fernwaerme: 1 };

// Per-layer trim (feature/layer-trim), MEASURED VALUES from a calibration run
// — not tuning knobs. calibrate-layers.html (feature/layer-calibration
// branch) built each layer's real instruments in isolation, in a documented
// reference state, and measured 45s-window RMS and sample peak in dBFS via a
// sample-accurate AudioWorklet (see docs/layer-calibration-*.json and
// docs/CHANGELOG.md for the full run). Electricity is the reference layer
// (trim 0 — its own FIELD_TRIM_DB=-9 in electricity-oscillator-pool.js is
// left untouched and is NOT part of this trim). Every other layer but water
// is matched on combined RMS to electricity's combined RMS
// (electricityRmsDb - thisLayerRmsDb); water has no continuous bed (only
// one-shot events), so RMS isn't representative of its character — it's
// matched on combined PEAK to electricity's combined peak instead.
const LAYER_TRIM_DB = {
  tram: -21.3,       // RMS-matched: -34.86 (electricity) - (-13.54) (tram)
  water: 7.5,        // PEAK-matched: -16.12 (electricity) - (-23.65) (water)
  sewage: 4.0,       // RMS-matched: -34.86 (electricity) - (-38.84) (sewage)
  electricity: -6.0, // 6dB quieter per Robin's field-by-ear request, 2026-10-07 (was 0.0 reference)
  telecom: -7.3,     // RMS-matched: -34.86 (electricity) - (-27.61) (telecom)
  fernwaerme: -10.7, // RMS-matched: -34.86 (electricity) - (-24.17) (fernwaerme)
};

function _trimLinear(key) {
  return Math.pow(10, LAYER_TRIM_DB[key] / 20);
}

// Master chain (feature/layer-trim): every layer bus and the shared reverb's
// output join here, post-trim, pre-destination — layerBus -> _masterMakeup ->
// _limiter -> ctx.destination. Nothing connects to ctx.destination directly
// any more.
let _masterMakeup = null;
let _limiter = null;

// Several of the trims above are negative (tram -21.3dB, telecom -7.3dB,
// fernwaerme -10.7dB), so the trimmed mix sits quieter overall than before
// calibration — this single makeup gain, applied once after every layer and
// the reverb join, brings the whole mix back up to a usable level without
// touching the relative per-layer balance the trims above already set.
const MASTER_MAKEUP_DB = 12;
const MASTER_MAKEUP_LINEAR = Math.pow(10, MASTER_MAKEUP_DB / 20);

// Fast limiter, not a true brickwall (the Web Audio API has no brickwall
// limiter node) — a DynamicsCompressorNode configured aggressively (20:1
// ratio, 0 knee, 3ms attack) is the standard way to approximate one with
// what the API provides. Safety net against the +12dB makeup gain, or
// several loud layers overlapping at once, pushing the mix into clipping.
function _buildLimiter(ctx) {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1;
  limiter.knee.value = 0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.1;
  return limiter;
}

function _initMasterChain(ctx) {
  _masterMakeup = ctx.createGain();
  _masterMakeup.gain.value = MASTER_MAKEUP_LINEAR;
  _limiter = _buildLimiter(ctx);
  _masterMakeup.connect(_limiter);
  _limiter.connect(ctx.destination);
}

// How long to wait after destroy() before disconnecting a layer's bus from
// destination. Each instrument's own destroy() ramps its gain to silence
// over its own tail (instrument-base.js's default is 0.3s, but several
// instruments override it — electricity 0.9s, telecom-burst-pool 1.2s,
// sewage-rumble 2.25s, and tram-drone the longest at 2.5s) before
// disconnecting its own nodes ~50ms later. Disconnecting the shared layer
// bus before the slowest instrument on it has finished ramping would cut
// that still-live signal off abruptly — a click, the exact thing this delay
// exists to avoid — so this is set above the longest observed tail (tram
// -drone's 2.5s + 0.05s buffer = 2.55s) rather than a uniform guess.
const BUS_DISCONNECT_DELAY_MS = 2700;

// Instrument instances
let waterPulse = null, waterDrip = null, waterCrossing = null;
let elecPool = null, elecCrossing = null;
let crackle = null, drone = null, hissPool = null;
let sewageRumble = null, sewageThud = null, sewageGurgle = null, sewageCrossing = null;
let telecomPool = null, telecomChirp = null, telecomHandshake = null, telecomClick = null;
let fernThermal = null;

// Caller-side state (mirrors production's module-scope Sets/Maps)
const crackleTriggeredIds = new Set(); // mirrors _activeCrackleIds
const telecomNodeDwell = new Map(); // mirrors _telecomNodeDwell
let _lastFeeders = []; // for onListenerMove's hiss repositioning

function _buildReverb(ctx, decaySeconds) {
  const length = ctx.sampleRate * decaySeconds;
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = impulse.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }
  }
  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  return convolver;
}

function _initSharedReverb(ctx) {
  _reverbBus = ctx.createGain();
  _reverbBus.gain.value = 1.0;
  _reverbConvolver = _buildReverb(ctx, 1.8);
  _reverbOut = ctx.createGain();
  _reverbOut.gain.value = 0;
  _reverbBus.connect(_reverbConvolver);
  _reverbConvolver.connect(_reverbOut);
  _reverbOut.connect(_masterMakeup); // was ctx.destination — now joins the master chain, same as every layer bus
}

function init(ctx) {
  if (_initialized) return;
  _initialized = true;
  _ctx = ctx;

  _initMasterChain(ctx); // must come first — every layer bus and the reverb output below connect into it
  _initSharedReverb(ctx); // must come before the instruments — they send into it during construction

  // Per-layer mixer bus + meter tap. Each instrument's dry output goes to its
  // layer's bus, scaled by that layer's fader AND its calibration trim
  // (LAYER_TRIM_DB — see above), then into the master chain. The shared
  // density-reverb sends (reverbBus, above) stay wired directly to
  // _reverbBus independently of this, so faders/trims don't touch the shared
  // reverb's wet level.
  for (const key of LAYER_KEYS) {
    const bus = ctx.createGain();
    bus.gain.value = LAYER_ENABLED[key] ? _layerLevel[key] * _trimLinear(key) : 0;
    bus.connect(_masterMakeup);

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    bus.connect(analyser); // tap only, pre-master — analyser is not connected onward

    _layerBus[key] = bus;
    _layerAnalyser[key] = analyser;
    _layerMeterBuf[key] = new Float32Array(analyser.fftSize);
  }

  waterPulse = new WaterProximityPulse(ctx, _layerBus.water);
  waterDrip = new WaterFittingDrip(ctx, _layerBus.water);
  waterCrossing = new LineCrossingVoice(ctx, _layerBus.water, WATER_CROSSING);

  elecPool = new ElectricityOscillatorPool(ctx, _layerBus.electricity, { reverbBus: _reverbBus });
  elecCrossing = new LineCrossingVoice(ctx, _layerBus.electricity, ELECTRICITY_CROSSING);

  crackle = new FeederCrackle(ctx, _layerBus.tram);
  drone = new TramDrone(ctx, _layerBus.tram, { reverbBus: _reverbBus });
  hissPool = new TramHissPool(ctx, _layerBus.tram);

  sewageRumble = new SewageRumble(ctx, _layerBus.sewage, { reverbBus: _reverbBus });
  sewageThud = new SewageJunctionThud(ctx, _layerBus.sewage);
  sewageGurgle = new SewageGurgle(ctx, _layerBus.sewage);
  sewageCrossing = new LineCrossingVoice(ctx, _layerBus.sewage, SEWAGE_CROSSING);

  telecomPool = new TelecomBurstPool(ctx, _layerBus.telecom, { reverbBus: _reverbBus });
  telecomChirp = new TelecomNodeChirp(ctx, _layerBus.telecom);
  telecomHandshake = new TelecomNodeHandshake(ctx, _layerBus.telecom);
  telecomClick = new TelecomClickVoice(ctx, _layerBus.telecom);

  fernThermal = new FernwaermeThermal(ctx, _layerBus.fernwaerme, { reverbBus: _reverbBus });
}

// proximity: ProximityEngine.calculate()'s return value.
function update(proximity, listenerLat, listenerLng, heading, speed) {
  if (!_ctx || !_initialized) return;
  const t = _ctx.currentTime;

  // ── TRAM ELECTRICAL ──────────────────────────────────────────────────────
  const feeders = proximity.feeders || [];
  if (LAYER_ENABLED.tram) {
    drone.update({ nearestPowerlineDist: proximity.nearestPowerlineDist });

    const triggeredIds = new Set(feeders.filter(f => f.triggered).map(f => f.id));
    for (const id of crackleTriggeredIds) if (!triggeredIds.has(id)) crackleTriggeredIds.delete(id);
    for (const f of feeders) {
      if (f.triggered && !crackleTriggeredIds.has(f.id)) {
        crackle.trigger({
          feederLat: f.lat, feederLng: f.lng,
          listenerLat, listenerLng, listenerHeading: heading,
        });
        crackleTriggeredIds.add(f.id);
      }
    }

    _lastFeeders = feeders;
    hissPool.update({ feeders, listenerLat, listenerLng, listenerHeading: heading });
  } else {
    drone.update({ nearestPowerlineDist: null });
    _lastFeeders = feeders;
  }

  // ── WATER ────────────────────────────────────────────────────────────────
  if (LAYER_ENABLED.water) {
    const pipes = (proximity.water?.pipes || []).filter(p => p.triggered);
    const fittings = (proximity.water?.fittings || []).filter(f => f.triggered);
    if (pipes.length) {
      const nearest = pipes.reduce((a, b) => a.dist < b.dist ? a : b);
      waterPulse.trigger({ id: nearest.id, dist: nearest.dist, isFitting: false });
    }
    if (fittings.length) {
      const nearest = fittings.reduce((a, b) => a.dist < b.dist ? a : b);
      waterPulse.trigger({ id: nearest.id, dist: nearest.dist, isFitting: true });
    }
    waterDrip.setRate(Math.min(fittings.filter(f => f.dist <= 15).length * 0.5, 3.0));

    const allPipes = proximity.water?.pipes || [];
    for (const p of allPipes) if (p.crossing) waterCrossing.trigger({ id: p.id });
    waterCrossing.setAlongsideActive(allPipes.some(p => p.alongside));
  } else {
    waterDrip.setRate(0);
    waterCrossing.setAlongsideActive(false);
  }

  // ── ELECTRICITY ──────────────────────────────────────────────────────────
  if (LAYER_ENABLED.electricity) {
    const nodes = proximity.electricity?.nodes || [];
    const cables = proximity.electricity?.cables || [];
    let nearestCableDist = Infinity;
    for (const c of cables) if (c.dist < nearestCableDist) nearestCableDist = c.dist;
    elecPool.update({ nodes, nearestCableDist });

    for (const c of cables) if (c.crossing) elecCrossing.trigger({ id: c.id });
    elecCrossing.setAlongsideActive(cables.some(c => c.alongside));
  } else {
    elecPool.update({ nodes: [], nearestCableDist: Infinity });
    elecCrossing.setAlongsideActive(false);
  }

  // ── SEWAGE ───────────────────────────────────────────────────────────────
  if (LAYER_ENABLED.sewage) {
    const sewagePipes = proximity.sewage?.pipes || [];
    const sewageJunctions = proximity.sewage?.junctions || [];
    let nearestSewageDist = Infinity;
    for (const p of sewagePipes) if (p.dist < nearestSewageDist) nearestSewageDist = p.dist;
    sewageRumble.update({ nearestDist: nearestSewageDist });
    sewageGurgle.setGurgleActive(nearestSewageDist <= 20);
    for (const j of sewageJunctions) if (j.triggered) sewageThud.trigger({ id: j.id });
    for (const p of sewagePipes) if (p.crossing) sewageCrossing.trigger({ id: p.id });
    sewageGurgle.setAlongsideActive(sewagePipes.some(p => p.alongside));
  } else {
    sewageRumble.update({ nearestDist: Infinity });
    sewageGurgle.setGurgleActive(false);
    sewageGurgle.setAlongsideActive(false);
  }

  // ── TELECOM ──────────────────────────────────────────────────────────────
  if (LAYER_ENABLED.telecom) {
    const telecomNodes = proximity.telecom?.nodes || [];
    const telecomCables = proximity.telecom?.cables || [];

    for (const n of telecomNodes) if (n.triggered) telecomChirp.trigger({ id: n.id, dist: n.dist });

    const nowT = Date.now();
    const triggeredNodeIds = new Set(telecomNodes.filter(n => n.triggered).map(n => n.id));
    const telecomNodeDistById = new Map(telecomNodes.map(n => [n.id, n.dist]));
    for (const id of [...telecomNodeDwell.keys()]) if (!triggeredNodeIds.has(id)) telecomNodeDwell.delete(id);
    for (const id of triggeredNodeIds) {
      if (!telecomNodeDwell.has(id)) telecomNodeDwell.set(id, nowT);
      else if (nowT - telecomNodeDwell.get(id) > 5000) telecomHandshake.trigger({ id, dist: telecomNodeDistById.get(id) });
    }

    let nearestCableDist = Infinity;
    for (const c of telecomCables) if (c.dist < nearestCableDist) nearestCableDist = c.dist;
    const cableCount = telecomCables.filter(c => c.dist <= 30).length;
    telecomPool.update({ nearestCableDist, cableCount });

    for (const c of telecomCables) if (c.crossing) telecomClick.trigger({ id: c.id });
    telecomClick.setAlongsideActive(telecomCables.some(c => c.alongside));
  } else {
    telecomPool.update({ nearestCableDist: Infinity, cableCount: 0 });
    telecomNodeDwell.clear();
    telecomClick.setAlongsideActive(false);
  }

  // ── FERNWÄRME ────────────────────────────────────────────────────────────
  if (LAYER_ENABLED.fernwaerme) {
    const fernPipes = proximity.fernwaerme?.pipes || [];
    let nearestFernDist = Infinity, nearestFernBearing = null;
    for (const p of fernPipes) {
      if (p.dist < nearestFernDist) { nearestFernDist = p.dist; nearestFernBearing = p.bearing; }
    }
    fernThermal.update({ nearestDist: nearestFernDist, nearestBearing: nearestFernBearing, heading });
    for (const p of fernPipes) if (p.crossing) fernThermal.trigger({ id: p.id });
    fernThermal.setAlongsideActive(fernPipes.some(p => p.alongside));
  } else {
    fernThermal.update({ nearestDist: Infinity, nearestBearing: null, heading });
    fernThermal.setAlongsideActive(false);
  }

  // ── DENSITY REVERB ───────────────────────────────────────────────────────
  // Ported from audio-layers.js ~L1118-1152, exact per-layer conditions.
  if (_reverbOut) {
    let density = 0;
    if (LAYER_ENABLED.tram &&
        ((proximity.feeders || []).some(f => f.triggered) ||
         (proximity.nearestPowerlineDist !== null && proximity.nearestPowerlineDist <= 20)))
      density++;
    if (LAYER_ENABLED.water &&
        ((proximity.water?.pipes || []).some(p => p.triggered) ||
         (proximity.water?.fittings || []).some(f => f.triggered)))
      density++;
    if (LAYER_ENABLED.sewage &&
        (proximity.sewage?.pipes || []).some(p => p.triggered))
      density++;
    if (LAYER_ENABLED.electricity &&
        ((proximity.electricity?.nodes || []).some(n => n.triggered) ||
         (proximity.electricity?.cables || []).some(c => c.triggered)))
      density++;
    if (LAYER_ENABLED.telecom &&
        ((proximity.telecom?.nodes || []).some(n => n.triggered) ||
         (proximity.telecom?.cables || []).some(c => c.triggered)))
      density++;
    if (LAYER_ENABLED.fernwaerme &&
        (proximity.fernwaerme?.pipes || []).some(p => p.triggered))
      density++;

    const reverbTarget = density >= 2 ? Math.pow((density - 1) / 5, 1.5) * 0.07 : 0;
    _reverbOut.gain.setTargetAtTime(reverbTarget, t, 2.5);
  }
}

// Called from GPS watchPosition between TramEngine ticks — repositions hiss
// panners using the cached feeders array, without a fresh ProximityEngine
// call. See this file's header docblock for why TramHissPool.update() is
// safe to call at this frequency.
function onListenerMove(lat, lng, heading) {
  if (!_ctx || !_initialized) return;
  if (LAYER_ENABLED.tram) {
    hissPool.update({ feeders: _lastFeeders, listenerLat: lat, listenerLng: lng, listenerHeading: heading });
  }
}

function _applyBusGain(key) {
  const bus = _layerBus[key];
  if (!bus || !_ctx) return;
  const target = LAYER_ENABLED[key] ? _layerLevel[key] * _trimLinear(key) : 0;
  bus.gain.setTargetAtTime(target, _ctx.currentTime, 0.02);
}

function setLayerEnabled(key, enabled) {
  LAYER_ENABLED[key] = enabled;
  if (!_ctx || !_initialized) return;
  _applyBusGain(key);
  if (enabled) return;
  // Immediate silence on toggle-off, mirroring production's setLayerEnabled
  // (audio-layers.js ~L1246-1274) — without this, a disabled layer would
  // only go quiet on the next update() tick, which could be up to ~10s away
  // (TramEngine's poll interval), not the near-instant response toggling a
  // button implies. Production does this via direct gain-node access at a
  // snappy 50ms time constant; this module doesn't have raw gain nodes, so
  // it reuses each instrument's own update()/setAlongsideActive() path
  // immediately instead of waiting for the next tick — same eventual
  // silence, each instrument's own (slower, 0.4-2.0s) time constant rather
  // than production's 50ms, same documented simplification as update()'s
  // disable branches above.
  switch (key) {
    case 'tram':
      drone.update({ nearestPowerlineDist: null });
      break;
    case 'water':
      waterDrip.setRate(0);
      waterCrossing.setAlongsideActive(false);
      break;
    case 'sewage':
      sewageRumble.update({ nearestDist: Infinity });
      sewageGurgle.setGurgleActive(false);
      sewageGurgle.setAlongsideActive(false);
      break;
    case 'electricity':
      elecPool.update({ nodes: [], nearestCableDist: Infinity });
      elecCrossing.setAlongsideActive(false);
      break;
    case 'telecom':
      telecomPool.update({ nearestCableDist: Infinity, cableCount: 0 });
      telecomNodeDwell.clear();
      telecomClick.setAlongsideActive(false);
      break;
    case 'fernwaerme':
      fernThermal.update({ nearestDist: Infinity, nearestBearing: null, heading: null });
      fernThermal.setAlongsideActive(false);
      break;
  }
}

function stop() {
  if (!_ctx) return;
  for (const inst of [
    waterPulse, waterDrip, waterCrossing,
    elecPool, elecCrossing,
    crackle, drone, hissPool,
    sewageRumble, sewageThud, sewageGurgle, sewageCrossing,
    telecomPool, telecomChirp, telecomHandshake, telecomClick,
    fernThermal,
  ]) {
    if (inst) inst.destroy();
  }
  waterPulse = waterDrip = waterCrossing = null;
  elecPool = elecCrossing = null;
  crackle = drone = hissPool = null;
  sewageRumble = sewageThud = sewageGurgle = sewageCrossing = null;
  telecomPool = telecomChirp = telecomHandshake = telecomClick = null;
  fernThermal = null;

  crackleTriggeredIds.clear();
  telecomNodeDwell.clear();
  _lastFeeders = [];

  _reverbBus = null; _reverbConvolver = null; _reverbOut = null;

  // Disconnect the layer buses/analysers/master chain only after every
  // instrument's own destroy() tail has finished (see BUS_DISCONNECT_DELAY_MS
  // above) — cutting a bus while an instrument on it is still ramping down
  // would click. Capture references before resetting the module-level vars,
  // so this timer tears down the right (old) nodes even if init() runs again
  // before it fires and creates fresh ones.
  const busesToDisconnect = _layerBus;
  const analysersToDisconnect = _layerAnalyser;
  const masterMakeupToDisconnect = _masterMakeup;
  const limiterToDisconnect = _limiter;
  setTimeout(() => {
    for (const key of LAYER_KEYS) {
      if (busesToDisconnect[key]) busesToDisconnect[key].disconnect();
      if (analysersToDisconnect[key]) analysersToDisconnect[key].disconnect();
    }
    if (masterMakeupToDisconnect) masterMakeupToDisconnect.disconnect();
    if (limiterToDisconnect) limiterToDisconnect.disconnect();
  }, BUS_DISCONNECT_DELAY_MS);
  _layerBus = {};
  _layerAnalyser = {};
  _layerMeterBuf = {};
  _masterMakeup = null;
  _limiter = null;

  _initialized = false;
  _ctx = null;
}

// v in [0, 1] — the FADER value, not the trimmed bus gain. Always stores the
// value, even with no AudioContext yet, so a fader moved before Start is
// respected once init() creates the buses (reads _layerLevel[key] * the
// layer's trim as that bus's initial gain — see init() above). Fader at 1
// now means "calibrated level" (fader x trim), not "unity gain".
function setLayerLevel(key, v) {
  const clamped = Math.max(0, Math.min(1, v));
  _layerLevel[key] = clamped;
  _applyBusGain(key);
}

// Returns the FADER value (0-1), never the trim-adjusted bus gain — callers
// (index.html's fader UI) only ever need to know where the slider sits.
function getLayerLevel(key) {
  return _layerLevel[key];
}

// Peak (0-1) of the layer's current output, read from its AnalyserNode's
// time-domain buffer. Returns 0 if the layer has no analyser yet (before
// Start, or after Stop).
function getLayerMeter(key) {
  const analyser = _layerAnalyser[key];
  if (!analyser) return 0;
  const buf = _layerMeterBuf[key];
  analyser.getFloatTimeDomainData(buf);
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    const abs = Math.abs(buf[i]);
    if (abs > peak) peak = abs;
  }
  return peak;
}

export default {
  init, update, onListenerMove, stop, setLayerEnabled, LAYER_ENABLED,
  setLayerLevel, getLayerLevel, getLayerMeter,
};
