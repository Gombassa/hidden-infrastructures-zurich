# Phase 2 Data Layer — Planning & Iteration

## Status

All six GeoShop tile orders (55297–55302) processed. Six GeoJSON files live in `public/`, deduplicated across tiles. Extraction script: `scripts/extract-lk-geojson.js`.

---

## Extracted Files — Feature Summary

### lk-water.geojson — 1,794 features
- 1,274 LineString pipe segments, 520 Point fittings
- Dominant pipe types: `LKZ1315-MLU1` (620) = connection pipes, `LKZ1314-MLU1` (344) = distribution pipes
- geomType split: `pipe` / `fitting`
- **Sonification use:** proximity-to-pipe triggers hydraulic pulse; fitting density modulates texture intensity
- **ProximityEngine:** 50m for pipes, 25m for fittings

### lk-sewage.geojson — 6,289 features (pipes only after filtering)
- 3,266 LineString pipes — manhole points excluded from sonification (visible on street, not hidden infrastructure)
- Dominated by `LKZ1118-MLU0` (2,047 = Nebenleitung, lower accuracy secondary lines)
- **Sonification use:** pipe proximity only — continuous underground rumble modulated by distance to nearest pipe segment
- **ProximityEngine:** 80m for pipes; no point triggers
- **Filtering:** exclude all `manhole` geomType features from ProximityEngine load

### lk-electricity.geojson — 5,536 features (nodes + cables after filtering)
- 736 Point nodes, 2,233 LineString cables retained; 2,567 area (trasse footprints) excluded
- **Sonification use:** high-frequency drone character, distinct from tram layer. Node points trigger looping drone events on proximity entry — drawn from a pool (same pattern as feeder crackle pool). Cable lines modulate drone density/intensity by proximity.
- **ProximityEngine:** 40m for nodes, 40m for cables
- **Filtering:** exclude all `area` geomType features from ProximityEngine load

### lk-telecom.geojson — 2,850 features (cables + nodes after filtering)
- 2,136 LineString cables, 411 Point nodes, 298 area retained; 5 overhead excluded
- Mix of Swisscom (`LKZ161SU…`) and UPC (`LKZ161UU…`) infrastructure
- **Sonification use:** node points as discrete chirp triggers; cable lines for continuous fiber texture
- **ProximityEngine:** 40m for nodes, 30m for cables
- **Filtering:** exclude all `overhead` geomType features

### lk-tram-lk.geojson — 2,677 features (trasse + nodes after filtering)
- `trasse` (1,344), `area` (403), `node` (355) retained; `overhead` (575) excluded
- **Replaces** `route-tram-feeders.geojson` and `route-tram-powerlines.geojson` — route-specific VBZ files retired for Phase 2+. `lk-tram-lk` covers full District 1.
- **Filtering:** exclude all `overhead` geomType features
- **Known:** some dedupKeys have start == end coordinates (zero-length segments from DXF point collapse) — not a bug, safe to leave

### lk-fernwaerme.geojson — 171 features ✨ new layer
- All LineString pipes; 3 layer variants of `LKZ141EU…`, concentrated in orders 55301/55302
- Sparse coverage — district heating network is limited in this area
- **Added as a sixth infrastructure layer.** Fits the project theme precisely: genuinely hidden, unknown to most users, discovered through the data rather than prior knowledge.
- **Sonification use:** TBD in sound design phase. Sparseness is an asset — encounters will be rarer and more surprising.
- **ProximityEngine:** 60m provisional

---

## Infrastructure Layers — Revised Summary

| Layer | File | Active Features | Trigger Type | Radius |
|-------|------|----------------|--------------|--------|
| Tram electrical | lk-tram-lk.geojson | trasse + node (excl. overhead) | existing feeder/drone logic | existing |
| Water | lk-water.geojson | pipe + fitting | hydraulic pulse on proximity | 50m pipe / 25m fitting |
| Sewage | lk-sewage.geojson | pipe only (excl. manhole) | continuous rumble modulation | 80m |
| Electricity | lk-electricity.geojson | node + cable (excl. area) | looping drone pool on node entry | 40m |
| Telecom | lk-telecom.geojson | node + cable (excl. overhead) | chirp trigger on node entry | 40m node / 30m cable |
| Fernwärme | lk-fernwaerme.geojson | pipe | TBD | 60m provisional |

---

## ProximityEngine Integration Plan

### Step 1 — Water (`lk-water.geojson`)
- Load pipe LineStrings and fitting Points separately, filter by geomType
- Proximity check: nearest point on each pipe segment to listener (not just endpoint)
- Trigger: crossing 50m threshold → hydraulic pulse event
- Modulation: continuous gain ramp 50m → 0m

### Step 2 — Sewage (`lk-sewage.geojson`)
- Load pipe LineStrings only — filter out manhole geomType on load
- Proximity check: nearest point on pipe segment to listener
- Modulation: continuous rumble gain ramp, no discrete trigger events

### Step 3 — Electricity (`lk-electricity.geojson`)
- Load node Points and cable LineStrings — filter out area geomType on load
- Node proximity: entering 40m → claim a drone from pool, loop until exit
- Cable proximity: modulate drone pool intensity by nearest cable distance
- Pool pattern mirrors feeder crackle pool from tram layer

### Step 4 — Telecom (`lk-telecom.geojson`)
- Load node Points and cable LineStrings — filter out overhead geomType on load
- Node proximity: entering 40m → chirp trigger event
- Cable proximity: continuous texture modulation

### Step 5 — Fernwärme (`lk-fernwaerme.geojson`)
- Load pipe LineStrings
- Proximity check: nearest point on pipe segment to listener
- Radius: 60m
- Trigger and modulation behaviour TBD in sound design phase
- Sparseness noted: encounters will be infrequent — treat as a discovery moment

---

## Open Questions

- **Performance:** 6 layers. Estimated active features within 200m culling radius at any District 1 point: ~80–200. Needs field validation once all layers are wired.

---

## Extraction Exclusions — `extract-lk-geojson.js`

Filters applied at extraction time so excluded features never enter the GeoJSON output. After implementation, re-run script and record revised feature counts.

| Layer | Exclude geomType | Exclude layer |
|-------|-----------------|---------------|
| Sewage | `manhole` | `LKZ1118-MLU0` |
| Electricity | `area` | — |
| Telecom | `overhead` | — |
| Tram | `overhead` | — |
| Fernwärme | — | — |

---

## Decisions Log

| Date | Decision |
|------|----------|
| April 2026 | Switched from Python single-tile extraction to JS multi-tile `extract-lk-geojson.js` with deduplication |
| April 2026 | Water: excluded internal lines (LKZ131B) and misc/unknown features |
| April 2026 | Sewage: manhole points excluded — visible on street, not hidden infrastructure |
| April 2026 | Sewage: LKZ1118-MLU0 (Nebenleitung, lower accuracy) excluded entirely |
| April 2026 | Electricity: trasse area footprints excluded from audio pipeline; node trigger radius set to 40m (not 100m) |
| April 2026 | Telecom: overhead cable features excluded |
| April 2026 | Tram: overhead features excluded; route-specific VBZ files retired in favour of lk-tram-lk.geojson |
| April 2026 | Fernwärme added as sixth infrastructure layer — discovered in GeoShop data, fits project theme |
| April 2026 | Fernwärme sound design direction: slow thermal pulse, warm low rumble — distinct from sewage (cold/deep) and water (hydraulic/pressurised) |
| April 2026 | All exclusions applied at extraction time in extract-lk-geojson.js, not at ProximityEngine load time |
