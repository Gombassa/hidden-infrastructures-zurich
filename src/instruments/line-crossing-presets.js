// line-crossing-presets.js — per-layer presets for src/instruments/line-crossing-voice.js.
// One shared module rather than inline values at each call site: three more
// layers (water, sewage, telecom) will add their own preset here in
// docs/Implementation_Plan.md Steps 3/5/6, keeping the "one voicing function,
// N presets" consolidation (Decision Point 4) visible in one place rather than
// scattered across per-layer surfaces.
//
// Values ported unchanged from src/audio-layers.js's _triggerElecSnap /
// _scheduleElecSnap / _setElecSnapActive — NOT from instruments/crossing-family.html's
// exploratory values (which differ slightly: Q=9 not 8, decay 0.06s not 0.08s,
// plus unused sweep/level knobs). Production is the parity target.

export const ELECTRICITY_CROSSING = {
  freq: 2200,
  q: 8,
  duration: 0.08,
  attack: 0.002,
  gain: 0.10,
  crossingCooldownMs: 3000,
  alongsideBaseMs: 5000,
  alongsideJitter: 0.4,
};

// Ported from _triggerWaterKnock/_scheduleWaterKnock/_setWaterKnockActive
// (src/audio-layers.js ~L814-853).
export const WATER_CROSSING = {
  freq: 380,
  q: 4,
  duration: 0.4,
  attack: 0.01,
  gain: 0.07,
  crossingCooldownMs: 3000,
  alongsideBaseMs: 3500,
  alongsideJitter: 0.3,
};

// SEWAGE_CROSSING, TELECOM_CROSSING added in Steps 5/6 — not stubbed now;
// their production values haven't been verified this session.
