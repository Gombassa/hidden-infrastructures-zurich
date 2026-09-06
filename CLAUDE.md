# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hidden Infrastructures: Zürich - A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio. Users walk through District 1 (Altstadt) as their smartphone generates real-time procedural soundscapes driven by six layers of invisible systems.

**District 1 (Postal Code 8001) — Phase 2 complete, Phase 3 next:**
- Original prototype route: Stadelhofen → Paradeplatz, 2,682m (drove tram position interpolation during Phase 0–2; the live user experience is free-roam across District 1, not confined to this route — see `docs/Project_Plan_v3_5.md`)
- Six infrastructure layers: tram electrical, water supply, sewage, electricity grid, telecommunications, Fernwärme (district heating)
- Public launch target: October 2026 (see `docs/Project_Plan_v3_5.md`, "Timeline Reality Check" — slipped from the original September target by decision, not by cutting scope)
- Future expansion: Districts 2-6 (2027-2030)

**Technical approach:**
- Progressive Web App (browser-based, platform-agnostic)
- Web Audio API — direct browser-native synthesis is the production audio path. **Max/MSP → RNBO → WebAssembly AudioWorklet was dropped in July 2026** (see `docs/Technical_Architecture_v5.md`, "Architecture Decision: Dropping Max/MSP + RNBO") — do not reintroduce it without checking that document first. Each sonic behaviour is a self-contained JS instrument module with a paired HTML control surface (authoring-only by default); see `docs/Implementation_Plan.md` for the build plan.
- Web Audio API PannerNode (HRTF mode) for spatial audio
- Real-time + static data from Stadt Zürich open data programs
- Zero personal data collection, GPS processed entirely on-device

## Commands

```bash
# Local development (Vite dev server, port 8080)
npx vite --host
# Open http://localhost:8080

# Docker build and run
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures

# Mobile GPS testing — Cloudflare tunnel (run after Vite or Docker)
npx cloudflared tunnel --url http://localhost:8080

# Route extraction (one-time, output already committed)
node scripts/extract-route-waypoints.js

# Import new GeoShop tile deliveries
node scripts/import-new-tiles.js

```

**Dependencies:** `npm install`

## Architecture

```
index.html         # Main application (root) — GPS + Web Audio API pipeline; runs on src/instrument-layers.js (Step 8, branch step-8-reintegration — not yet merged to main pending a field-walk parity check)
src/
├── tram-engine.js         # Live tram positions from transport.opendata.ch
├── proximity-engine.js    # Tram ↔ infrastructure distance calculations (all 6 layers)
├── instrument-layers.js   # Orchestrates the 17 src/instruments/*.js instances that voice all 24 behaviours — what index.html actually runs on as of Step 8
└── audio-layers.js        # Superseded by instrument-layers.js as of Step 8 — retained untouched as the reference implementation until field-validated (see Implementation_Plan.md Step 8), no longer imported by index.html; ab-compare.html still imports it directly for Path A
instruments/       # Phase 3: standalone HTML instrument control surfaces — see docs/instrument-reference.html
public/
├── lk-tram-lk.geojson       # VBZ tram infrastructure (nodes + trasse)
├── lk-water.geojson          # WVZ water pipes + fittings
├── lk-sewage.geojson         # ERZ sewage pipes
├── lk-electricity.geojson    # ewz electricity nodes + cables
├── lk-telecom.geojson        # ewz telecom nodes + cables
├── lk-fernwaerme.geojson     # District heating pipes
└── data/
    ├── processed/       # substations.geojson, route-waypoints.json
    └── raw/             # route-tram-masts.geojson (archived reference)
data/
├── raw/           # VBZ GeoJSON: feeders, masts, powerlines (source files)
└── processed/     # substations.geojson, route-waypoints.json, maps, lk/ (processed GeoJSON)
scripts/           # One-time data processing (Node.js)
docs/              # Phase planning and specifications
Archive/           # Archived prototypes and analysis scripts
├── webpd-patches/ # WebPd/PureData prototype work
├── simulation/    # ListenerEngine + simulation test pages and scripts
├── prototype-tests/ # Standalone engine test pages
└── pd-patches/    # PureData patches
Dockerfile         # Multi-stage: node:20-alpine build → nginx:alpine serve
nginx.conf         # COEP/COOP headers, SPA fallback
vite.config.js     # Port 8080, COEP/COOP headers, allowedHosts: true
```

