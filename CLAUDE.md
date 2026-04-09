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

# View generated maps
open data/processed/substations-map.html
open data/processed/tram-simulation-live.html
```

**Dependencies:** `npm install`

## Architecture

```
index.html         # Main application (root) — GPS + Web Audio API pipeline
src/
├── tram-engine.js       # Live tram positions from transport.opendata.ch
└── proximity-engine.js  # Tram ↔ infrastructure distance calculations
public/
└── data/
    ├── processed/       # substations.geojson (served at runtime)
    └── raw/             # route-tram-feeders.geojson, route-tram-powerlines.geojson
data/
├── raw/           # VBZ GeoJSON: feeders, masts, powerlines
└── processed/     # Generated: substations.geojson, route-waypoints.json, maps
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
Singleton, default export. Loads substations + feeders + powerlines GeoJSON, computes audio trigger parameters from tram positions and optional listener position.

```javascript
import ProximityEngine from './src/proximity-engine.js';
await ProximityEngine.init();              // loads GeoJSON from /data/processed/ and /data/raw/
ProximityEngine.calculate(tramState, listenerLat, listenerLng, heading, speed);
// → { substations: [{id, lat, lng, tramCount, nearestTramDist}], feeders: [{id, lat, lng, triggered, triggeringTram}], nearestPowerlineDist }
// All args after tramState default to null. heading and speed are captured but not yet used internally.
```

- Substation radius: 150m (tramCount = trams within this range)
- Feeder trigger radius: 50m (tram-only) — listener proximity also required in foot mode
- Drone fade radius: 50m (linear gain from powerline proximity)

### GPS Listener (inline in `index.html`)
Live GPS via `navigator.geolocation.watchPosition()`. No separate module.

- Updates `realLat` / `realLng` / `realSpeed` on every fix
- `realHeading` updated via `deviceorientation` event (`event.alpha`, 0–360°)
- Moves listener marker on Leaflet map
- Follows position at zoom 19 while `following = true` (Start → Stop)
- Logs each fix to on-screen log panel via `appendLog`

## RNBO Integration (Production Audio)

Production audio patches are authored in Max/MSP, compiled via RNBO (Cycling '74) to self-contained WASM modules, and run in an AudioWorklet on a dedicated high-priority thread.

### Workflow
1. Design patch in Max/MSP with RNBO objects
2. Export from RNBO as Web target → generates `patch.wasm` + `rnbo.min.js`
3. Load in browser: `createDevice` from RNBO JS API → returns device node
4. Connect: `device.node.connect(pannerNode)` for spatial positioning
5. Control parameters via `device.parametersById.get('paramName').value = x`

### Current state
- Web Audio API direct synthesis is the confirmed production path for Phase 1
- RNBO/Max MSP deferred; no licence purchases required before Phase 2
- `index.html` uses: noise burst crackle (PannerNode spatial), comb-filtered hiss pool (PannerNode spatial), detuned oscillator drone (powerline proximity gain), synthetic convolver reverb on drone

---

## Current State (April 2026)

Phase 1 active on `phase-1` git branch.

Audio pipeline confirmed working in field tests on Bahnhofstrasse:
- Feeder hiss (proximity-scaled, 6-node comb-filter pool with active-slot tracking) — working
- Feeder crackle (debounced one-shot events per feeder ID, speed-mode detection for on-tram use) — working
- Drone (distance-based gain ramp triggered by proximity to powerline segments in route-tram-powerlines.geojson, 20m→5m fade) — working
- Tram markers not rendering on map — known cosmetic issue, deprioritised

## Architecture decisions (confirmed)

- WebPd and Three.js dropped entirely
- RNBO/Max MSP deferred; Web Audio API is the validated production synthesis path
- ListenerEngine simulation stripped out; live GPS via `watchPosition()` only
- pole-ping sound layer dropped
- district-theme deferred to later phase
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
- ProximityEngine.calculate() must receive realLat/realLng explicitly — null defaults bypass the listener gate entirely
- Feeder hiss gain control must be implemented separately from the triggered feeder logic — the pool exists but gain modulation requires explicit distance calculations against FEEDER_HISS_RADIUS
