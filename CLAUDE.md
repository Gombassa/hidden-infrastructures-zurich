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
- WebAssembly-compiled Pure Data patches for procedural audio synthesis
- Three.js PositionalAudio for spatial audio
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

# WebPd: compile Pure Data patches for browser
npx webpd -i <patch>.pd -o <output-dir> -f app    # Full app (runtime + WASM + HTML)
npx webpd -i <patch>.pd -o <output>.wasm -f wasm  # WASM only (reuse existing runtime)
npx webpd -i <patch>.pd -o <output>.js -f javascript  # JS output (for debugging)

# Serve prototypes locally (required for AudioWorklet + ES modules)
npx http-server . -p 8080
# Then open:
#   http://127.0.0.1:8080/prototypes/01-audio-sketches/dual-patch-test.html
#   http://127.0.0.1:8080/prototypes/02-tram-engine/tram-engine-test.html
#   http://127.0.0.1:8080/prototypes/04-listener/listener-test.html

# Route extraction (one-time, output already committed)
node scripts/extract-route-waypoints.js
```

**Dependencies:** `npm install` (webpd for Pd patch compilation)

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
├── 01-audio-sketches/   # WebPd patch tests (feeder event, substation drone)
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

## WebPd Integration

Pure Data patches are compiled to WebAssembly for browser playback using the WebPd CLI.

### Compilation workflow
1. Design patch in Pure Data desktop (`*.pd`)
2. Create web-compatible version (`*-web.pd`) removing unsupported objects
3. Compile: `npx webpd -i patch-web.pd -o output-dir -f app`
4. Test in browser via local HTTP server

### WebPd limitations
- **No IIFE/UMD bundle** — WebPd is ES modules only, cannot be loaded via `<script src="cdn...">`
- Must use the CLI-generated `webpd-runtime.js` (contains worklet processor + bindings)
- `webpd-runtime.js` is shared across patches (only need one copy)
- Each patch compiles to its own `patch.wasm`

### Unsupported Pd objects (remove for web builds)
- `switch~` — use AudioContext start/stop instead
- See full list: `npx webpd --whats-implemented`

### WebPd message API
Messages are sent to compiled patch nodes via AudioWorklet port:
```javascript
node.port.postMessage({
    type: 'io:messageReceiver',
    payload: { nodeId: 'n_0_X', portletId: '0', message: [value] }
});
```
Node IDs are assigned at compile time — check compiled JS metadata or generated `index.html` for the mapping.

### Compiled patch node IDs

**feeder-event (feeder-event-app/patch.wasm):**
- `n_0_0` portlet `0` — bng (trigger event with `['bang']`)
- `n_0_2` portlet `0` — floatatom "pitch" (send `[800]` etc.)

**substation-drone (substation-drone-app/patch.wasm):**
- `n_0_29` portlet `0` — vsl "Freq Control" (0-1 float)
- `n_0_32` portlet `0` — floatatom "Trams Nearby" (0-5 integer)