## Key Data

**Infrastructure Layers (all 6 complete since Phase 2):**

1. **Tram electrical:** lk-tram-lk.geojson — nodes (feeders) + trasse (powerlines), full District 1. Also contains an `area` geomType category (LKZ150V-MFU) that the extraction rule does not actually exclude, unlike overhead — present in the file but not read by `parseTramLk()`, so unused rather than wrong; see counts table below for current totals. Real-time tram positions from transport.opendata.ch API.
2. **Water supply:** lk-water.geojson — pipe LineStrings + fitting Points (WVZ Leitungskataster)
3. **Sewage:** lk-sewage.geojson — pipes only, manholes excluded (ERZ Abwasser-Werkleitungsdaten)
4. **Electricity grid:** lk-electricity.geojson — nodes + cables, area footprints excluded (ewz Werkleitungsdaten)
5. **Telecommunications:** lk-telecom.geojson — nodes + cables (ewz Telecom / Swisscom / UPC). Also contains an `area` geomType category (LKZ163S-MFU) the extraction rule doesn't exclude, same as tram above — present but unused.
6. **Fernwärme:** lk-fernwaerme.geojson — district heating pipes (SIA405 LKMap via GeoShop)

Current per-file counts (regenerated by `scripts/generate-counts.js` — see standing instruction below; do not hand-edit between the markers):
<!-- COUNTS:BEGIN -->
| File | Total features | By geomType | Size |
|---|---|---|---|
| `lk-sewage.geojson` | 12,413 | pipe: 12,413 | 5.44 MB (5,443,710 B) |
| `lk-electricity.geojson` | 24,622 | cable: 17,642, node: 6,980 | 10.68 MB (10,680,509 B) |
| `lk-water.geojson` | 17,636 | pipe: 12,325, fitting: 5,311 | 6.88 MB (6,877,324 B) |
| `lk-tram-lk.geojson` | 12,201 | trasse: 7,812, node: 2,405, area: 1,984 | 6.02 MB (6,017,184 B) |
| `lk-telecom.geojson` | 28,441 | cable: 21,850, node: 4,348, area: 2,243 | 13.48 MB (13,479,348 B) |
| `lk-fernwaerme.geojson` | 568 | pipe: 568 | 293.2 KB (293,173 B) |

**106 GeoShop orders processed** (55297–56934) · **95,881 total features** across 6 files · **42.79 MB (42,791,248 B)** served.

*Generated by `scripts/generate-counts.js` from `data/processed/.processed-orders.json` and `public/lk-*.geojson` — do not hand-edit the content between the markers above and below.*
<!-- COUNTS:END -->

**Route:**
- 75 waypoints extracted from powerline geometry (A* path-stitching)
- 2,682m total distance: Stadelhofen → Bellevue → Paradeplatz → Rennweg → Bahnhofstrasse/HB

**Data sources:**
- VBZ Infrastruktur OGD
- WVZ Leitungskataster (water)
- ERZ Abwasser-Werkleitungsdaten (sewage)
- ewz Werkleitungsdaten (electricity & telecom)
- transport.opendata.ch API (real-time tram positions)

## Conventions

- GeoJSON coordinates: `[longitude, latitude]`
- Zurich center: ~47.37°N, 8.55°E
- Tram speed assumption: 15 km/h average
- Station queries need URL encoding for "Zürich" characters
- Tram category filter: `'T'`

## Known Limitations

