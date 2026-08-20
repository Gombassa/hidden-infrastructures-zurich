// instrument-layers.js — Phase 3 Step 8 (reintegration). Replaces AudioLayers
// (src/audio-layers.js) as what index.html actually runs on, orchestrating
// the 17 real src/instruments/*.js instances that together voice all 24
// behaviours built in Steps 1-7. Public shape matches AudioLayers exactly
// ({ init, update, onListenerMove, stop, setLayerEnabled, LAYER_ENABLED }) —
// index.html's call sites needed only an import/name change, not a shape
// change, per docs/Implementation_Plan.md Step 8.
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

let _ctx = null;
let _initialized = false;

// Shared density reverb (ported from _initSharedReverb, audio-layers.js ~L131-140)
let _reverbBus = null;
let _reverbConvolver = null;
let _reverbOut = null;

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
  _reverbOut.connect(ctx.destination);
}

function init(ctx) {
  if (_initialized) return;
  _initialized = true;
  _ctx = ctx;
  const dest = ctx.destination;

  _initSharedReverb(ctx); // must come first — instruments send into it during construction

  waterPulse = new WaterProximityPulse(ctx, dest);
  waterDrip = new WaterFittingDrip(ctx, dest);
  waterCrossing = new LineCrossingVoice(ctx, dest, WATER_CROSSING);

  elecPool = new ElectricityOscillatorPool(ctx, dest, { reverbBus: _reverbBus });
  elecCrossing = new LineCrossingVoice(ctx, dest, ELECTRICITY_CROSSING);

  crackle = new FeederCrackle(ctx, dest);
  drone = new TramDrone(ctx, dest, { reverbBus: _reverbBus });
  hissPool = new TramHissPool(ctx, dest);

  sewageRumble = new SewageRumble(ctx, dest, { reverbBus: _reverbBus });
  sewageThud = new SewageJunctionThud(ctx, dest);
  sewageGurgle = new SewageGurgle(ctx, dest);
  sewageCrossing = new LineCrossingVoice(ctx, dest, SEWAGE_CROSSING);

  telecomPool = new TelecomBurstPool(ctx, dest, { reverbBus: _reverbBus });
  telecomChirp = new TelecomNodeChirp(ctx, dest);
  telecomHandshake = new TelecomNodeHandshake(ctx, dest);
  telecomClick = new TelecomClickVoice(ctx, dest);

  fernThermal = new FernwaermeThermal(ctx, dest, { reverbBus: _reverbBus });
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

    for (const n of telecomNodes) if (n.triggered) telecomChirp.trigger({ id: n.id });

    const nowT = Date.now();
    const triggeredNodeIds = new Set(telecomNodes.filter(n => n.triggered).map(n => n.id));
    for (const id of [...telecomNodeDwell.keys()]) if (!triggeredNodeIds.has(id)) telecomNodeDwell.delete(id);
    for (const id of triggeredNodeIds) {
      if (!telecomNodeDwell.has(id)) telecomNodeDwell.set(id, nowT);
      else if (nowT - telecomNodeDwell.get(id) > 5000) telecomHandshake.trigger({ id });
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

function setLayerEnabled(key, enabled) {
  LAYER_ENABLED[key] = enabled;
  if (!_ctx || !_initialized || enabled) return;
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
  _initialized = false;
  _ctx = null;
}

export default { init, update, onListenerMove, stop, setLayerEnabled, LAYER_ENABLED };
