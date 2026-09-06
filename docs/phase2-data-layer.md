# Phase 2 Data Layer — Planning & Iteration

> **Historical snapshot (2026-09) — not maintained.** This is a frozen Phase 2 iteration log. Its feature counts, per-file breakdowns, and the deployed URL below reflect specific points in time during April–July 2026 (as few as 12 GeoShop tile orders in places) and are not kept current — the different count sections in this document don't even agree with each other, each having been written against whatever tile set existed that day. For live figures, see the generated counts table in `docs/Project_Plan_v3_5.md`, `docs/Technical_Architecture_v5.md`, `README.md`, or `CLAUDE.md` (kept current by `scripts/generate-counts.js`, which deliberately excludes this file). For current ProximityEngine radii and behaviour, see `docs/Technical_Architecture_v5.md` and the live code (`src/proximity-engine.js`, `src/instrument-layers.js`), not this document. What remains genuinely useful here: the Decisions Log below and the per-layer sound-design rationale — both are historical record, not live figures, and don't go stale the way a count does.

## Status

**GeoShop tile orders:** 30 total (55297–55476). Extraction script: `scripts/extract-lk-geojson.js`. Manifest: `data/processed/.processed-orders.json` (tracked in git). Automated ingestion: `scripts/import-new-tiles.js`. All tiles processed with deduplication. ✅

**ProximityEngine:** Loads all 7 data files in parallel. Per-layer geomType exclusions applied at parse time. Nearest-point-on-segment distance used for all LineString features. Returns proximity results for all 6 infrastructure layers. ✅

**Audio lifecycle:** Unlock Audio = init only, Start = fresh node graph, Stop = full teardown + _initialized reset. All null-guard races resolved. ✅

**Proximity logging:** Single-line `[PROXIMITY]` tick covers all 6 layers — lat/lng, trams/feeders, water/sewage/elec/telecom/fernwärme nearest distance and triggered count. ✅

**Basemap:** Swisstopo `ch.swisstopo.leichte-basiskarte` — Swiss open data, consistent with project data provenance. ✅

**Deployed:** https://hidden-infrastructures-50944718104.europe-west6.run.app ✅

**Open blocker:** None. All known bugs resolved.

---

## Extracted Files — Feature Summary

Current feature counts reflect all 12 tile orders after deduplication and per-layer exclusion filtering.

### lk-water.geojson — 2,799 features
- 1,482 LineString pipe segments, 610 Point fittings (after 0 exclusions from this layer)
- Dominant pipe types: `LKZ1315-MLU1` = connection pipes, `LKZ1314-MLU1` = distribution pipes
- **Sonification use:** pipe proximity triggers hydraulic pulse; fitting proximity modulates texture intensity
- **ProximityEngine:** 50m for pipes, 25m for fittings

### lk-sewage.geojson — 1,952 features (pipes only after filtering)
- Manhole points excluded — visible on street, sewage pipes beneath them still trigger via nearest-point-on-segment
- Lower accuracy secondary lines (LKZ1118-MLU0) excluded entirely
- **Sonification use:** continuous underground rumble modulated by distance to nearest pipe segment; no discrete trigger events
- **ProximityEngine:** 80m for pipes

### lk-electricity.geojson — 4,676 features (nodes + cables after filtering)
- 816 Point nodes, 2,524 LineString cables retained; area (trasse footprints) excluded
- geomType property confirmed present and correctly named; area features absent from current tile set
- **Sonification use:** high-frequency drone character (1500–1600Hz), distinct from tram layer. Node proximity entry triggers looping drone from pool; cable proximity modulates pool intensity
- **ProximityEngine:** 40m for nodes, 40m for cables

### lk-telecom.geojson — 4,750 features (cables + nodes after filtering)
- 498 Point nodes, 2,580 LineString cables retained; 348 overhead excluded
- Mix of Swisscom (`LKZ161SU…`) and UPC (`LKZ161UU…`) infrastructure
- **Sonification use:** node points as discrete chirp triggers (2kHz→4kHz sweep, 200ms); cable proximity adds continuous high-frequency texture
- **ProximityEngine:** 40m for nodes, 30m for cables

