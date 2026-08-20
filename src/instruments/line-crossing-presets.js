// line-crossing-presets.js — per-layer presets for src/instruments/line-crossing-voice.js.
// One shared module rather than inline values at each call site: water and
// sewage added their own preset here in docs/Implementation_Plan.md Steps
// 3/5, keeping the "one voicing function, N presets" consolidation (Decision
// Point 4) visible in one place rather than scattered across per-layer
// surfaces. Telecom (Step 6) does NOT — see the note at the bottom of this
// file for why the consolidation doesn't extend to a 4th preset here.
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

// Ported from _triggerSewageCrossing (src/audio-layers.js ~L411-425).
// Deliberately has NO alongsideBaseMs/alongsideJitter: unlike electricity and
// water, sewage's alongside loop does not re-fire this crossing sound — it
// re-fires the gurgle sound instead (confirmed against
// docs/Technical_Architecture_v5.md: "Alongside loop: gurgle rhythm ~4s ±35%
// jitter", and src/audio-layers.js's _scheduleSewageKnock calling
// _triggerSewageGurgle, not _triggerSewageCrossing). This preset is only
// ever driven via LineCrossingVoice.trigger() — setAlongsideActive() is
// never called on the instance built from it. See
// src/instruments/sewage-gurgle.js for where alongside actually lives, and
// docs/Implementation_Plan.md Step 5 for the full finding.
export const SEWAGE_CROSSING = {
  freq: 200,
  q: 3.5,
  duration: 0.35,
  attack: 0.01,
  gain: 0.07,
  crossingCooldownMs: 3000,
};

// No TELECOM_CROSSING here — telecom's cable-crossing click/alongside (#19,
// #20) is NOT a LineCrossingVoice instance, deliberately. Its sound is a
// swept sine oscillator (_triggerTelecomClick, 3500->6000Hz), not filtered
// noise like every preset above — LineCrossingVoice._fire() can't reproduce
// a sweep, so a preset alone wasn't enough. See
// src/instruments/telecom-click-voice.js and docs/Implementation_Plan.md
// Step 6 / Decision Point 4 for the full finding (the second revision to
// "one class serves all 4 layers" — the first was SEWAGE_CROSSING's note
// above).