- VBZ does not publish substation locations publicly — tram electrical layer uses lk-tram-lk.geojson nodes as feeder proxies
- Feeder (tram node) attributes are minimal: `layer`, `infraType`, `geomType`, `source`, `_dedupKey`, `accuracyClass` — no `objectid`, no substation_id, no connectivity metadata. (`objectid`/`einbaudatu` described the retired `route-tram-feeders.geojson`; `lk-tram-lk.geojson` doesn't carry either.) `_dedupKey` is a coordinate hash assigned once at extraction (`scripts/extract-lk-geojson.js`) and is the only stable per-feeder identifier — ProximityEngine's own feeder `id` is an array index, not stable across re-extraction
- Infrastructure geodata is static snapshots — only tram positions update in real-time
- Water/sewage/electricity/telecom/Fernwärme layers use static infrastructure positions — no real-time flow/usage data available
- Fernwärme coverage is sparse in District 1 — 30m radius means encounters will be infrequent (intentional — rare discovery moments)
- `src/instrument-layers.js` orchestrates the real `src/instruments/*.js` classes (all 24 behaviours, built across Steps 1–7) and is what `index.html` runs on as of Step 8 (branch `step-8-reintegration`). `audio-layers.js` is superseded but not deleted — it's retained untouched as the reference implementation until a field walk confirms no regression against it (`docs/Implementation_Plan.md` Step 8's explicit gate), and `ab-compare.html` still imports it directly. Not a placeholder awaiting a Max/MSP + RNBO patch set; that path is dropped
- Tram markers not rendering on map — known cosmetic issue, deprioritised
- ALONGSIDE_RADIUS (20m) and ALONGSIDE_ANGLE (35°) are uniform across all layers — may need per-layer tuning after field testing

## Audio Layers (Phase 2 complete)

**Infrastructure Layers (procedurally generated):**
1. **Tram electrical** — Feeder crackle (HRTF spatial), comb-filtered hiss pool (6 slots, distinct delay times), powerline drone (dual-LFO, reverb)
2. **Water supply** — Proximity-scaled pulse on entry; fitting cluster drip; pipe crossing knock; alongside loop
3. **Sewage** — Deep bass rumble (distance-modulated); rhythmic gurgle below 20m; junction thud; pipe crossing; alongside loop
4. **Electricity grid** — 8-slot sawtooth pool (1490–1510Hz spread + beating); node cluster density gain; cable crossing snap; alongside loop
5. **Telecommunications** — 4-slot LFO-gated burst pool (density-modulated rate); node chirp + dwell handshake; cable crossing click; alongside loop
6. **Fernwärme** — 60Hz sine + tremolo; bearing-panned StereoPanner; 30m radius; crossing burst; alongside loop

**Shared density reverb:** 5 layers feed a shared convolver whose wet level scales with active layer count (`pow((density-1)/5, 1.5) * 0.07`, ≈0.006–0.07 — corrected from a previously-stated 0.007). Dense infrastructure zones feel spatially richer.

**District Musical Theme:** Phase 3 scope — a distinct workstream, not one of the 24 instruments (was 23; see `docs/Implementation_Plan.md` v1.2, Step 9). Not yet built.

**Future Expansion (Districts 2-6):** Each district receives unique musical theme. Same 6 infrastructure layers with district-specific sonic character.

## Engine Modules (src/)

Both are ES modules with no DOM dependencies. Serve from project root via `npx vite --host`.

### TramEngine (`src/tram-engine.js`)
Singleton, default export. Fetches live tram departures from `transport.opendata.ch`, interpolates positions between stop pairs every 10 seconds.

```javascript
import TramEngine from './src/tram-engine.js';
TramEngine.start();                        // begin 10s update loop
TramEngine.stop();                         // halt loop
TramEngine.getState();                     // → { trams: [{line, lat, lng, fromStop, toStop, progress, delay}], lastUpdated: Date, isStale: bool }
TramEngine.onUpdate(cb);                   // cb(state) on each refresh
TramEngine.getDistanceToPoint(lat, lng);   // → [{tram, distance}] sorted nearest-first
TramEngine.setUpdateInterval(ms);          // change refresh rate
```

### ProximityEngine (`src/proximity-engine.js`)
Singleton, default export. Loads all 7 GeoJSON files in parallel, computes proximity results for all 6 infrastructure layers.

