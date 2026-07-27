# Hidden Infrastructures: Zürich — Technical Architecture

# Executive Summary

This document describes the technical architecture for Hidden Infrastructures: Zürich, a location-based generative music application that sonifies six layers of urban infrastructure through spatial audio. The system combines real-time municipal data, procedural audio synthesis, and privacy-by-design principles to create an accessible public artwork requiring only a smartphone and headphones.

Coding and advanced technical implementations have been developed with the assistance of Anthropic Claude's coding agent. All sound design is conceived and created from the outset by the artist, with some code reviews and assistance from AI.

This document reflects the current implemented state as of April 2026. For code, see the [GitHub repository](https://github.com/Gombassa/hiddeninfrastructures-zurich).

The piece is an homage to the City and the principles enshrined in the Open By Default resolution of the City Council of 2021, enhancing accessibility and transparency through:

* Zero personal data collection — FADP/GDPR compliant by design
* Browser-based Progressive Web App — no app store barriers
* Real-time procedural audio synthesis via Web Audio API — no large data transfers
* Six infrastructure layers with spatial audio and interactive layer toggles
* Real-time data integration from [www.stadt-zuerich.ch](http://www.stadt-zuerich.ch) open data sources
* Offline-capable after initial load

---

# Development Status (April 2026)

All Phase 2 components are built, integrated, and deployed.

## 1. Audio Synthesis Pipeline

**Validated: Direct Web Audio API Synthesis**

All six infrastructure layers are fully implemented as procedural synthesis in `src/audio-layers.js`. The audio pipeline is field-tested and confirmed working. The Web Audio API direct synthesis approach is confirmed as the production path for Phase 1.

**Production Path: Max/MSP + RNBO**

Production sound design will be authored in Max/MSP and exported to browser-deployable WebAssembly via RNBO (Cycling '74). This workflow — Max/MSP → RNBO compiler → WebAssembly → AudioWorklet — is deferred to Phase 2 (sound design phase). The current Web Audio API synthesis validates the full data-to-audio pipeline and serves as a sonic specification for the Max/MSP patches.

**Spatial Audio**

Spatial positioning uses the Web Audio API PannerNode in HRTF mode for per-feeder hiss positioning (tram layer). Fernwärme uses a StereoPanner driven by the computed bearing from listener to the nearest pipe segment (relative to listener heading). GPS coordinates and compass heading from `DeviceOrientationEvent` determine bearing and distance to each source.

## 2. Core Engine Modules

**TramEngine** (`src/tram-engine.js`)

Polls transport.opendata.ch every 10 seconds for live tram departure times, then interpolates positions between stops at 15 km/h average speed. Built as a singleton with observer pattern. Handles API failures gracefully by retaining last known positions.

**ProximityEngine** (`src/proximity-engine.js`)

Loads all 7 GeoJSON files in parallel on `init()`. Calculates distances from listener to infrastructure elements using haversine and nearest-point-on-segment math. Returns structured proximity results for all 6 layers each `calculate()` call.

Key capabilities added in Phase 2:

- **Nearest-point-on-segment distance** for all LineString features — more accurate than endpoint or midpoint checks
- **Spatial culling** (`cullBounds`) — bounding-box pre-filter eliminates distant features before precise distance math
- **`extendLinesWithMovement()`** — applied to all 5 LineString layers (water pipes, sewage pipes, electricity cables, telecom cables, fernwärme pipes); adds `crossing` and `alongside` boolean flags per feature each tick using cross-product sign test (`segsCross`) and acute angle threshold (35°, ALONGSIDE_RADIUS 20m, MIN_MOVE_METRES 0.5)
- **Sewage junction clustering** — `computeSewageJunctions()` clusters pipe endpoints within 8m at init; junction proximity triggers distinct thud events
- **`nearestSegmentBearing()`** — computes bearing (0–360° from N) from listener to nearest point on nearest fernwärme pipe segment; returned in the pipe proximity result for stereo panning
- **Hydrant exclusion** — LKZ1322-MSU- water features filtered at parse time

**AudioLayers** (`src/audio-layers.js`)

All six audio layers as a single ES module singleton. Lifecycle: `init(ctx)` on Start creates all nodes; `stop()` performs full teardown. `onListenerMove(lat, lng, heading)` updates hiss panner positions on GPS fix between 10-second tram ticks.

**GPS Listener** (inline in `index.html`)

Live GPS via `navigator.geolocation.watchPosition()`. Compass heading via `DeviceOrientationEvent`. No synthesis code in `index.html`.

## 3. Audio Layer Implementations

### Tram Electrical

- **Hiss pool**: 6 comb-filtered noise nodes, distinct delay times per slot (2.3–8.9ms), HRTF-positioned PannerNodes updated on GPS fix
- **Crackle**: debounced one-shot per feeder ID, proximity-scaled gain (150m falloff), speed-mode detection
- **Drone**: dual 110/112Hz oscillators, dual LFO sweep (0.017/0.023Hz ±8Hz), gain ramp on powerline proximity (20m→5m); private convolver reverb (2.0s, 3% wet)
- **Sends to shared density reverb bus**

### Water

- **Proximity pulse**: proximity-scaled bandpass burst on entry (pipe 800Hz 0.25s / fitting 1200Hz 0.08s), 30s cooldown; gain 0.04–0.18 by distance
- **Fitting cluster drip**: 2800Hz bursts at rate proportional to fitting count within 15m (up to 3Hz), ±25% jitter
- **Pipe crossing**: 380Hz knock one-shot, 3s cooldown
- **Alongside loop**: 380Hz knock at ~3.5s ±30% jitter while walking parallel to pipe within 20m

### Sewage

- **Continuous rumble**: looped lowpass noise (180Hz LP), gain ramped by nearest pipe distance (80m threshold, TC 1.5s)
- **Rhythmic gurgle**: 100Hz bandpass burst, random 1.25–5s interval, active below 20m
- **Junction thud**: 55Hz burst (0.6s, gain 0.14) on junction entry, 10s cooldown per junction
- **Pipe crossing**: 200Hz transient, 3s cooldown
- **Alongside loop**: gurgle rhythm ~4s ±35% jitter
- **Sends to shared density reverb bus**

### Electricity

- **Oscillator pool**: 8 slots, paired sawtooth oscillators per slot (1490–1510Hz spread, +3Hz beating), LFO amplitude modulation (0.4Hz ±0.008); slots claimed/released per node ID
- **Node cluster density**: count nodes within 30m → gain multiplier 1.0–1.8× (5+ nodes = maximum density)
- **Master gain**: gates on node proximity, boosted by cable proximity (40m threshold)
- **Cable crossing snap**: 2200Hz bandpass noise (0.08s, gain 0.10), 3s cooldown
- **Alongside loop**: snap at ~5s ±40% jitter
- **Sends to shared density reverb bus**

### Telecom

- **Burst pool**: 4 noise sources, HP filtered at 5000/5600/6200/6800Hz per slot; each amplitude-gated by a slot-specific LFO (22/38/54/78Hz base rates); master gain from nearest cable proximity (30m threshold)
- **Density modulation**: cable count within 30m scales LFO rates 0.5–2.0× (simulates data traffic density)
- **Node-entry chirp**: sine sweep 2000→4000Hz, 0.2s, per-node debounce
- **Node dwell handshake**: 5s dwell triggers 1000→8000Hz sweep (0.4s, gain 0.18), 8s cooldown per node
- **Cable crossing click**: 3500→6000Hz sweep (0.06s, gain 0.10), 3s cooldown
- **Alongside loop**: click at ~4s ±45% jitter
- **Sends to shared density reverb bus**

### Fernwärme

- **Continuous tone**: 60Hz sine + 0.3Hz tremolo LFO modulating carrier gain (±0.4, multiplicative — prevents bleed when master=0)
- **StereoPanner**: bearing from listener to nearest pipe segment (relative to heading) drives pan value; `sin(relBearing)` → −1 (left) to +1 (right); 1s time constant
- **Proximity**: 30m radius (tightened from 60m for dramatic rare encounters); 0.4s ramp-in time constant
- **Pipe crossing**: 60Hz burst (0.5s, gain 0.15) routed through StereoPanner so it localises in the pipe's direction, 3s cooldown
- **Alongside loop**: thermal burst at ~6s ±40% jitter
- **Sends to shared density reverb bus**

### Shared Density Reverb

- **Bus**: 5 continuous-gain outputs (tram drone, sewage, electricity master, telecom burst master, fernwärme master) all send into a shared GainNode → ConvolverNode (1.8s impulse response) → wet GainNode → destination
- **Density score**: each `update()` tick counts enabled layers with triggered features (0–6)
- **Wet level**: `pow((density−1)/5, 1.5) × 0.07`, kicks in at 2+ overlapping layers (≈0.006 wet), peaks at all 6 layers (0.07 wet); slow TC 2.5s — spatial accumulation, not a switch
- **Effect**: Bahnhofstrasse (tram+water+elec+telecom = 4 layers) reaches ≈0.033 wet on top of the tram's private reverb, making dense infrastructure overlap perceptibly richer

## 4. Data Layer

### GeoShop Extraction

30 GeoShop DXF tile orders (55297–55476) processed via `scripts/extract-lk-geojson.js`. Manifest tracked at `data/processed/.processed-orders.json`. New tile ingestion automated via `scripts/import-new-tiles.js`.

| File | Features | Content | ProximityEngine radius |
|---|---|---|---|
| `lk-water.geojson` | 4,763 | 3,339 pipes + 1,424 fittings (WVZ, hydrants excluded) | 50m pipe / 25m fitting |
| `lk-sewage.geojson` | 3,552 | Pipes only (manholes, Nebenleitung excluded) | 80m pipe / 15m junction |
| `lk-electricity.geojson` | 7,223 | Underground cables + nodes (area footprints excluded) | 40m nodes / 40m cables |
| `lk-tram-lk.geojson` | 2,899 | Trasse + nodes (overhead/area excluded) | 50m feeders / 5m drone |
| `lk-telecom.geojson` | 8,301 | Cables + nodes (overhead excluded) | 40m nodes / 30m cables |
| `lk-fernwaerme.geojson` | 198 | District heating pipes | 30m pipes |

**Extraction pipeline features:**
- Processes GEO405/DXF format, LV95/EPSG:2056 → WGS84 via proj4
- Cross-tile deduplication via `_dedupKey` properties
- Incremental append mode
- Layer routing by regex rules maps DXF layer names to output files

### Real-time Data

transport.opendata.ch API — 10-second polling confirmed working.

## 5. Deployment

**Hosting:** Google Cloud Platform, Cloud Run. Current URL: https://hidden-infrastructures-50944718104.europe-west6.run.app/

**Docker:** Multi-stage build — Node.js build stage (Vite + extraction scripts) → Nginx serve stage. COEP/COOP headers for AudioWorklet compatibility.

**Dev workflow:** `npx vite --host` (port 8080) + Cloudflare Tunnel for HTTPS on Android Chrome field testing.

**CI/CD:** Push to `main` → GitHub → Cloud Run picks up automatically.

---

# System Architecture Overview

## Data Flow

```
transport.opendata.ch API (10s)
        ↓
   TramEngine.js
        ↓
ProximityEngine.js ← lk-*.geojson (7 files, loaded once)
        ↓               ↑
   calculate()    listener lat/lng/heading (GPS)
        ↓
   AudioLayers.update(proximity, lat, lng, heading)
        ↓
Web Audio API (destination → headphones)
```

## ProximityEngine Output Shape

```javascript
{
  substations: [{id, lat, lng, tramCount, nearestTramDist}],
  feeders:     [{id, lat, lng, triggered, triggeringTram}],
  nearestPowerlineDist,          // metres to nearest tram trasse
  water:       { pipes: [{id, midLat, midLng, dist, triggered, crossing, alongside}],
                 fittings: [{id, lat, lng, dist, triggered}] },
  sewage:      { pipes: [{...crossing, alongside}],
                 junctions: [{id, lat, lng, dist, triggered}] },
  electricity: { nodes: [{id, lat, lng, dist, triggered}],
                 cables: [{...crossing, alongside}] },
  telecom:     { nodes: [{id, lat, lng, dist, triggered}],
                 cables: [{...crossing, alongside}] },
  fernwaerme:  { pipes: [{...crossing, alongside, bearing}] },
}
```

## Audio Graph (simplified)

```
TramEngine tick / GPS fix
        ↓
AudioLayers.update() / onListenerMove()
        ↓
Per-layer synthesis nodes (all in audio-layers.js)
  ├── Tram: droneGain → destination + droneConvolver (private reverb) + sharedReverbBus
  ├── Sewage: sewageGain → destination + sharedReverbBus
  ├── Electricity: elecMasterGain → destination + sharedReverbBus
  ├── Telecom: telecomBurstMasterGain → destination + sharedReverbBus
  └── Fernwärme: fernMasterGain → StereoPanner → destination + sharedReverbBus
        ↓
sharedReverbBus → Convolver (1.8s IR) → sharedReverbOut (density-driven wet) → destination
```

## Performance Optimisation

**Spatial culling:** `cullBounds()` computes a bounding box at 100m radius; `cullLines()` and `cullPoints()` pre-filter features before distance math. Reduces the working set from 22,000+ total features to ~50–200 nearby.

**Movement detection:** `extendLinesWithMovement()` only fires crossing/alongside logic when `moveDist > MIN_MOVE_METRES (0.5m)` and a previous position exists — prevents spurious events on GPS jitter.

**Audio pooling:** Electricity oscillator pool (8 slots) and telecom burst pool (4 slots) are pre-allocated at init; slots are claimed/released per feature ID without creating new Web Audio nodes.

**Timer-based scheduling:** All alongside loops and rhythmic patterns use `setTimeout` recursion with jitter (not `setInterval`) — self-cancelling when layer is disabled or stopped.

---

# Future Development Work

## Phase 2: Production Sound Design (May 2026)

Replace placeholder Web Audio API synthesis with Max/MSP patches exported via RNBO. The current synthesis serves as a sonic specification for each layer — the RNBO patches will implement the same structural behaviours (continuous textures, triggered events, proximity modulation, crossing transients) with production-quality sound design.

Layers requiring production patches:
- Tram electrical: crackle, hiss pool, powerline drone
- Water: hydraulic pulse, fitting drip, pipe knock
- Sewage: underground rumble, gurgle rhythm, junction thud
- Electricity: transformer hum pool, cable snap
- Telecommunications: data burst texture, chirp events
- Fernwärme: thermal drone, proximity warmth, pipe direction panning
- District 1 musical theme: procedural electronic ambient

## Phase 3: Progressive Web App Deployment

Service Worker for offline capability, Web App Manifest for home screen installation, cross-platform testing (iOS Safari + Android Chrome).

## Phase 4: Testing & Public Launch (August 2026)

15+ user testing participants walking District 1, structured feedback, audio mix refinement, documentation, public launch event.

## District Expansion (2027–2030)

Scale to postal codes 8002–8006 with a unique musical theme per district. Auto-switch based on GPS-detected postal code.

---

**Document Version:** 4.0
**Last Updated:** April 2026
**Author:** Robin Pender
**Contact:** robinpender23@gmail.com
**Repository:** https://github.com/Gombassa/hiddeninfrastructures-zurich
**Deployed:** https://hidden-infrastructures-50944718104.europe-west6.run.app/
**Funding Application:** Stadt Zürich Digitale Künste: Umsetzung und Präsentation (CHF 13,200)