### lk-tram-lk.geojson — 2,474 features (trasse + nodes after filtering)
- 380 nodes, 1,397 trasse retained; 421 overhead + area excluded
- Replaces route-specific VBZ files (`route-tram-feeders.geojson`, `route-tram-powerlines.geojson`) — covers full District 1
- **Known:** some dedupKeys have start == end coordinates (zero-length segments from DXF point collapse) — not a bug
- **Resolved:** feeder trigger bug — trams within 5m of nodes not triggering. Fixed (confirmed by project owner; exception to this document otherwise being a frozen iteration log).

### lk-fernwaerme.geojson — 198 features ✨ sixth layer
- All LineString pipes; concentrated in orders 55301/55302 and surrounding tiles; +4 features from new tile set confirms sparse network
- Discovered in GeoShop data — not in original project plan. Fits the project theme precisely: genuinely hidden, unknown to most users
- **Sonification use:** slow thermal pulse — sine tone 120–180Hz with 0.3Hz tremolo LFO, gain ramping with proximity. Warm and tonal, distinct from sewage (noise-based) and water (800Hz)
- **ProximityEngine:** 60m provisional
- **Sparseness is an asset:** encounters will be rare and surprising

---

## Infrastructure Layers — Current Summary

| Layer | File | Features (post-filter) | Trigger Type | Radius | Crossing/Alongside |
|-------|------|----------------------|--------------|--------|-------------------|
| Tram electrical | lk-tram-lk.geojson | 2,899 (trasse + node) | feeder crackle pool / trasse drone | 50m feeder / 5m drone | — (tram-driven, not walker) |
| Water | lk-water.geojson | 4,763 (pipe + fitting) | hydraulic pulse on entry; drip rate from fitting cluster; crossing knock; alongside knock loop | 50m pipe / 25m fitting | ✅ crossing + alongside |
| Sewage | lk-sewage.geojson | 3,552 (pipe only) | continuous rumble; gurgle below 20m; junction thud; crossing transient; alongside gurgle loop | 80m pipe / 15m junction | ✅ crossing + alongside |
| Electricity | lk-electricity.geojson | 7,223 (node + cable) | 8-slot oscillator pool; density gain; crossing snap; alongside snap loop | 40m node / 40m cable | ✅ crossing + alongside |
| Telecom | lk-telecom.geojson | 8,301 (node + cable) | 4-slot burst pool (LFO-gated); node entry chirp; dwell handshake; crossing click; alongside click loop | 40m node / 30m cable | ✅ crossing + alongside |
| Fernwärme | lk-fernwaerme.geojson | 198 (pipe) | 60Hz sine + tremolo; bearing-panned StereoPanner; crossing burst; alongside burst loop | 30m pipe | ✅ crossing + alongside |

**Total active features: 26,936**

**Shared density reverb:** All 5 continuous-gain layers send to shared convolver (1.8s IR). Wet level driven by active layer count: 2 layers → 0.006, 4 layers → 0.033, 6 layers → 0.070. Slow TC (2.5s) accumulates spatial depth as the listener enters denser infrastructure.

---

## ProximityEngine Integration Plan

All 5 steps complete ✅

### Step 1 — Water (`lk-water.geojson`) ✅
- Pipe LineStrings and fitting Points loaded separately, filtered by geomType
- Nearest point on segment distance check
- Trigger: crossing 50m → hydraulic pulse; continuous gain ramp 50m → 0m

### Step 2 — Sewage (`lk-sewage.geojson`) ✅
- Pipe LineStrings only — manhole and LKZ1118-MLU0 excluded on load
- Continuous rumble gain ramp, no discrete trigger events
- Manhole covers excluded as visible surface feature; pipes beneath still trigger