```javascript
import ProximityEngine from './src/proximity-engine.js';
await ProximityEngine.init();   // loads substations + 6 lk-*.geojson files from public/
ProximityEngine.calculate(tramState, listenerLat, listenerLng, heading, speed);
// → {
//     substations: [{id, lat, lng, tramCount, nearestTramDist}],
//     feeders:     [{id, lat, lng, triggered, triggeringTram}],
//     nearestPowerlineDist,          // metres to nearest tram trasse segment
//     water:       { pipes:    [{id, midLat, midLng, dist, triggered, crossing, alongside}],
//                    fittings: [{id, lat, lng, dist, triggered}] },
//     sewage:      { pipes:     [{...crossing, alongside}],
//                    junctions: [{id, lat, lng, dist, triggered}] },
//     electricity: { nodes:  [{id, lat, lng, dist, triggered}],
//                    cables: [{...crossing, alongside}] },
//     telecom:     { nodes:  [{id, lat, lng, dist, triggered}],
//                    cables: [{...crossing, alongside}] },
//     fernwaerme:  { pipes: [{...crossing, alongside, bearing}] },  // bearing = 0–360° from N
//   }
// Layer arrays are empty when listenerLat/Lng is null.
```

- Substation radius: 150m (tramCount = trams within this range)
- Feeder trigger radius: 50m (tram-only) — listener proximity also required in foot mode
- Drone fade: 20m→5m linear from nearest tram trasse segment
- Water: 50m pipe / 25m fitting (nearest point on segment)
- Sewage: 80m pipe (nearest point on segment)
- Electricity: 40m nodes / 40m cables
- Telecom: 40m nodes / 30m cables
- Fernwärme: 30m pipes

### InstrumentLayers (`src/instrument-layers.js`) — what `index.html` runs on as of Step 8
Default export. Orchestrates the 17 `src/instruments/*.js` instances that voice all 24 behaviours across 6 layers (Steps 1–7). Same public shape as the superseded `AudioLayers` module below, so the lifecycle and call pattern are identical:

```javascript
import InstrumentLayers from './src/instrument-layers.js';
InstrumentLayers.init(audioContext);                                    // call on Start — builds shared reverb bus first, then all 17 instances
InstrumentLayers.update(proximity, listenerLat, listenerLng, heading);  // call each TramEngine tick
InstrumentLayers.onListenerMove(lat, lng, heading);                     // call on GPS fix — updates hiss panner positions between tram ticks
InstrumentLayers.stop();                                                // destroy()s all instances, tears down reverb bus
InstrumentLayers.LAYER_ENABLED                                          // { tram, water, sewage, electricity, telecom, fernwaerme }
```

Two behaviours are deliberate redesigns, not parity ports — see `docs/Implementation_Plan.md` Steps 4/5: tram hiss is a persistent per-feeder-identity pool (`tram-hiss-pool.js`), not production's stateless nearest-N reassignment; sewage's gurgle/alongside retunes its burst to a circle-of-fifths note (`sewage-gurgle.js`) instead of production's fixed 100Hz. Everything else below is strict parity — the per-layer synthesis descriptions still hold, they're just voiced by the new classes now, not `audio-layers.js`'s inline functions.

### AudioLayers (`src/audio-layers.js`) — superseded, retained as reference
Singleton, default export. The original Web Audio API synthesis for all 6 layers — `index.html` no longer imports this as of Step 8 (`InstrumentLayers` above replaced it), but the file is untouched and stays in the repo as the field-tested reference implementation until a field walk confirms `InstrumentLayers` has no regression (`docs/Implementation_Plan.md` Step 8's explicit gate — this is why it isn't deleted). `ab-compare.html` still imports it directly for its Path A comparison. Same lifecycle shape as `InstrumentLayers` (`init`/`update`/`onListenerMove`/`stop`/`LAYER_ENABLED`) — the values below describe production's design and are the parity target `src/instruments/*.js` was built against.

