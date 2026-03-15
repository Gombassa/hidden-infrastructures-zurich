# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Invisible Infrastructures: Zurich - A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio. Users walk through District 1 (Altstadt) as their smartphone generates real-time procedural soundscapes driven by five layers of invisible systems.

**Phase 1 MVP - District 1 (Postal Code 8001):**
- Route: Stadelhofen → Paradeplatz (~2.5km)
- Five infrastructure layers: tram electrical, water supply, sewage, electricity grid, telecommunications
- Target completion: July 2026
- Public launch: August 2026
- Future expansion: Districts 2-6 (2027-2030)

**Technical approach:**
- Progressive Web App (browser-based, platform-agnostic)
- Max/MSP → RNBO → WebAssembly AudioWorklet for production audio synthesis (Cycling '74)
- Web Audio API PannerNode (HRTF mode) for spatial audio
- Real-time + static data from Stadt Zürich open data programs
- Zero personal data collection, GPS processed entirely on-device

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

# Serve prototypes locally (required for AudioWorklet + ES modules)
npx http-server . -p 8080
# Then open:
#   http://127.0.0.1:8080/prototypes/01-audio-sketches/dual-patch-test.html
#   http://127.0.0.1:8080/prototypes/02-tram-engine/tram-engine-test.html
#   http://127.0.0.1:8080/prototypes/04-listener/listener-test.html

# Route extraction (one-time, output already committed)
node scripts/extract-route-waypoints.js
```

**Dependencies:** `npm install`

## Architecture

```
data/
├── raw/           # VBZ GeoJSON: feeders, masts, powerlines
└── processed/     # Generated: substations.geojson, route-waypoints.json, maps
scripts/           # One-time data processing (Node.js)
tests/             # Python analysis scripts (standalone, no shared modules)
src/
├── tram-engine.js       # Live tram positions from transport.opendata.ch
├── proximity-engine.js  # Tram ↔ infrastructure distance calculations
└── listener-engine.js   # Simulated walker along extracted route
prototypes/
├── 01-audio-sketches/   # Web Audio API pipeline test (direct synthesis placeholder)
├── 02-tram-engine/      # TramEngine + ProximityEngine live dashboard
└── 04-listener/         # ListenerEngine walking simulation with Leaflet map
docs/              # Phase planning and specifications
```

## Key Data

**Infrastructure Layers (Phase 1 MVP):**
1. **Tram electrical:** 366 power feeders (VBZ static geodata) + real-time tram positions (transport.opendata.ch API)
2. **Water supply:** Distribution pipes, pumping stations (WVZ Leitungskataster - 1,550 km network)
3. **Sewage:** Main collectors, treatment facilities (ERZ Abwasser-Werkleitungsdaten)
4. **Electricity grid:** High-voltage substations, distribution transformers (ewz Werkleitungsdaten)
5. **Telecommunications:** Fiber optic nodes, data infrastructure (ewz Telecom)

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

- VBZ does not publish substation locations publicly - tram electrical layer focuses on 366 power feeders only
- Feeder attributes are minimal (only `objectid`, `einbaudatu`) - no substation_id or connectivity metadata
- Infrastructure geodata is static snapshots - only tram positions update in real-time
- Water/sewage/electricity/telecom layers will use static infrastructure positions (no real-time flow/usage data available)

## Audio Layers (Phase 1 MVP - District 1)

**Infrastructure Layers (procedurally generated):**
1. **Tram electrical** - Feeder crackle when trams draw power, electrical transients
2. **Water supply** - Hydraulic pulse, flow textures, pumping station rhythms  
3. **Sewage** - Deep bass churn, underground rumble, treatment facility processes
4. **Electricity grid** - High-frequency harmonic screaming, transformer hum, voltage fluctuations
5. **Telecommunications** - Data chirps, fiber optic whispers, bandwidth pulses

**District Musical Theme:**
- District 1 (Altstadt): Procedurally-generated electronic theme reflecting historic center character
- Composed layer that infrastructure sounds "perform" atop

**Future Expansion (Districts 2-6):**
- Each district receives unique musical theme
- Same 5 infrastructure layers with district-specific sonic character

## Engine Modules (src/)

All three are ES modules with no DOM dependencies. Serve from project root via `npx http-server . -p 8080`.

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
Singleton, default export. Loads substations + feeders GeoJSON, computes audio trigger parameters from tram positions.

```javascript
import ProximityEngine from './src/proximity-engine.js';
await ProximityEngine.init();              // loads both GeoJSON files
ProximityEngine.calculate(tramState);      // → { substations: [{id, lat, lng, tramCount, nearestTramDist}], feeders: [{id, lat, lng, triggered, triggeringTram}] }
```

- Substation radius: 150m (tramCount = trams within this range)
- Feeder trigger radius: 30m

### ListenerEngine (`src/listener-engine.js`)
Singleton, default export. Simulates a walker along the extracted route at 5 km/h with 1-second tick.

```javascript
import ListenerEngine from './src/listener-engine.js';
await ListenerEngine.init();               // loads route-waypoints.json
ListenerEngine.start();                    // begin auto-walk
ListenerEngine.stop();                     // pause
ListenerEngine.reset();                    // return to Stadelhofen
ListenerEngine.getState();                 // → { lat, lng, progress, distanceTravelled, totalDistance, speed, heading, nearestStop, isWalking }
ListenerEngine.setProgress(0.5);           // manual scrub (0–1)
ListenerEngine.setSpeed(mps);              // change walk speed
ListenerEngine.onUpdate(cb);              // cb(state) every second
```

Route loops back to start automatically when reaching Bürkliplatz.

## RNBO Integration (Production Audio)

Production audio patches are authored in Max/MSP, compiled via RNBO (Cycling '74) to self-contained WASM modules, and run in an AudioWorklet on a dedicated high-priority thread.

### Workflow
1. Design patch in Max/MSP with RNBO objects
2. Export from RNBO as Web target → generates `patch.wasm` + `rnbo.min.js`
3. Load in browser: `createDevice` from RNBO JS API → returns device node
4. Connect: `device.node.connect(pannerNode)` for spatial positioning
5. Control parameters via `device.parametersById.get('paramName').value = x`

### Current state
- Dev placeholder: `prototypes/01-audio-sketches/index.html` uses direct Web Audio API synthesis (noise burst crackle + detuned oscillator drone)
- This validates the data pipeline (engines → proximity → audio) only — not final sound design
- Next milestone: validate RNBO pipeline with a single test patch before committing all five layers