### Step 3 — Electricity (`lk-electricity.geojson`) ✅
- Node Points and cable LineStrings; area excluded on load
- Node entry → claim drone from pool (1500–1600Hz, looping until exit)
- Cable proximity modulates pool intensity

### Step 4 — Telecom (`lk-telecom.geojson`) ✅
- Node Points and cable LineStrings; overhead excluded on load
- Node entry → chirp event (2kHz→4kHz, 200ms, per-node debounce)
- Node dwell → handshake chirp after 5s (1→8kHz, 8s cooldown per node)
- Cable proximity → 4-slot burst pool (LFO-gated noise, 22/38/54/78Hz per slot); density modulates rate 0.5–2.0×
- Cable crossing → click (3500→6000Hz, 3s cooldown)
- Alongside → click loop ~4s ±45%
- `extendLinesWithMovement` applied to telecom cables ✅ (was missing, fixed)

### Step 5 — Fernwärme (`lk-fernwaerme.geojson`) ✅
- Pipe LineStrings, no exclusions
- `extendLinesWithMovement` applied; `nearestSegmentBearing` returned per pipe
- Radius: 30m (tightened from 60m for dramatic rare encounters)
- Thermal drone: 60Hz sine + 0.3Hz tremolo LFO on carrier gain (multiplicative — prevents bleed)
- StereoPanner: bearing from listener to nearest pipe segment, relative to heading; `sin(relBearing)` pan value, 1s TC
- Fast ramp-in: 0.4s time constant
- Crossing → 60Hz burst (0.5s, gain 0.15) routed through StereoPanner
- Alongside → burst loop ~6s ±40%

---

## Open Questions

- **Audio mix:** relative levels of all 6 layers plus shared density reverb untested in real field conditions — expect iteration after first full-route field test.
- **Fernwärme field validation:** 30m radius and bearing panning not yet validated in the field. Coverage confirmed sparse.
- **Performance under full load:** 26,936 total features, 6 layers. Active set within culling radius estimated ~100–250. Needs field validation.
- **Alongside ALONGSIDE_RADIUS (20m):** currently uniform across all layers — may need per-layer tuning after field test.
- **Density reverb levels:** exponential curve (max 0.07 wet at 6 layers) to be calibrated against real-world multi-layer positions.

---

## Extraction Exclusions — `extract-lk-geojson.js`

All filters applied at extraction time.

| Layer | Exclude geomType | Exclude layer |
|-------|-----------------|---------------|
| Sewage | `manhole` | `LKZ1118-MLU0` |
| Electricity | `area` | — |
| Telecom | `overhead` | — |
| Tram | `overhead` | — |
| Fernwärme | — | — |
| Water | — | `LKZ131B` (internal, low accuracy), misc/unknown |

---

## Decisions Log

