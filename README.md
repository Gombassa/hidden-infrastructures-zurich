# Hidden Infrastructures: Zürich

Location-aware generative audio Progressive Web App that sonifies Zürich's
urban infrastructure as users move through District 1. All audio procedurally
generated via Web Audio API. No samples or pre-rendered assets.

**Live:** https://hidden-infrastructures-50944718104.europe-west6.run.app/

## Current Status

Phase 2 complete. All 6 infrastructure layers working with event-driven audio and shared spatial depth.

| Layer | Synthesis | Events |
|---|---|---|
| Tram electrical | HRTF hiss pool (6 comb-filter slots), powerline drone (dual LFO), feeder crackle | Feeder entry crackle, drone on trasse proximity |
| Water | Proximity-scaled bandpass pulse (800Hz pipe / 1200Hz fitting), fitting drip rate | Entry pulse, pipe crossing knock, alongside loop, drip density |
| Sewage | Looped lowpass rumble (distance-modulated), rhythmic gurgle | Junction thud, pipe crossing, alongside loop, gurgle below 20m |
| Electricity | 8-slot sawtooth pool (1490–1510Hz spread, per-slot beating), density gain | Node entry, cable crossing snap, alongside loop |
| Telecom | 4-slot LFO-gated burst pool (22–78Hz), density-modulated rate | Node chirp, 5s dwell handshake, cable crossing click, alongside loop |
| Fernwärme | 60Hz sine + tremolo, StereoPanner driven by pipe bearing | Entry (30m), pipe crossing burst, alongside loop |

**Shared density reverb:** active layer count (0–6) drives a shared convolver wet level (0→0.07). Dense infrastructure overlap — Bahnhofstrasse has tram + water + electricity + telecom — feels noticeably richer spatially.

**Line-crossing detection:** all 5 LineString layers (water pipes, sewage pipes, electricity cables, telecom cables, fernwärme pipes) detect when the walker's path crosses or runs alongside a line, firing layer-appropriate one-shot transients and looping alongside events.

## Audio architecture

All synthesis is direct Web Audio API code in `src/audio-layers.js` — no Max/MSP, no RNBO, no compiled WASM patches. This is the confirmed production path, not a placeholder pending a native-audio toolchain. Each of the 23 sonic behaviours across the six layers (proximity pulses, crossing transients, alongside loops, oscillator/burst pools, continuous drones), plus the District 1 musical theme as a separate workstream, will be rebuilt as a self-contained instrument module with a paired HTML control surface for hands-on sound design and MIDI-driven auditioning — Phase 3, not yet started. See `docs/Technical_Architecture_v5.md` for the interface contract under consideration and `docs/Implementation_Plan.md` for the build plan. `max/` holds archived Max for Live specifications retained as sonic reference — not part of the current toolchain.

## Running locally

See STARTUP.md for full instructions.

```bash
npm install
npx vite --host   # http://localhost:8080
```

For mobile GPS testing — push to main; Cloud Run redeploys automatically.

## Docker

```bash
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures
```

## Data

GeoJSON files served from `public/` — see `CLAUDE.md`'s standing instruction for how these figures are kept current (generated from source once the planned `import-new-tiles.js` extension exists; manual until then):

<!-- GEOSHOP-COUNTS:START -->
84,098 features total, 91 GeoShop tile orders processed (55297–56685).

| File | Features | Source |
|---|---|---|
| `public/lk-tram-lk.geojson` | 11,148 | VBZ tram infrastructure (nodes + trasse) |
| `public/lk-water.geojson` | 15,223 | WVZ water pipes + fittings (hydrants excluded) |
| `public/lk-sewage.geojson` | 11,101 | ERZ sewage pipes (manholes excluded) |
| `public/lk-electricity.geojson` | 21,719 | ewz electricity nodes + underground cables |
| `public/lk-telecom.geojson` | 24,374 | ewz telecom nodes + cables (Swisscom + UPC, overhead excluded) |
| `public/lk-fernwaerme.geojson` | 533 | SIA405 district heating pipes |
<!-- GEOSHOP-COUNTS:END -->
| `public/data/processed/route-waypoints.json` | 75 pts | 2,682m route, Stadelhofen → Paradeplatz (legacy — drives tram interpolation, not the free-roam user experience) |

To ingest new GeoShop tile deliveries:
```bash
node scripts/import-new-tiles.js
```

**Provenance:** all infrastructure geodata originates from Stadt Zürich's Open Government Data program (VBZ, WVZ, ERZ, ewz, SIA405 LKMap via GeoShop) and transport.opendata.ch. **Code license:** not yet chosen — no `LICENSE` file exists in this repository yet; open item ahead of any public/open-source release.

## Architecture

```
src/
├── tram-engine.js       # Live tram positions (transport.opendata.ch, 10s poll)
├── proximity-engine.js  # Distance calc for all 6 layers; crossing/alongside detection
└── audio-layers.js      # Web Audio API synthesis for all 6 layers + shared density reverb
```

Key ProximityEngine capabilities: nearest-point-on-segment distance, spatial bounding-box culling, `extendLinesWithMovement()` (crossing + alongside detection for all LineString layers), `nearestSegmentBearing()` (Fernwärme panning), sewage junction clustering.

## Tech stack

- Web Audio API (synthesis, spatial audio, StereoPanner, PannerNode HRTF)
- Leaflet + Swisstopo basemap
- Vite (build)
- Docker + Nginx (containerised deployment)
- Google Cloud Run (hosting)
- transport.opendata.ch (live tram positions)
- Stadt Zürich open data / GeoShop (infrastructure geodata, 88 tile orders)

## Repository

https://github.com/Gombassa/hiddeninfrastructures-zurich
