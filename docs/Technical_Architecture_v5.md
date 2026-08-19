# Hidden Infrastructures: Zürich — Technical Architecture

# Executive Summary

This document describes the technical architecture for Hidden Infrastructures: Zürich, a location-based generative music application that sonifies six layers of urban infrastructure through spatial audio. The system combines real-time municipal data, procedural audio synthesis, and privacy-by-design principles to create an accessible public artwork requiring only a smartphone and headphones.

Coding and advanced technical implementations have been developed with the assistance of Anthropic Claude's coding agent. All sound design is conceived and created from the outset by the artist, with some code reviews and assistance from AI.

This document reflects the current implemented state as of July 2026. For code, see the [GitHub repository](https://github.com/Gombassa/hiddeninfrastructures-zurich).

The piece is an homage to the City and the principles enshrined in the Open By Default resolution of the City Council of 2021, enhancing accessibility and transparency through:

* Zero personal data collection — FADP/GDPR compliant by design
* Browser-based Progressive Web App — no app store barriers
* Real-time procedural audio synthesis via Web Audio API — no large data transfers
* Six infrastructure layers with spatial audio and interactive layer toggles
* Real-time data integration from [www.stadt-zuerich.ch](http://www.stadt-zuerich.ch) open data sources
* Offline-capable after initial load (planned — see Future Development Work)

---

# Development Status (July 2026)

All Phase 2 components are built, integrated, and deployed. The production audio path has narrowed from a two-toolchain plan (Web Audio placeholder + Max/MSP → RNBO production patches) to a single toolchain: browser-native Web Audio instruments authored and deployed in the same runtime. See "Audio Instrument Architecture" below for what that means and what's still an open decision.

## 1. Audio Synthesis Pipeline

**Production path: direct Web Audio API synthesis**

All six infrastructure layers are implemented as procedural synthesis in `src/audio-layers.js`. This is field-tested, confirmed working, and — as of July 2026 — the sole production audio path. Max/MSP and RNBO (Cycling '74) are no longer part of the toolchain (see "Architecture Decision: Dropping Max/MSP + RNBO" below).

**Spatial Audio**

Spatial positioning uses the Web Audio API PannerNode in HRTF mode for per-feeder hiss positioning (tram layer). Fernwärme uses a StereoPanner driven by the computed bearing from listener to the nearest pipe segment (relative to listener heading) — StereoPanner rather than HRTF because HRTF provides poor directional cues below ~200Hz; a 60Hz fundamental won't localise meaningfully with head-related transfer functions, and this reasoning applies to any future sub-200Hz source. GPS coordinates and compass heading from `DeviceOrientationEvent` determine bearing and distance to each source.

## 2. Core Engine Modules

**TramEngine** (`src/tram-engine.js`)

Polls transport.opendata.ch every 10 seconds for live tram departure times, then interpolates positions between stops at 15 km/h average speed. Built as a singleton with observer pattern. Handles API failures gracefully by retaining last known positions.

**ProximityEngine** (`src/proximity-engine.js`)

Loads all 7 GeoJSON files in parallel on `init()`. Calculates distances from listener to infrastructure elements using haversine and nearest-point-on-segment math. Returns structured proximity results for all 6 layers each `calculate()` call.

Key capabilities added in Phase 2:

- **Nearest-point-on-segment distance** for all LineString features — more accurate than endpoint or midpoint checks
- **Spatial culling** (`cullBounds`) — bounding-box pre-filter eliminates distant features before precise distance math
- **`extendLinesWithMovement()`** — applied to all 5 LineString layers (water pipes, sewage pipes, electricity cables, telecom cables, fernwärme pipes); adds `crossing` and `alongside` boolean flags per feature each tick using cross-product sign test (`segsCross`) and acute angle threshold (35°, ALONGSIDE_RADIUS 20m, MIN_MOVE_METRES 0.5)
- **Sewage junction clustering** — `computeSewageJunctions()` clusters pipe endpoints within 8m at init; junction proximity triggers distinct thud events
- **`nearestSegmentBearing()`** — computes bearing (0–360° from N) from listener to nearest point on nearest fernwärme pipe segment; returned in the pipe proximity result for stereo panning
- **Hydrant exclusion** — LKZ1322-MSU- water features filtered at parse time

**AudioLayers** (`src/audio-layers.js`)

All six audio layers as a single ES module singleton. Lifecycle: `init(ctx)` on Start creates all nodes; `stop()` performs full teardown. `onListenerMove(lat, lng, heading)` updates hiss panner positions on GPS fix between 10-second tram ticks. This is the module the instrument-architecture rebuild (below) will decompose.

**GPS Listener** (inline in `index.html`)

Live GPS via `navigator.geolocation.watchPosition()`. Compass heading via `DeviceOrientationEvent`. No synthesis code in `index.html`.

## 3. Audio Layer Implementations (current, pre-rebuild)

This section documents what `src/audio-layers.js` does today. It is the baseline the instrument rebuild in `docs/Implementation_Plan.md` works from — not a target architecture. Per-behaviour granularity is discussed below.

### Tram Electrical

- **Hiss pool**: 6 comb-filtered noise nodes, distinct delay times per slot (2.3–8.9ms), HRTF-positioned PannerNodes updated on GPS fix
- **Crackle**: debounced one-shot per feeder ID, proximity-scaled gain via a (1−t)² falloff over `CRACKLE_FALLOFF_RADIUS` (150m), speed-mode detection
- **Drone**: dual 110/112Hz oscillators, dual LFO sweep (0.017/0.023Hz ±8Hz), gain ramp on powerline proximity (20m→5m); private convolver reverb (2.0s, 3% wet)
- **Sends to shared density reverb bus**

### Water

- **Proximity pulse**: proximity-scaled bandpass burst on entry (pipe 800Hz 0.25s / fitting 1200Hz 0.08s), 30s cooldown; gain 0.04–0.18 by distance
- **Fitting cluster drip**: 2800Hz bursts at rate proportional to fitting count within 15m (up to 3Hz), ±25% jitter
- **Pipe crossing**: 380Hz knock one-shot, 3s cooldown
- **Alongside loop**: 380Hz knock at ~3.5s ±30% jitter while walking parallel to pipe within 20m

### Sewage

- **Continuous rumble**: looped lowpass noise (180Hz LP), gain ramped by nearest pipe distance (80m threshold, TC 1.5s)
- **Rhythmic gurgle**: 100Hz bandpass burst, random 1.25–5s interval, active below 20m
- **Junction thud**: 55Hz burst (0.6s, gain 0.14) on junction entry, 10s cooldown per junction
- **Pipe crossing**: 200Hz transient, 3s cooldown
- **Alongside loop**: gurgle rhythm ~4s ±35% jitter
- **Sends to shared density reverb bus**

### Electricity

- **Oscillator pool**: 8 slots, paired sawtooth oscillators per slot (1490–1510Hz spread, +3Hz beating), LFO amplitude modulation (0.4Hz ±0.008); slots claimed/released per node ID via a persistent `Set`-backed model (`_elecClaim`/`_elecRelease`) — first free slot wins, no swap-on-exhaustion logic
- **Node cluster density**: count nodes within 30m → gain multiplier 1.0–1.8× (5+ nodes = maximum density)
- **Master gain**: gates on node proximity, boosted by cable proximity (40m threshold)
- **Cable crossing snap**: 2200Hz bandpass noise (0.08s, gain 0.10), 3s cooldown
- **Alongside loop**: snap at ~5s ±40% jitter
- **Sends to shared density reverb bus**

### Telecom

- **Burst pool**: 4 noise sources, HP filtered at 5000/5600/6200/6800Hz per slot; each amplitude-gated by a slot-specific LFO (22/38/54/78Hz base rates); master gain from nearest cable proximity (30m threshold). Unlike the electricity pool, these 4 slots are always running — there is no per-feature claim/release, only collective proximity gating and rate modulation
- **Density modulation**: cable count within 30m scales LFO rates 0.5–2.0× (simulates data traffic density)
- **Node-entry chirp**: sine sweep 2000→4000Hz, 0.2s, per-node debounce
- **Node dwell handshake**: 5s dwell triggers 1000→8000Hz sweep (0.4s, gain 0.18), 8s cooldown per node
- **Cable crossing click**: 3500→6000Hz sweep (0.06s, gain 0.10), 3s cooldown
- **Alongside loop**: click at ~4s ±45% jitter
- **Sends to shared density reverb bus**

### Fernwärme

- **Continuous tone**: 60Hz sine + 0.3Hz tremolo LFO modulating carrier gain (±0.4, multiplicative — prevents bleed when master=0)
- **StereoPanner**: bearing from listener to nearest pipe segment (relative to heading) drives pan value; `sin(relBearing)` → −1 (left) to +1 (right); 1s time constant
- **Proximity**: 30m radius (tightened from 60m for dramatic rare encounters); 0.4s ramp-in time constant
- **Pipe crossing**: 60Hz burst (0.5s, gain 0.15) routed through StereoPanner so it localises in the pipe's direction, 3s cooldown
- **Alongside loop**: thermal burst at ~6s ±40% jitter
- **Sends to shared density reverb bus**

### Shared Density Reverb

- **Bus**: 5 continuous-gain outputs (tram drone, sewage, electricity master, telecom burst master, fernwärme master) all send into a shared GainNode → ConvolverNode (1.8s impulse response) → wet GainNode → destination
- **Density score**: each `update()` tick counts enabled layers with triggered features (0–6)
- **Wet level**: `pow((density−1)/5, 1.5) × 0.07`, kicks in at 2+ overlapping layers (≈0.006 wet), peaks at all 6 layers (0.07 wet); slow TC 2.5s — spatial accumulation, not a switch
- **Effect**: Bahnhofstrasse (tram+water+elec+telecom = 4 layers) reaches ≈0.033 wet on top of the tram's private reverb, making dense infrastructure overlap perceptibly richer

---

# Architecture Decision: Dropping Max/MSP + RNBO

**Decision (July 2026):** production sound design will not go through Max/MSP → RNBO → WASM/AudioWorklet. Each sonic behaviour is authored directly as a self-contained Web Audio instrument in JavaScript, with an accompanying HTML control surface for hands-on sound design and MIDI-driven auditioning.

**Why:**

- A CHF 9,000 funding application (Ideenfindung und Konzeptentwicklung, ref 2026/KTR 24950) was refused in June 2026. Avoiding non-essential spend is now a live constraint. The Max/MSP (CHF 354) and RNBO (CHF 265) permanent licences — CHF 619 total — are removed from the budget entirely (see `docs/Project_Plan_v3_5.md`).
- Browser-native Web Audio synthesis is already field-validated across all six layers. Every risk-mitigation section in prior planning docs already named direct Web Audio synthesis as the sanctioned fallback if RNBO proved problematic. This pivot promotes that fallback to the primary path — a narrowing of the toolchain, not a change of technology or of the artistic concept.
- Authoring in the browser means the authoring environment and the deployment target are the same runtime. What is heard while designing is exactly what ships. No export step, no compilation stage, no toolchain drift between patch and product.
- It reinforces the browser-only, no-app-store principle already core to the project.

This is a simplification of an already-working path, not a rescue or a reinvention. `max/` and `docs/archive/max/` retain the Max for Live patch specifications as sonic reference — signal chains, envelope shapes, proximity mappings, and pool structures translate directly into the new instruments even though the Max-specific object notes (`line~` syntax, `adsr~`/`comb~`/`reson~` limitations) do not.

---

# Audio Instrument Architecture

## Granularity: one instrument per sonic behaviour

**Reopened (was: held at 23, revisit only on unmanageable duplication).** `instruments/crossing-family.html` — built to cover 8 of the inventory's crossing/alongside items in one page — reports exactly the duplication signal this decision was waiting for: one detection path, one voicing function, 8 parameter presets, not 8 instruments. See `docs/Implementation_Plan.md` Decision Point 4 for the live status; this section's table and count are corrected to 24 below but not yet consolidated. Absent a final call, each sonic behaviour still gets its own instrument module — not one instrument per infrastructure layer. Water, for example, yields four instruments (proximity pulse, fitting-cluster drip, pipe-crossing knock, alongside loop) rather than one "water instrument." This mirrors how `audio-layers.js` is already internally organised (distinct trigger/schedule functions per behaviour) and matches the Max for Live patch boundaries in `docs/archive/max/patch-inventory.md`.

**Behaviour inventory** (derived from `src/audio-layers.js`, cross-checked against the 19 archived M4L patches):

| Layer | Behaviours | Count | M4L patches available |
|---|---|---|---|
| Tram electrical | feeder crackle, hiss pool, drone | 3 | 3 |
| Water | proximity pulse, fitting drip, pipe-crossing knock, alongside loop | 4 | 2 (crossing/alongside have no patch) |
| Sewage | continuous rumble, rhythmic gurgle, junction thud, pipe crossing, alongside loop | 5 | 5 |
| Electricity | oscillator pool (density gain folded in), cable crossing snap, alongside loop | 3 | 3 |
| Telecom | burst pool (density modulation folded in), node chirp, node dwell handshake, cable crossing click, alongside loop | 5 | 5 |
| Fernwärme | tone + tremolo + panner, pipe crossing burst, alongside loop | 3 | 1 (crossing/alongside have no patch) |
| Water (new) | continuous flow bed | 1 | 0 — no spec, invented during instrument-build, not present in `audio-layers.js` either |
| **Total** | | **24** | **19** |

Water's and Fernwärme's crossing/alongside behaviours were added to the JS after their Max patches were authored — those 4 instruments have no Max-era signal-chain spec to translate from and were built directly from the current `audio-layers.js` implementation instead (as `instruments/crossing-family.html` and `instruments/fernwaerme-thermal.html` respectively — see `docs/instrument-reference.html`).

Density-gain and rate-modulation (electricity's node-count multiplier, telecom's cable-count LFO scaling) are treated as **parameters of the pool instrument**, not separate instruments — they modulate an existing sound rather than producing an independent one.

The District 1 musical theme is now Phase 3 scope (`docs/Project_Plan_v3_5.md`) rather than deferred indefinitely — but it is deliberately **not** a 24th entry in the table above. It's a continuous ambient foundation the six layers perform atop, architecturally closer to the shared density reverb bus (a piece of infrastructure the layers all relate to) than to a per-behaviour instrument tied to proximity events from one layer's geodata. The 24-instrument count and the granularity decision above are unaffected by the theme's schedule move.

**This has happened, not just "if":** the risk this section flagged as a later possibility — 23 (now 24) per-behaviour modules producing unmanageable duplication — is what `crossing-family.html` found in practice for the 8 crossing/alongside items (most behaviours do share the one-shot-with-cooldown or randomised-loop-with-jitter shape already documented in `docs/archive/max/patch-inventory.md`). Consolidating toward per-layer instruments with behaviour *modes* remains an acceptable correction and is now a live decision, not a hypothetical one — see `docs/Implementation_Plan.md` Decision Point 4. The interface contract below is written so that change wouldn't require revisiting the surrounding application wiring — see Option B.

## The interface contract — decided (Step 1, ratified)

**Ratified: Option A** (class-per-instrument, uniform lifecycle), built for real against both Step 1 proof instruments — `WaterProximityPulse` (`src/instruments/water-proximity-pulse.js`) and `ElectricityOscillatorPool` (`src/instruments/electricity-oscillator-pool.js`), sharing `src/instruments/instrument-base.js` and `src/instruments/pool-allocator.js`. Option B was eliminated before build on documented pool-fit grounds (see its trade-off paragraph below) — electricity was deliberately chosen as the proof instrument because it's a persistent-claim pool, which is exactly the case Option B is weakest against. Option C was evaluated by inspection against the real Option A build rather than built in parallel: it's close to what `audio-layers.js` already did informally, and the concrete evidence against it arrived unprompted — `instruments/hiss-voice.html` and `instruments/electricity-hum.html` had already independently reinvented an identical claim/steal/margin/refuse allocator (byte-identical FNV-1a hash + mulberry32 RNG helpers) before this decision was made, which is Option C's "23 modules can drift" risk actually occurring rather than a hypothetical. `src/instruments/pool-allocator.js` is the fix for that duplication.

**Pool-exhaustion policy, also decided in this step**: steal-furthest + margin (20% margin) — see the "Pool-exhaustion behaviour" bullet below, and `PoolAllocator.claim()` in `src/instruments/pool-allocator.js` for the implementation. This replaces production's accidental silent-drop (`audio-layers.js`'s `_elecClaim`: `if (!slot) return;`) as a deliberate choice, not a preserved accident.

**Step 1 is done**, per `docs/Implementation_Plan.md`'s done-means criteria — unblocking Steps 2–7 (`docs/Implementation_Plan.md` line 132: "Step 1 hard-blocks Steps 2–7").

The comparison below is kept as the record of *why* — every instrument still needs a common way to be instantiated, fed the parameters ProximityEngine already emits (distance, density, crossing, alongside, bearing, dwell), triggered for discrete events, and torn down. Three candidate shapes were considered, each grounded in what the codebase already did:

### Option A — Class-per-instrument, uniform lifecycle — RATIFIED

Each instrument is a small class: `new WaterProximityPulse(ctx, outputNode)`, with `.update(params)`, `.trigger(params)` (for one-shots), and `.destroy()`. Pools (electricity, telecom, tram hiss) become a thin wrapper class that owns N instrument instances and implements its own claim/release policy internally.

- **Lifecycle:** explicit and uniform — matches `AudioLayers.init()`/`stop()` today, just distributed across more objects.
- **Parameter passing:** `.update(params)` takes the same shape ProximityEngine already returns per feature; no translation layer needed.
- **Pool fit:** each pool type keeps its own claim model (electricity's persistent `Set`, telecom's always-on slots, tram's stateless reassignment) inside its wrapper — the three existing paradigms don't need to be forced into one.
- **HTML control surface:** binds directly to the same class — instantiate it standalone, feed it a MIDI CC stream instead of ProximityEngine output.
- **Score archive:** logging is a matter of wrapping `.trigger()`/`.update()` calls; straightforward to intercept at the call site.
- **Trade-off:** 23 classes is more files and more boilerplate than today's single module, even with a shared base class factoring out the common node-graph teardown logic.

### Option B — Behaviour-as-config, one generic instrument runner — ELIMINATED (poor pool-fit)

A single generic runner takes a declarative spec per behaviour (oscillator/noise source type, filter chain, envelope shape, parameter-to-gain mapping) and produces the Web Audio graph from it. Most behaviours already fit one of two shapes documented in the archived Max notes — "one-shot with cooldown" and "randomised loop with jitter" — so the spec format could be small.

- **Lifecycle:** one runner type to init/destroy; behaviours differ only in their config object.
- **Parameter passing:** the mapping from ProximityEngine fields to synthesis parameters lives in the config, declaratively — easy to audit all 23 mapping curves in one place (relevant given the note below on unaudited curves).
- **Pool fit:** awkward. Pools aren't just "many of the same instrument" — electricity's persistent claim/release and telecom's always-on collective gating are different *behaviours*, not just multiple instances. Pooling would need to be a property the runner understands, which pulls it back toward Option A's complexity for exactly the cases where pooling matters most.
- **HTML control surface:** binds to the runner generically, which could make a single generic control UI reusable across instruments — but might also make it harder to expose per-behaviour idiosyncrasies (e.g. Fernwärme's bearing-driven pan) cleanly.
- **Score archive:** logging is uniform across all behaviours almost for free, since they all go through one code path.
- **Trade-off:** if per-behaviour granularity gets consolidated later (see above), this option absorbs that change easily — the config just grows a "mode" field. That flexibility comes at the cost of more upfront design work on the config schema before writing any instrument at all.

### Option C — Keep `audio-layers.js`'s current shape, extract per-behaviour modules without a shared base — EVALUATED BY INSPECTION, NOT BUILT

Each behaviour becomes its own small module (a factory function returning `{ update, trigger, destroy }`) but there is no shared interface enforced beyond that duck-typed shape — closest to a mechanical refactor of what exists today, just split into 23 files instead of 6 layer-sections in one file.

- **Lifecycle:** whatever each module wants, as long as it exposes `update`/`trigger`/`destroy`. Fast to build, since it's mostly a cut-and-paste of existing functions.
- **Parameter passing:** unchanged from today — `AudioLayers.update()`'s per-layer proximity shape stays the caller's job to unpack.
- **Pool fit:** no change to the three existing paradigms; each pool wrapper keeps doing what it does today.
- **HTML control surface:** each surface is bespoke per module, since there's no shared contract to bind against generically.
- **Score archive:** logging has to be added per module rather than once, since there's no shared entry point to intercept.
- **Trade-off:** cheapest to build first, but the least future-proof — with no enforced contract, 23 modules can drift into 23 slightly different shapes over time, and the HTML control surfaces won't be reusable across instruments.

**Resolved as of Step 1.** `docs/Implementation_Plan.md` ("Decision Points," item 1) laid out the comparison criteria (code volume, pool-fit, control-surface reusability, score-archive logging fit, mapping-curve-audit fit) applied here once the two Step 1 proof instruments — water proximity pulse and electricity oscillator pool — existed for real. Option A won primarily on pool-fit (proven directly against `ElectricityOscillatorPool`, the paradigm case) and on control-surface reusability (`PoolAllocator` is now shared, not reinvented per surface) — see the ratification note above for the full reasoning.

## Open questions — status

- **Does the HTML control surface ship in the production build, or stay authoring-only?** **Reopened.** Was decided as authoring-only by default: all 24 instruments still get a control surface as a dev tool for sound design and MIDI-driven auditioning, with any specific control promoted into the production UI only per-control, later, once it exists and can be tried, and only with schedule headroom to harden it for production use. In practice, `docs/instrument-reference.html` reports the built surfaces are reachable on the deployed URL and one is linked from `index.html` — i.e. this question is currently being answered by default rather than deliberately. See `docs/Implementation_Plan.md`, Decision Points, item 2, for the live status.
- **Pool-exhaustion behaviour.** **Resolved.** Steal-furthest + margin (20% margin), decided in Step 1 against the electricity pool proof instrument and implemented in `src/instruments/pool-allocator.js`'s `PoolAllocator.claim()`. Applies as the single policy for all three pools (electricity now; tram hiss and telecom burst when they're built in Steps 4 and 6) rather than three separate per-pool decisions. Replaces electricity's previous silent-drop, which was production's accidental default, never a chosen policy.
- **Mapping-curve audit.** Still open, and it's a task rather than a decision. Feeder crackle's (1−t)² falloff over 150m is validated and should be carried forward as-is. The other layers' proximity-to-gain curves (mostly linear) have not had the same scrutiny — flagged in `docs/archive/max/TECHNICAL_NOTES.md` and repeated here so it doesn't get lost in the pivot.

---

# System Architecture Overview

## Data Flow

```
transport.opendata.ch API (10s)
        ↓
   TramEngine.js
        ↓
ProximityEngine.js ← lk-*.geojson (7 files, loaded once)
        ↓               ↑
   calculate()    listener lat/lng/heading (GPS)
        ↓
   AudioLayers.update(proximity, lat, lng, heading)
        ↓
Web Audio API (destination → headphones)
```

## ProximityEngine Output Shape

```javascript
{
  substations: [{id, lat, lng, tramCount, nearestTramDist}],
  feeders:     [{id, lat, lng, triggered, triggeringTram}],
  nearestPowerlineDist,          // metres to nearest tram trasse
  water:       { pipes: [{id, midLat, midLng, dist, triggered, crossing, alongside}],
                 fittings: [{id, lat, lng, dist, triggered}] },
  sewage:      { pipes: [{...crossing, alongside}],
                 junctions: [{id, lat, lng, dist, triggered}] },
  electricity: { nodes: [{id, lat, lng, dist, triggered}],
                 cables: [{...crossing, alongside}] },
  telecom:     { nodes: [{id, lat, lng, dist, triggered}],
                 cables: [{...crossing, alongside}] },
  fernwaerme:  { pipes: [{...crossing, alongside, bearing}] },
}
```

## Audio Graph (simplified, current implementation)

```
TramEngine tick / GPS fix
        ↓
AudioLayers.update() / onListenerMove()
        ↓
Per-layer synthesis nodes (all in audio-layers.js)
  ├── Tram: droneGain → destination + droneConvolver (private reverb) + sharedReverbBus
  ├── Sewage: sewageGain → destination + sharedReverbBus
  ├── Electricity: elecMasterGain → destination + sharedReverbBus
  ├── Telecom: telecomBurstMasterGain → destination + sharedReverbBus
  └── Fernwärme: fernMasterGain → StereoPanner → destination + sharedReverbBus
        ↓
sharedReverbBus → Convolver (1.8s IR) → sharedReverbOut (density-driven wet) → destination
```

## Performance Optimisation

**Spatial culling:** `cullBounds()` computes a bounding box at 100m radius; `cullLines()` and `cullPoints()` pre-filter features before distance math. The "26,000+ total features" this claim used to cite is stale — the current total is in the counts table above (84,098 as of this pass) and keeps growing with each GeoShop ingestion; the post-cull "~50–200 nearby" figure was never formally measured (`docs/Project_Plan_v3_5.md`'s Phase 3 checklist says as much) and isn't corrected here since there's nothing to recompute it from — it needs an actual field measurement, not a document edit.

**Movement detection:** `extendLinesWithMovement()` only fires crossing/alongside logic when `moveDist > MIN_MOVE_METRES (0.5m)` and a previous position exists — prevents spurious events on GPS jitter.

**Audio pooling:** Electricity oscillator pool (8 slots) and telecom burst pool (4 slots) are pre-allocated at init; slots are claimed/released (electricity) or run continuously and gated collectively (telecom) without creating new Web Audio nodes per feature. Tram hiss pool (6 slots) is reassigned to the nearest-N feeders each tick rather than claimed by ID.

**Timer-based scheduling:** All alongside loops and rhythmic patterns use `setTimeout` recursion with jitter (not `setInterval`) — self-cancelling when layer is disabled or stopped.

---

# Data Layer

Extraction pipeline: `scripts/extract-lk-geojson.js` processes GeoShop DXF tile orders tracked in `data/processed/.processed-orders.json`; new tile ingestion is automated via `scripts/import-new-tiles.js`. Both scripts call `scripts/generate-counts.js` at the end of their run, which rewrites the counts below directly from `public/lk-*.geojson` — see `CLAUDE.md`'s standing instruction.

| File | Content | ProximityEngine radius |
|---|---|---|
| `lk-water.geojson` | Pipes + fittings (WVZ, hydrants excluded) | 50m pipe / 25m fitting |
| `lk-sewage.geojson` | Pipes only (manholes, Nebenleitung excluded) | 80m pipe / 15m junction |
| `lk-electricity.geojson` | Cables + nodes (area footprints excluded) | 40m nodes / 40m cables |
| `lk-tram-lk.geojson` | Trasse + nodes (overhead excluded — area is not, see counts/warnings below) | 50m feeders / 5m drone |
| `lk-telecom.geojson` | Cables + nodes (overhead excluded — area is not, see counts/warnings below) | 40m nodes / 30m cables |
| `lk-fernwaerme.geojson` | District heating pipes | 30m pipes |

Current per-file counts (plus `substations.geojson`, 71 features, loaded separately — see ProximityEngine Output Shape above):
<!-- COUNTS:BEGIN -->
| File | Total features | By geomType | Size |
|---|---|---|---|
| `lk-sewage.geojson` | 12,386 | pipe: 12,386 | 5.43 MB (5,432,829 B) |
| `lk-electricity.geojson` | 24,491 | cable: 17,556, node: 6,935 | 10.63 MB (10,626,231 B) |
| `lk-water.geojson` | 17,472 | pipe: 12,204, fitting: 5,268 | 6.82 MB (6,815,319 B) |
| `lk-tram-lk.geojson` | 12,199 | trasse: 7,811, node: 2,404, area: 1,984 | 6.02 MB (6,016,563 B) |
| `lk-telecom.geojson` | 28,230 | cable: 21,691, node: 4,306, area: 2,233 | 13.39 MB (13,388,469 B) |
| `lk-fernwaerme.geojson` | 561 | pipe: 561 | 290.2 KB (290,201 B) |

**103 GeoShop orders processed** (55297–56922) · **95,339 total features** across 6 files · **42.57 MB (42,569,612 B)** served.

*Generated by `scripts/generate-counts.js` from `data/processed/.processed-orders.json` and `public/lk-*.geojson` — do not hand-edit the content between the markers above and below.*
<!-- COUNTS:END -->

Updated via `/extract` (3 new orders, +347 features across all six layers). Previously 88 orders/55297–56642, 83,751 total features.

See `docs/phase2-data-layer.md` for the extraction pipeline and iteration log. Note: that document's own "Extracted Files" feature counts reflect an earlier 12-order snapshot and are stale against the totals above (30 orders) — flagged, not corrected, per that document's own scope.

# Deployment

**Hosting:** Google Cloud Platform, Cloud Run. Current URL: https://hidden-infrastructures-zurich-50944718104.europe-west2.run.app/

**Docker:** Multi-stage build — Node.js build stage (Vite) → Nginx serve stage. `nginx.conf` and `vite.config.js` both set `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless`. This pair enables cross-origin isolation, which is required for `SharedArrayBuffer` and high-resolution timers — **not** for AudioWorklet itself, which does not require cross-origin isolation. As of this writing, neither SharedArrayBuffer nor AudioWorklet is actually used anywhere in the codebase, so these headers are currently retained without an active requirement. Kept in case a future instrument needs off-main-thread processing via AudioWorklet combined with SharedArrayBuffer for shared memory between the audio thread and main thread — a legitimate forward-looking reason, but distinct from what was previously stated here.

**Dev workflow:** `npx vite --host` (port 8080) + Cloudflare Tunnel for HTTPS on Android Chrome field testing.

**CI/CD:** Push to `main` → GitHub → Cloud Run picks up automatically.

---

# Future Development Work

See `docs/Project_Plan_v3_5.md` for the phased timeline to public launch and `docs/Implementation_Plan.md` for the instrument build plan specifically. In brief, ahead of launch:

- Instrument architecture: resolve the interface contract (still open), integrate the 10 surfaces already built (22 of 24 behaviours — see `docs/instrument-reference.html`) and build the 2 remaining
- PWA: Service Worker, Web App Manifest, offline caching — not yet started
- User testing across District 1
- Documentation and launch materials

## District Expansion (2027–2030)

Scale to postal codes 8002–8006 with a unique musical theme per district. Auto-switch based on GPS-detected postal code. Unchanged by this pivot.

---

**Document Version:** 5.3
**Last Updated:** August 2026
**Changes from v5.2 (progress sync):** 10 of the 24-item instrument inventory (see below — corrected from 23) now exist as standalone HTML surfaces under `instruments/`, documented in the new companion doc `docs/instrument-reference.html`. Two decisions previously marked resolved in "Open questions — status" are reopened by what that build work found: control-surface production shipping (surfaces are reachable on the deployed URL already, not authoring-only as decided) and granularity (`crossing-family.html` shows 8 of the 24 items are one module with presets, not 8 separate instruments). Behaviour inventory table gains a Water Flow row (#24), a new continuous-bed behaviour with no prior spec. See `docs/Implementation_Plan.md` v1.2 for the full build-status detail this document summarises.
**Changes from v5.1 (correction pass):** Corrected the COEP/COOP justification in Deployment — the correct reason is SharedArrayBuffer/high-resolution-timer cross-origin isolation, not AudioWorklet, and neither is currently used in the codebase, so the headers are retained without an active requirement today. Verified substations are still loaded and emitted (7 files, not 6) — no change needed, a prior assumption that they'd been removed did not hold. Added a note that the District 1 musical theme, now Phase 3 scope, is deliberately not a 24th instrument. Corrected the Data Layer table's feature counts and order count, both roughly 3× stale (26,936 → 83,751 total features; 30 orders/55297–55476 → 88 orders/55297–56642) — counted directly from the current `public/lk-*.geojson` files and `data/processed/.processed-orders.json`, not carried over from prior documents.
**Changes from v5.0:** Resolved four of the five open items from the instrument-architecture section: control surfaces confirmed authoring-only by default (with a per-control promotion path); pool-exhaustion policy moved to be decided once in Phase 3 Step 1 rather than per-pool; granularity confirmed held at 23. Interface contract itself remains open but its decision criteria are now expanded in `docs/Implementation_Plan.md`.
**Changes from v4.0:** Removed Max/MSP + RNBO as the production audio path; documented the pivot decision and rationale. Added Audio Instrument Architecture section: 23-behaviour inventory cross-checked against 19 archived M4L patches, three interface-contract candidates with trade-offs, open questions (control-surface shipping, pool-exhaustion behaviour, mapping-curve audit). Rebased "Future Development Work" off the stale May/June/August phase calendar to point at `Project_Plan_v3_5.md` and the new `Implementation_Plan.md`. Noted `docs/phase2-data-layer.md`'s feature-count staleness without altering that document.
**Author:** Robin Pender
**Contact:** robinpender23@gmail.com
**Repository:** https://github.com/Gombassa/hiddeninfrastructures-zurich
**Deployed:** https://hidden-infrastructures-zurich-50944718104.europe-west2.run.app/