| Date | Decision |
|------|----------|
| April 2026 | Switched from Python single-tile extraction to JS multi-tile `extract-lk-geojson.js` with deduplication |
| April 2026 | Water: excluded internal lines (LKZ131B) and misc/unknown features |
| April 2026 | Sewage: manhole points excluded — visible on street, not hidden infrastructure |
| April 2026 | Sewage: LKZ1118-MLU0 (Nebenleitung, lower accuracy) excluded entirely |
| April 2026 | Electricity: trasse area footprints excluded from audio pipeline; node trigger radius set to 40m |
| April 2026 | Electricity: drone frequency range set to 1500–1600Hz — high and abrasive, distinct from tram |
| April 2026 | Telecom: overhead cable features excluded |
| April 2026 | Tram: overhead features excluded; route-specific VBZ files retired in favour of lk-tram-lk.geojson |
| April 2026 | Fernwärme added as sixth infrastructure layer — discovered in GeoShop data, fits project theme |
| April 2026 | Fernwärme sound design: 120–180Hz sine tone, 0.3Hz tremolo LFO — warm/tonal, distinct from sewage (noise) and water (800Hz) |
| April 2026 | All exclusions applied at extraction time in extract-lk-geojson.js |
| April 2026 | ProximityEngine complete rewrite — init() takes config object, loads 7 files in parallel |
| April 2026 | parseTramLk() routes node Points → feeders, trasse LineStrings → powerlines; area and overhead dropped |
| April 2026 | Generic parseLineFeatures() / parsePointFeatures() handle per-layer geomType exclusions at load time |
| April 2026 | proximityLines() uses nearestSegmentDist() — nearest point on segment, not endpoints |
| April 2026 | calculate() returns proximity results for all 6 layers; returns empty arrays when listener position is null |
| April 2026 | route-tram-feeders.geojson and route-tram-powerlines.geojson retired — lk-tram-lk.geojson in use |
| April 2026 | All 5 ProximityEngine integration steps complete ✅ |
| April 2026 | AudioLayers key mismatch fixed — update() reads nested proximity structure (proximity.water.pipes etc.) |
| April 2026 | Drone oscillators and feeder pool moved to Start path — Unlock Audio only resumes AudioContext |
| April 2026 | Fernwärme signal chain: _fernOsc → carrierGain (LFO ±0.4) → _fernMasterGain → destination |
| April 2026 | All 5 new audio layers gate correctly on Stop |
| April 2026 | Hardcoded test at Paradeplatz: powerline 25m, water 17m, sewage 7m, elec node 16m, telecom 10m, fernwärme 79m (outside 60m — correct) |
| April 2026 | Electricity 0 excluded confirmed — area features absent from current tile set, filter working |
| April 2026 | Audio lifecycle: Unlock Audio = init, Start = synthesis, Stop = full teardown + _initialized = false |
| April 2026 | update() null guard: if (!_initialized) return — prevents gain node access after Stop |
| April 2026 | Post-Stop TramEngine tick race resolved via _initialized sentinel |
| April 2026 | Paradeplatz + Stadelhofen test coordinates added as commented-out GPS overrides |
| April 2026 | Basemap: OpenStreetMap → Swisstopo ch.swisstopo.leichte-basiskarte |
| April 2026 | Map pan-to-GPS on first fix; District 1 centre remains default if GPS unavailable |
| April 2026 | Map zoom: 15 → 14 |
| April 2026 | TramEngine stop race fixed — running boolean flag prevents in-flight tick callbacks after Stop |
| April 2026 | 6 additional GeoShop tile orders (55333–55335, 55350–55352) — 12 tiles total. +4,081 net new features. Total 16,849 |
| April 2026 | [PROXIMITY] tick log extended to single line covering all 6 layers with nearest distance and triggered count |
| April 2026 | Feeder trigger bug identified in field — trams 5m from feeder nodes with feedersTriggered: 0. Cause under investigation |
| July 2026 | Feeder trigger bug resolved — fixed (exception noted for this otherwise-frozen log; see lk-tram-lk.geojson section above) |
| April 2026 | Confirmed: manhole covers excluded (visible); sewage pipes beneath trigger via nearest-point-on-segment |
| April 2026 | Deployed to Cloud Run — current build live |
| April 2026 | Tram electrical layer refactored out of index.html into audio-layers.js — all 6 layers now discrete modules with LAYER_ENABLED flags |
| April 2026 | AudioLayers.onListenerMove(lat, lng, heading) added — updates hiss panner positions on GPS fix between 10s tram ticks |
| April 2026 | Hiss pool: each of 6 slots now assigned a distinct comb delay time from HISS_COMB_DELAYS at init — previously all slots used same delay (dead code bug) |
| April 2026 | Map legend removed; replaced with 6 per-layer toggle buttons (TRAM / WATER / SEWAGE / ELECTRICITY / TELECOM / FERNWÄRME) with distinct colours |
| April 2026 | UI layout changed for mobile field testing: map full-width 400px, log panel below (scroll to view), map/log no longer side-by-side |
| April 2026 | GeoShop manifest moved from data/raw/GeoShop/.processed-orders.json (gitignored) to data/processed/.processed-orders.json (tracked in git) |
| April 2026 | scripts/import-new-tiles.js created — scans GeoShop dir, diffs against manifest, runs extractor for new orders, updates manifest; 30 orders now tracked |
| April 2026 | extendLinesWithMovement() added to ProximityEngine — cross-product sign test (segsCross) for line crossing; acute angle check (nearestSegAngleDeg <35°, ≤20m) for alongside; applied to water pipes, sewage pipes, electricity cables at this point |
| April 2026 | Water: proximity-scaled gain on pulse re-trigger (0.04–0.18 by distance, 30s cooldown per pipe/fitting ID) |
| April 2026 | Water: fitting cluster drip rate — count fittings within 15m, drip rate = min(count×0.5, 3Hz), 2800Hz bursts with ±25% jitter |
| April 2026 | Water: pipe crossing one-shot knock (380Hz, 0.4s) + alongside loop (~3.5s ±30% jitter) |
| April 2026 | Hydrant exclusion: LKZ1322-MSU- filtered at parsePointFeatures call for water layer |
| April 2026 | Sewage: rhythmic gurgle below 20m (100Hz, random 1.25–5s interval) |
| April 2026 | Sewage: computeSewageJunctions() — clusters pipe endpoints within 8m at init; junction thud on entry (55Hz, 0.6s, 10s cooldown) |
| April 2026 | Sewage: pipe crossing transient (200Hz, 0.35s) + alongside loop (~4s ±35% jitter) |
| April 2026 | Electricity: oscillator pool expanded 4→8 slots; frequency spread 1490–1510Hz per slot; +3Hz beating per slot pair |
| April 2026 | Electricity: node cluster density gain multiplier — count nodes within 30m, gain 1.0→1.8× at 5+ nodes |
| April 2026 | Electricity: cable crossing snap (2200Hz, 0.08s) + alongside loop (~5s ±40% jitter) |
| April 2026 | Telecom: cable layer upgraded from plain proximityLines to extendLinesWithMovement — crossing/alongside now available (was missing) |
| April 2026 | Telecom: single looping noise replaced with 4-slot burst pool (5000/5600/6200/6800Hz HP); each slot LFO-gated at 22/38/54/78Hz; cable density modulates rate 0.5–2.0× |
| April 2026 | Telecom: node dwell tracking — Map(id→firstSeenMs); handshake chirp (1→8kHz, 0.4s, gain 0.18) after 5s dwell, 8s cooldown per node |
| April 2026 | Telecom: cable crossing click (3500→6000Hz, 0.06s) + alongside loop (~4s ±45% jitter) |
| April 2026 | Fernwärme: radius 30m (from 60m provisional) — tighter for dramatic discovery encounters |
| April 2026 | Fernwärme: nearestSegmentBearing() added to ProximityEngine — bearing from listener to nearest point on nearest pipe segment, returned in pipe proximity result |
| April 2026 | Fernwärme: extendLinesWithMovement applied — crossing/alongside now available |
| April 2026 | Fernwärme: StereoPanner added to signal chain; pan = sin(relBearing) updated each tick with 1s TC |
| April 2026 | Fernwärme: ramp-in TC 2.5s → 0.4s for dramatic entry |
| April 2026 | Fernwärme: crossing burst (60Hz, 0.5s, 3s cooldown) + alongside loop (~6s ±40% jitter); both routed through StereoPanner |
| April 2026 | Shared density reverb bus: 5 continuous-gain outputs (drone, sewage, elecMaster, telecomBurstMaster, fernMaster) send to shared convolver (1.8s IR); wet level = pow((density−1)/5, 1.5)×0.07; kicks in at 2+ active layers |
| April 2026 | All 6 layers' crossing/alongside timers and cooldown maps cleared on stop() and setLayerEnabled(false) |
