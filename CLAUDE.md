# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hidden Infrastructures: Zürich - A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio. Users walk through District 1 (Altstadt) as their smartphone generates real-time procedural soundscapes driven by five layers of invisible systems.

**Phase 1 MVP - District 1 (Postal Code 8001):**
- Route: Stadelhofen → Paradeplatz (~2.5km)
- Six infrastructure layers: tram electrical, water supply, sewage, electricity grid, telecommunications, Fernwärme (district heating)
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

# Import new GeoShop tile deliveries
node scripts/import-new-tiles.js

```

**Dependencies:** `npm install`

## Architecture

```
index.html         # Main application (root) — GPS + Web Audio API pipeline
src/
├── tram-engine.js       # Live tram positions from transport.opendata.ch
├── proximity-engine.js  # Tram ↔ infrastructure distance calculations (all 6 layers)
└── audio-layers.js      # Web Audio API synthesis for all 6 layers (tram/water/sewage/elec/telecom/fernwärme)
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

**Infrastructure Layers (Phase 1 MVP):**
1. **Tram electrical:** lk-tram-lk.geojson — nodes (feeders) + trasse (powerlines), full District 1. Real-time tram positions from transport.opendata.ch API.
2. **Water supply:** lk-water.geojson — 3,339 pipe LineStrings + 1,424 fitting Points (WVZ Leitungskataster)
3. **Sewage:** lk-sewage.geojson — pipes only, manholes excluded (ERZ Abwasser-Werkleitungsdaten)
4. **Electricity grid:** lk-electricity.geojson — nodes + cables, area footprints excluded, total 7,223 features (ewz Werkleitungsdaten)
5. **Telecommunications:** lk-telecom.geojson — nodes + cables, overhead excluded, total 8,301 features (ewz Telecom / Swisscom / UPC)
6. **Fernwärme:** lk-fernwaerme.geojson — district heating pipes, 198 features (SIA405 LKMap via GeoShop)

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
- Feeder attributes are minimal (only `objectid`, `einbaudatu`) — no substation_id or connectivity metadata
- Infrastructure geodata is static snapshots — only tram positions update in real-time
- Water/sewage/electricity/telecom/Fernwärme layers use static infrastructure positions — no real-time flow/usage data available
- Fernwärme coverage is sparse in District 1 — encounters will be infrequent (nearest pipe at Paradeplatz was 79m, just outside 60m threshold)
- Audio synthesis in audio-layers.js is placeholder Web Audio API — production sound design via Max/MSP + RNBO deferred to Phase 3

## Audio Layers (Phase 1 MVP - District 1)

**Infrastructure Layers (procedurally generated):**
1. **Tram electrical** - Feeder crackle when trams draw power, comb-filtered hiss, powerline drone
2. **Water supply** - Hydraulic pulse on proximity entry, flow textures
3. **Sewage** - Deep bass rumble, distance-modulated continuous texture
4. **Electricity grid** - Sawtooth oscillator pool (1500Hz), node entry triggers, cable density modulation
5. **Telecommunications** - Chirp on node entry (2→4kHz sweep), continuous highpass fiber texture
6. **Fernwärme** - Slow 60Hz sine tone with 0.3Hz tremolo, warm thermal pulse on proximity

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
Singleton, default export. Loads all 7 GeoJSON files in parallel, computes proximity results for all 6 infrastructure layers.

```javascript
import ProximityEngine from './src/proximity-engine.js';
await ProximityEngine.init();   // loads substations + 6 lk-*.geojson files from public/
ProximityEngine.calculate(tramState, listenerLat, listenerLng, heading, speed);
// → {
//     substations: [{id, lat, lng, tramCount, nearestTramDist}],
//     feeders:     [{id, lat, lng, triggered, triggeringTram}],
//     nearestPowerlineDist,          // metres to nearest tram trasse segment
//     water:       { pipes: [{id, midLat, midLng, dist, triggered}], fittings: [...] },
//     sewage:      { pipes: [...] },
//     electricity: { nodes: [{id, lat, lng, dist, triggered}], cables: [...] },
//     telecom:     { nodes: [...], cables: [...] },
//     fernwaerme:  { pipes: [...] },
//   }
// New layer arrays are empty when listenerLat/Lng is null.
```

- Substation radius: 150m (tramCount = trams within this range)
- Feeder trigger radius: 50m (tram-only) — listener proximity also required in foot mode
- Drone fade: 20m→5m linear from nearest tram trasse segment
- Water: 50m pipe / 25m fitting (nearest point on segment)
- Sewage: 80m pipe (nearest point on segment)
- Electricity: 40m nodes / 40m cables
- Telecom: 40m nodes / 30m cables
- Fernwärme: 60m pipes (provisional)

### AudioLayers (`src/audio-layers.js`)
Singleton, default export. Web Audio API synthesis for **all 6 infrastructure layers** including tram electrical. Lifecycle: `init()` on Start, `stop()` tears down all nodes and resets for next Start.