**Per-layer synthesis:**
- **Tram electrical:** feeder crackle (6-burst noise, HRTF spatial, debounced per feeder ID), comb-filtered hiss pool (6 nodes, distinct delay times 2.3–8.9ms), drone (110/112Hz dual-LFO ±8Hz, powerline proximity 20m→5m), private convolver reverb + shared density reverb send
- **Water:** proximity-scaled bandpass pulse on entry (pipe 800Hz / fitting 1200Hz, 30s cooldown, gain 0.04–0.18 by distance); fitting cluster drip rate (2800Hz, ±25% jitter, up to 3Hz); pipe crossing knock (380Hz); alongside knock loop (~3.5s ±30%)
- **Sewage:** looped lowpass rumble (gain by distance, 80m); rhythmic gurgle below 20m (100Hz, random 1.25–5s); junction thud on entry (55Hz, 10s cooldown); pipe crossing transient (200Hz); alongside loop (~4s ±35%); shared density reverb send
- **Electricity:** 8-slot sawtooth pool (1490–1510Hz spread, +3Hz beating per slot, LFO amplitude modulation); node cluster density gain multiplier (1.0–1.8× at 5+ nodes within 30m); cable crossing snap (2200Hz); alongside loop (~5s ±40%); shared density reverb send
- **Telecom:** 4-slot LFO-gated burst pool (5000–6800Hz HP, 22/38/54/78Hz gate rates); cable density modulates rate 0.5–2.0×; node-entry chirp (2→4kHz, debounced); node dwell handshake after 5s (1→8kHz, 8s cooldown); cable crossing click (3500→6000Hz); alongside loop (~4s ±45%); shared density reverb send
- **Fernwärme:** 60Hz sine + tremolo LFO (0.3Hz, ±0.4 carrier gain — multiplicative, prevents bleed); StereoPanner driven by `nearestSegmentBearing` relative to heading; 30m radius, 0.4s ramp-in; crossing burst (60Hz, 0.5s) through panner; alongside loop (~6s ±40%); shared density reverb send

**Shared density reverb (`_initSharedReverb`):**
- 5 continuous-gain nodes (drone, sewage, elecMaster, telecomBurstMaster, fernMaster) all connect to `_sharedReverbBus` → ConvolverNode (1.8s IR) → `_sharedReverbOut` → destination
- `_sharedReverbOut.gain` = `pow((density−1)/5, 1.5) × 0.07`, computed each tick from active layer count (0–6); kicks in at 2+ overlapping layers; slow TC 2.5s

**Line-crossing / alongside detection (`extendLinesWithMovement`):**
- Applied to all 5 LineString layers (water pipes, sewage pipes, electricity cables, telecom cables, fernwärme pipes)
- `crossing`: cross-product sign test on listener movement vector vs each segment (`segsCross`)
- `alongside`: acute angle between movement vector and nearest segment < 35°, within 20m (`nearestSegAngleDeg`)
- All extended computations happen BEFORE `_prevCalcLat/Lng` is updated each tick
- `MIN_MOVE_METRES = 0.5` — prevents spurious events on GPS jitter

**Note on `_sharedReverbBus` init order:** `_initSharedReverb()` must be called first in `init()` — all layer inits reference `_sharedReverbBus` when connecting their send.

### GPS Listener (inline in `index.html`)
Note: `index.html` contains **no audio synthesis code**. All synthesis (including tram electrical) lives in the `src/instruments/*.js` classes, orchestrated by `instrument-layers.js` as of Step 8. GPS fix calls `InstrumentLayers.onListenerMove(lat, lng, heading)` to update hiss panner positions between tram ticks.
Live GPS via `navigator.geolocation.watchPosition()`. No separate module.

- Updates `realLat` / `realLng` / `realSpeed` on every fix
- `realHeading` updated via `deviceorientation` event (`event.alpha`, 0–360°)
- Moves listener marker on Leaflet map
- Follows position at zoom 19 while `following = true` (Start → Stop)
- Logs each fix to on-screen log panel via `appendLog`

## RNBO Integration — DEPRECATED (July 2026)

**This section is historical. Do not follow it.** Max/MSP → RNBO → WASM/AudioWorklet was dropped as the production audio path in July 2026. See `docs/Technical_Architecture_v5.md` ("Architecture Decision: Dropping Max/MSP + RNBO") for why, and `docs/Implementation_Plan.md` for what replaced it — self-contained Web Audio instrument modules authored directly in JavaScript, with paired HTML control surfaces. The Max/MSP + RNBO licence budget line was removed entirely, not deferred (`docs/Project_Plan_v3_5.md`). The 19 Max for Live patches that existed before this pivot are archived at `docs/archive/max/` and `max/` (all headed "superseded, retained as sonic specification").

The workflow that used to be described here (design in Max/MSP with RNBO objects → export Web target → `createDevice` from RNBO JS API → connect to `pannerNode` → control via `device.parametersById`) is not in use and should not be reintroduced without re-reading the architecture decision above first — it was dropped for stated reasons (cost, and single-runtime authoring/deployment), not lost or forgotten.

