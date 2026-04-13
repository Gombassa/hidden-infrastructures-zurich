# Phase 2 Data Layer — Planning & Iteration

## Status

**GeoShop tile orders:** 12 total (55297–55302 + 55333–55335, 55350–55352). Extraction script: `scripts/extract-lk-geojson.js`. All tiles processed with deduplication across the full set. ✅

**ProximityEngine:** Loads all 7 data files in parallel. Per-layer geomType exclusions applied at parse time. Nearest-point-on-segment distance used for all LineString features. Returns proximity results for all 6 infrastructure layers. ✅

**Audio lifecycle:** Unlock Audio = init only, Start = fresh node graph, Stop = full teardown + _initialized reset. All null-guard races resolved. ✅

**Proximity logging:** Single-line `[PROXIMITY]` tick covers all 6 layers — lat/lng, trams/feeders, water/sewage/elec/telecom/fernwärme nearest distance and triggered count. ✅

**Basemap:** Swisstopo `ch.swisstopo.leichte-basiskarte` — Swiss open data, consistent with project data provenance. ✅

**Deployed:** https://hidden-infrastructures-50944718104.europe-west6.run.app ✅

**Open blocker:** Feeder trigger bug — trams as close as 5m to feeder nodes with feedersTriggered: 0. Under investigation.

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
- **Open:** feeder trigger bug — trams within 5m of nodes not triggering. Under investigation.

### lk-fernwaerme.geojson — 198 features ✨ sixth layer
- All LineString pipes; concentrated in orders 55301/55302 and surrounding tiles; +4 features from new tile set confirms sparse network
- Discovered in GeoShop data — not in original project plan. Fits the project theme precisely: genuinely hidden, unknown to most users
- **Sonification use:** slow thermal pulse — sine tone 120–180Hz with 0.3Hz tremolo LFO, gain ramping with proximity. Warm and tonal, distinct from sewage (noise-based) and water (800Hz)
- **ProximityEngine:** 60m provisional
- **Sparseness is an asset:** encounters will be rare and surprising

---

## Infrastructure Layers — Current Summary

| Layer | File | Features (post-filter) | Trigger Type | Radius |
|-------|------|----------------------|--------------|--------|
| Tram electrical | lk-tram-lk.geojson | 2,474 (trasse + node) | feeder crackle pool / trasse drone | existing |
| Water | lk-water.geojson | 2,799 (pipe + fitting) | hydraulic pulse on proximity | 50m pipe / 25m fitting |
| Sewage | lk-sewage.geojson | 1,952 (pipe only) | continuous rumble modulation | 80m |
| Electricity | lk-electricity.geojson | 4,676 (node + cable) | looping drone pool on node entry (1500–1600Hz) | 40m |
| Telecom | lk-telecom.geojson | 4,750 (node + cable) | chirp trigger on node entry | 40m node / 30m cable |
| Fernwärme | lk-fernwaerme.geojson | 198 (pipe) | thermal pulse, 120–180Hz tonal | 60m provisional |

**Total active features: 16,849**

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
- Node entry → chirp event (2kHz→4kHz, 200ms)
- Cable proximity → continuous high-frequency texture

### Step 5 — Fernwärme (`lk-fernwaerme.geojson`) ✅
- Pipe LineStrings, no exclusions
- Nearest point on segment, 60m radius
- Thermal pulse: 120–180Hz sine + 0.3Hz tremolo LFO
- Sound design direction confirmed; field validation pending

---

## Open Questions

- **Feeder trigger bug:** resolved. ✅ Root cause was listenerNear gate requiring listener within 50m of the triggered feeder node. Fixed by removing gate; exponential gain falloff (150m radius, (1-t)²) now handles perceived distance.
- **Audio mix:** relative levels of all 6 layers untested in real field conditions — expect iteration after first successful field test.
- **Fernwärme field validation:** 60m radius and sound design not yet validated in the field. Coverage confirmed sparse (+4 features across 6 new tiles).
- **Performance under full load:** 16,849 total features, 6 layers. Active set within 200m culling radius estimated ~100–250. Needs field validation.

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
| April 2026 | Confirmed: manhole covers excluded (visible); sewage pipes beneath trigger via nearest-point-on-segment |
| April 2026 | Deployed to Cloud Run — current build live |