```javascript
import AudioLayers from './src/audio-layers.js';
AudioLayers.init(audioContext);                                    // call on Start — creates all nodes
AudioLayers.update(proximity, listenerLat, listenerLng, heading);  // call each TramEngine tick
AudioLayers.onListenerMove(lat, lng, heading);                     // call on GPS fix — updates hiss panner positions between tram ticks
AudioLayers.stop();                                                // tears down all nodes, resets _initialized
AudioLayers.LAYER_ENABLED                                          // { tram, water, sewage, electricity, telecom, fernwaerme }
```

- Tram electrical: feeder crackle (6-burst noise, HRTF spatial, debounced per feeder ID), comb-filtered hiss pool (6 nodes, distinct delay times per slot), drone (110/112Hz ±LFO, powerline proximity 20m→5m), reverb send
- Water: bandpass noise burst on proximity entry (pipe 800Hz / fitting 1200Hz)
- Sewage: looped lowpass noise, gain modulated by distance (continuous)
- Electricity: 4-slot sawtooth oscillator pool (1500Hz ±3Hz), master gain gated by node proximity
- Telecom nodes: sine chirp (2→4kHz sweep) on proximity entry; cable: looped highpass noise texture
- Fernwärme: 60Hz sine + tremolo LFO (0.3Hz, ±0.4 carrier gain), gain ramps on proximity

### GPS Listener (inline in `index.html`)
Note: `index.html` contains **no audio synthesis code**. All synthesis (including tram electrical) lives in `audio-layers.js`. GPS fix calls `AudioLayers.onListenerMove(lat, lng, heading)` to update hiss panner positions between tram ticks.
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
- All tram audio (crackle, hiss pool, drone, reverb) now lives in `audio-layers.js` — `index.html` contains no synthesis code
- Cloud Run service URL: https://hidden-infrastructures-50944718104.europe-west6.run.app/

---

## Current State (April 2026)

Phase 1/2 active on `phase-1` git branch. Deployed to Cloud Run.

Audio pipeline working (field-tested on Bahnhofstrasse + Paradeplatz hardcoded test):
- Feeder hiss (proximity-scaled, 6-node comb-filter pool, each slot distinct comb delay) — working
- Feeder crackle (debounced one-shot per feeder ID, speed-mode detection) — working
- Drone (powerline proximity, 20m→5m fade, dual-LFO + reverb) — working
- Water (bandpass noise pulses on proximity entry) — working, pending field test
- Sewage (continuous lowpass rumble, distance-modulated) — working, pending field test
- Electricity (sawtooth oscillator pool, 4 slots) — working, pending field test
- Telecom (chirp on node entry + highpass cable texture) — working, pending field test
- Fernwärme (60Hz sine + tremolo) — working, pending field test
- Tram markers not rendering on map — known cosmetic issue, deprioritised

All 6 layers now in `audio-layers.js` (tram electrical refactored out of index.html April 2026).
UI has per-layer toggle buttons (TRAM / WATER / SEWAGE / ELECTRICITY / TELECOM / FERNWÄRME).

Audio lifecycle:
- Unlock Audio: ProximityEngine.init() + AudioContext.resume() only — no synthesis nodes
- Start: AudioLayers.init(ctx) — creates all 6 layers incl. tram drone + hiss pool; TramEngine.start()
- Stop: AudioLayers.stop() — full teardown of all 6 layers; TramEngine.stop()

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
- ProximityEngine.calculate() must receive realLat/realLng explicitly — null defaults bypass the listener gate entirely and return empty arrays for all new layers
- AudioLayers.update() key shape must match ProximityEngine.calculate() return shape — nested (proximity.water.pipes) not flat (proximity.waterPipes)
- AudioLayers lifecycle: init() on Start (not on Unlock Audio), full teardown in stop() with _initialized sentinel to guard against in-flight TramEngine ticks after Stop
- Fernwärme tremolo: LFO must modulate a carrier gain (multiplicative), not the master gain (additive) — additive LFO bleeds through when master=0, producing sound before Start and after Stop
- Hiss pool comb delay times must be assigned per-slot at init — assigning them only at max buffer creation (as was previously done) makes all slots sound identical
- onListenerMove() must be called on GPS fix to update hiss panner positions between 10s tram ticks — without it, panning freezes at last tram-tick heading

## Next Steps (as of April 2026)

- Field test water, sewage, electricity, telecom, Fernwärme layers on route
- Fix tram markers not rendering on map (deprioritised cosmetic)
- District musical theme — deferred to later phase
- RNBO/Max MSP integration — deferred to Phase 2
- Phase 2 planning: Districts 2-6 expansion

## Next Session

- Field test water, sewage, electricity, telecom, Fernwärme layers on route
- Fix tram markers not rendering on map (deprioritised)
- Investigate Cloud Run build trigger reliability