**Current state:**

- Web Audio API direct synthesis is the confirmed production path — not a placeholder, not pending a native-audio toolchain
- All tram audio (crackle, hiss pool, drone, reverb) lives in the `src/instruments/*.js` classes as of Step 8, orchestrated by `src/instrument-layers.js` and that's what's live in `index.html`, which contains no synthesis code itself. `audio-layers.js` is superseded but retained as the reference implementation pending field validation (see the "InstrumentLayers"/"AudioLayers" entries in Engine Modules, above)
- Cloud Run service URL: https://hidden-infrastructures-zurich-50944718104.europe-west2.run.app/ — **production traffic not yet switched to Step 8's change**: this work is on the `step-8-reintegration` branch, not `main`, until a field walk confirms no regression. A separate `step8`-tagged, `--no-traffic` test revision of the same branch is deployed at https://step8---hidden-infrastructures-zurich-ja3ewkhlza-nw.a.run.app/ for exactly that field walk (0% of production traffic, safe to test against)

---

## Current State (July 2026)

Phase 2 complete on `main` branch, deployed to Cloud Run. Phase 3 (instrument architecture rebuild, replacing `audio-layers.js` — see `docs/Implementation_Plan.md`) has completed all per-layer build steps and reintegration: interface contract resolved (Option A, Step 1); electricity, water, tram, sewage, telecom, and Fernwärme (Steps 2–7) fully rebuilt as `src/instruments/*.js` classes, all 24 behaviours built; `index.html` reintegrated onto them via `src/instrument-layers.js` (Step 8). **This reintegration is on the `step-8-reintegration` branch, not yet merged to `main` or serving production traffic** — Step 8's own "Done means" requires a field walk confirming no regression against `audio-layers.js`'s field-tested baseline before merging. One round of that field walk has happened (2026-09): the electricity layer read as too loud overall, trimmed -9dB at its master gain stage (`src/instruments/electricity-oscillator-pool.js`, `FIELD_TRIM_DB`); the fix is redeployed to a `--no-traffic`, `step8`-tagged Cloud Run test revision for further walk-throughs. Merge to `main` remains gated on that validation continuing to come back clean. The list below still describes the per-layer sound design as built (values, not implementation) — accurate for both `audio-layers.js` (still live on `main`/Cloud Run today) and `src/instruments/*.js` (parity ports, with two flagged redesigns — see the "InstrumentLayers" entry in Engine Modules, above).

All 6 audio layers implemented with event-driven synthesis:
- Feeder hiss (6-node comb-filter pool, HRTF spatial) ✅
- Feeder crackle (debounced per feeder ID, speed-mode detection) ✅
- Drone (powerline proximity 20m→5m, dual-LFO, reverb) ✅
- Water (proximity-scaled pulse, fitting drip, crossing knock, alongside loop) ✅
- Sewage (rumble, gurgle, junction thud, crossing, alongside) ✅
- Electricity (8-slot pool, density gain, crossing snap, alongside) ✅
- Telecom (burst pool, dwell handshake, crossing click, alongside) ✅
- Fernwärme (bearing panner, 30m radius, crossing, alongside) ✅
- Shared density reverb (0–6 layers → 0–0.07 wet) ✅
- Line-crossing/alongside detection on all 5 LineString layers ✅
- Tram markers not rendering on map — known cosmetic issue, deprioritised

<!-- COUNTS:BEGIN -->
| File | Total features | By geomType | Size |
|---|---|---|---|
| `lk-sewage.geojson` | 12,413 | pipe: 12,413 | 5.44 MB (5,443,710 B) |
| `lk-electricity.geojson` | 24,622 | cable: 17,642, node: 6,980 | 10.68 MB (10,680,509 B) |
| `lk-water.geojson` | 17,636 | pipe: 12,325, fitting: 5,311 | 6.88 MB (6,877,324 B) |
| `lk-tram-lk.geojson` | 12,201 | trasse: 7,812, node: 2,405, area: 1,984 | 6.02 MB (6,017,184 B) |
| `lk-telecom.geojson` | 28,441 | cable: 21,850, node: 4,348, area: 2,243 | 13.48 MB (13,479,348 B) |
| `lk-fernwaerme.geojson` | 568 | pipe: 568 | 293.2 KB (293,173 B) |

