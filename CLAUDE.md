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

# WebPd: compile Pure Data patches for browser
npx webpd -i <patch>.pd -o <output-dir> -f app    # Full app (runtime + WASM + HTML)
npx webpd -i <patch>.pd -o <output>.wasm -f wasm  # WASM only (reuse existing runtime)
npx webpd -i <patch>.pd -o <output>.js -f javascript  # JS output (for debugging)

# Serve audio prototypes locally (required for AudioWorklet)
npx http-server prototypes/01-audio-sketches
# Then open http://127.0.0.1:8080/<test-page>.html
```

**Dependencies:** `npm install` (webpd for Pd patch compilation)

## Architecture

```
data/
├── raw/           # VBZ GeoJSON: feeders, (masts, powerlines for Phase 2)
└── processed/     # Generated: substations.geojson, maps, API responses
tests/             # Python analysis scripts (standalone, no shared modules)
prototypes/
└── 01-audio-sketches/
    ├── *.pd                    # Pure Data source patches
    ├── *-web.pd                # WebPd-compatible patches (unsupported objects removed)
    ├── feeder-event-app/       # Compiled: webpd-runtime.js + patch.wasm
    ├── substation-drone-app/   # Compiled: webpd-runtime.js + patch.wasm
    ├── webpd-test.html         # Single-patch test: feeder event
    ├── substation-drone-test.html  # Single-patch test: substation drone
    └── dual-patch-test.html    # Both patches running simultaneously
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
