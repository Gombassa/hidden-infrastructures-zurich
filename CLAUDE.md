# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invisible Infrastructures: Zurich - An immersive audio walk that sonifies Zurich's tram electrical network (600V DC) through spatial audio. Currently in Phase 1 (Prototyping).

**Route:** Stadelhofen → Bahnhofstrasse 45 (~2.5km)

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
├── raw/           # VBZ GeoJSON: powerlines, masts, feeders, buildings
└── processed/     # Generated: substations, maps, API responses
tests/             # Python analysis scripts (standalone, no shared modules)
src/               # Future PWA code (Three.js + Tone.js + Leaflet)
docs/              # Phase planning and specifications
```

## Key Data

- 1,689 overhead wire segments, 258 poles, 366 feeders, 71 substations
- 9 tram lines: 2, 4, 7, 8, 9, 10, 11, 13, 15
- Data source: `transport.opendata.ch` API, VBZ Infrastruktur OGD

## Conventions

- GeoJSON coordinates: `[longitude, latitude]`
- Zurich center: ~47.37°N, 8.55°E
- Tram speed assumption: 15 km/h average
- Station queries need URL encoding for "Zürich" characters
- Tram category filter: `'T'`

## Known Limitation

Tram position simulation uses straight-line interpolation between stops (±15-30m error). Phase 1.5 will implement geometry-snapping to actual powerline curves.

## Audio Layers (Phase 1 Target)

1. Wire hum (600 Hz drone, 1,689 segments)
2. Feeder flow (directional whoosh, 366 segments)
3. Pole pings (metallic chime at 10m proximity, 258 poles)
4. Tram events (power surge when tram intersects wire)
5. Substation drone (optional 50 Hz bass, 71 locations)