**106 GeoShop orders processed** (55297–56934) · **95,881 total features** across 6 files · **42.79 MB (42,791,248 B)** served.

*Generated by `scripts/generate-counts.js` from `data/processed/.processed-orders.json` and `public/lk-*.geojson` — do not hand-edit the content between the markers above and below.*
<!-- COUNTS:END -->

**Standing instruction — counts are generated, not hand-maintained.**

`scripts/generate-counts.js` reads `data/processed/.processed-orders.json` and every `public/lk-*.geojson`, and rewrites the content between every matching pair of COUNTS marker comments it finds across the target docs (see `TARGET_DOCS` in that script — currently this file, `README.md`, `docs/Technical_Architecture_v5.md`, `docs/Project_Plan_v3_5.md`). It runs automatically at the end of both `scripts/import-new-tiles.js` and `scripts/extract-lk-geojson.js`, so counts regenerate whenever the data changes — there is no manual step left for anything inside a marker pair. It also prints a warning (does not fix) if a geomType that documentation says should be excluded from a file is nonetheless present — see `DOCUMENTED_EXCLUSIONS` in that script.

Two things this script cannot reach, and still need a human:

- **Un-marked mentions.** `docs/Project_Plan_v3_5.md`'s Technical Stack → Data Sources (order count) and Critical Path → Phase 2 (order count/range) state figures inline in prose rather than in a marker block — correct these by hand when they drift; wrapping them individually wasn't done here because a fragment of a sentence isn't a natural home for a whole counts table.
- **Derived claims.** Any prose that computes something *from* these totals (a culling ratio, a "reduces from X to Y" claim) is not regenerated by this script even where it's marker-adjacent, because the script only knows the file counts, not what a document does with them. Re-check those by hand too.

Do **not** add `docs/phase2-data-layer.md` to `TARGET_DOCS` — it's an intentionally frozen iteration log, not a live figure; its staleness is flagged elsewhere rather than corrected.

**Standing instruction — version history goes in `docs/CHANGELOG.md`, not the document header.**

`docs/Project_Plan_v3_5.md` and `docs/Technical_Architecture_v5.md` each carry only their *current* version's "Changes from vX.Y" note near the top of the document, followed by a one-line pointer to `docs/CHANGELOG.md`. Every prior version's entry lives in `docs/CHANGELOG.md` instead (one section per document, newest-first, one subsection per version) — moved there verbatim, meta-commentary included, when this convention was introduced (2026-09). When either document's version bumps again: add the new entry to `docs/CHANGELOG.md` at the top of that document's section, and replace the header's "Changes from..." note with the new one (the old one moves to the changelog, it doesn't accumulate in the header). Footers keep only `Document Version` / `Last Updated` (plus, for Technical Architecture, `Author`/`Contact`/`Repository`/`Deployed`) — no changelog content there.

Audio lifecycle:
- Unlock Audio: ProximityEngine.init() + AudioContext.resume() only — no synthesis nodes
- Start: InstrumentLayers.init(ctx) — creates all nodes incl. shared reverb bus first; TramEngine.start()
- Stop: InstrumentLayers.stop() — full teardown of all layers + timers + cooldown maps; TramEngine.stop()

## Architecture decisions (confirmed)

- WebPd and Three.js dropped entirely
- RNBO/Max MSP **dropped entirely** (July 2026, not merely deferred) — Web Audio API instruments authored directly in JavaScript are the production path; see `docs/Technical_Architecture_v5.md`
- ListenerEngine simulation stripped out; live GPS via `watchPosition()` only
- pole-ping sound layer dropped
- district-theme: was deferred through Phase 1–2, now Phase 3 scope (see Key Data → District Musical Theme, and `docs/Project_Plan_v3_5.md`) — not deferred anymore
- Two-stage Docker build implemented (node:20-alpine → nginx:alpine)
- GeoJSON data files served via `public/` directory
- Cloudflare Tunnel used for HTTPS on Android Chrome during field testing

## Repo structure

