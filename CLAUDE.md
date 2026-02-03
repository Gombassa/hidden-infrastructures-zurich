# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invisible Infrastructures: Zurich - An immersive audio walk that sonifies Zurich's hidden tram power distribution network through spatial audio. Phase 1 focuses on the **underground/invisible infrastructure**: substations and power feeders that users walk past without seeing.

**Route:** Stadelhofen → Bahnhofstrasse 45 (~2.5km)
**Phase 1 Focus:** Hidden infrastructure (substations + feeders)
**Phase 2 Future:** Visible overhead catenary (wires, poles, tram events)

## Commands

All Python scripts use only stdlib (no dependencies to install):

```bash
# Analysis scripts
python3 tests/find-substations.py          # Cluster feeders → substations.geojson
python3 tests/test-vbz-realtime.py         # Validate VBZ API endpoints
python3 tests/test-tram-stops.py           # Confirm tram lines per stop
python3 tests/simulate-tram-positions.py   # Static position snapshot
python3 tests/simulate-tram-positions-live.py  # Live-updating HTML map

# View generated maps
open data/processed/substations-map.html
open data/processed/tram-simulation-live.html
```

No build system yet - project is in early prototyping.

## Architecture

```
data/
├── raw/           # VBZ GeoJSON: feeders, (masts, powerlines for Phase 2)
└── processed/     # Generated: substations.geojson, maps, API responses
tests/             # Python analysis scripts (standalone, no shared modules)
src/               # Future PWA code (Three.js + Tone.js + Leaflet)
docs/              # Phase planning and specifications
```

## Key Data

**Phase 1 (hidden infrastructure):**
- 71 substations (inferred from feeder clustering, ~15m radius)
- 366 power feeders (connect substations to overhead network)

**Phase 2 (visible infrastructure, deferred):**
- 1,689 overhead wire segments, 258 poles
- Real-time tram events

**Data sources:** VBZ Infrastruktur OGD, `transport.opendata.ch` API

## Conventions

- GeoJSON coordinates: `[longitude, latitude]`
- Zurich center: ~47.37°N, 8.55°E
- Tram speed assumption: 15 km/h average
- Station queries need URL encoding for "Zürich" characters
- Tram category filter: `'T'`

## Known Limitations

- Substations are **inferred** by clustering feeder endpoints (not official VBZ data)
- VBZ OGD dataset has no dedicated substation layer; consider OSM `power=substation` queries for validation
- Feeder attributes are minimal (only `objectid`, `einbaudatu`) - no substation_id or connectivity metadata

## Audio Layers

### Phase 1 (Hidden Infrastructure)
1. **Substation drone** - Deep 50 Hz bass at 71 inferred locations, audible from 100m+
2. **Feeder flow** - Directional whoosh/granular synthesis, 366 segments tracing power distribution

### Phase 2 (Visible Infrastructure - Deferred)
3. Wire hum (600 Hz drone, 1,689 overhead segments)
4. Pole pings (metallic chime at 10m proximity, 258 poles)
5. Tram events (power surge when tram intersects wire)