`Archive/` directory holds deprecated WebPd/PureData patches, simulation engine, and prototype tests.
`public/` directory serves GeoJSON data to Vite build output.
`STARTUP.md` documents the two-terminal launch sequence.

## Key learnings from field testing

- GPS accuracy in urban environments settles to <1m with patience but starts at 20-30m — proximity radii need to tolerate this startup drift
- TramEngine API URL required full Zürich prefix with encodeURIComponent on the complete station name
- ProximityEngine.calculate() must receive realLat/realLng explicitly — null defaults bypass the listener gate entirely and return empty arrays for all new layers
- InstrumentLayers.update() (formerly AudioLayers.update()) key shape must match ProximityEngine.calculate() return shape — nested (proximity.water.pipes) not flat (proximity.waterPipes)
- InstrumentLayers lifecycle: init() on Start (not on Unlock Audio), full teardown in stop() with _initialized sentinel to guard against in-flight TramEngine ticks after Stop — same lifecycle AudioLayers used, carried forward deliberately in Step 8's reintegration
- Fernwärme tremolo: LFO must modulate a carrier gain (multiplicative), not the master gain (additive) — additive LFO bleeds through when master=0, producing sound before Start and after Stop
- Hiss pool comb delay times must be assigned per-slot at init — assigning them only at max buffer creation makes all slots sound identical
- onListenerMove() must be called on GPS fix to update hiss panner positions between 10s tram ticks — without it, panning freezes at last tram-tick heading
- extendLinesWithMovement() calls must all happen BEFORE `_prevCalcLat = listenerLat` update — otherwise crossing detection uses the wrong prev position
- _initSharedReverb() must be called first in init() — all 5 layer inits reference _sharedReverbBus when connecting their send; null reference if order is wrong
- Telecom cables were initially wired through plain proximityLines (no crossing/alongside); fixed by switching to extendLinesWithMovement — verify all LineString layers use the extended path
- GeoShop manifest must live in a tracked directory (data/processed/) not gitignored raw/ — otherwise import-new-tiles.js changes are lost on clone
- StereoPanner vs PannerNode HRTF for bass: Fernwärme uses StereoPanner (not HRTF PannerNode) because HRTF provides poor directional cues below ~200Hz — a 60Hz fundamental won't localise meaningfully with head-related transfer functions. StereoPanner gives usable left/right separation at bass frequencies. Apply this whenever adding spatial positioning to sub-200Hz sources

## Next Steps (as of July 2026)

See `docs/Project_Plan_v3_5.md` (phase calendar, Timeline Reality Check) and `docs/Implementation_Plan.md` (instrument build order) for the current plan. In brief:

- Phase 3: interface contract resolved (Option A, ratified Step 1), both pool-paradigm checkpoints closed (Steps 4, 6); electricity, water, tram, sewage, telecom, and Fernwärme (Steps 2–7) fully rebuilt as real instrument classes — all 24 behaviours built (see `docs/instrument-reference.html`). Of the crossing/alongside consolidation's original 8 candidate rows, only electricity's and water's actually share `LineCrossingVoice` end-to-end — sewage's alongside (different sound) and telecom's crossing+alongside (different synthesis topology) each needed their own class, for unrelated reasons; see `docs/Implementation_Plan.md` Decision Point 4 for the full record. **Step 8 (reintegration) is done but not yet merged**: `index.html` runs on `src/instrument-layers.js` on the `step-8-reintegration` branch — `audio-layers.js` stays as the reference implementation until a field walk confirms no regression and this branch merges to `main`. One field-walk round is done (electricity trimmed -9dB, redeployed to a `--no-traffic` Cloud Run test revision tagged `step8`); further walk-throughs against that same test URL, and Step 9 (district theme, no dependency on Steps 1–8), are what's left
- Field test the rebuilt layers + shared density reverb on the full Stadelhofen → Paradeplatz route (supersedes the old "field test Phase 2" item — Phase 2's implementation is what's being replaced)
- Calibrate alongside/crossing sensitivity and density reverb wet levels from real-world positions
- Fix tram markers not rendering on map (deprioritised cosmetic)
- District musical theme — deferred, unchanged
- Phase 4: PWA (Service Worker, manifest, offline caching), user testing, documentation, public launch — expected October 2026
