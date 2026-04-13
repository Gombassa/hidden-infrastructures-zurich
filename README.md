# Hidden Infrastructures: Zürich

Location-aware generative audio Progressive Web App that sonifies Zürich's
urban infrastructure as users move through District 1. All audio procedurally
generated via Web Audio API. No samples or pre-rendered assets.

## Current Status
Phase 1/2 complete. All 6 infrastructure layers working:
- Tram electrical: feeder crackle (HRTF spatial), comb-filtered hiss pool, powerline drone
- Water: bandpass noise pulse on proximity entry
- Sewage: continuous lowpass rumble, distance-modulated
- Electricity: sawtooth oscillator pool (1500Hz)
- Telecom: chirp on node entry + highpass cable texture
- Fernwärme: 60Hz sine + 0.3Hz tremolo

All audio layers are discrete modules in `src/audio-layers.js` with per-layer toggle buttons in the UI.
Live GPS tracking via browser geolocation API. Real-time tram positions via transport.opendata.ch.

## Running locally
See STARTUP.md for full instructions.

Quick start:
```
npx vite --host
```

For mobile GPS testing (requires Cloudflare account):
```
npx cloudflared tunnel --url http://localhost:8080
```

## Docker
```
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures
```

## Data
GeoJSON files served from `public/`:
- `public/lk-tram-lk.geojson` — VBZ tram infrastructure (nodes + trasse)
- `public/lk-water.geojson` — WVZ water pipes + fittings
- `public/lk-sewage.geojson` — ERZ sewage pipes
- `public/lk-electricity.geojson` — ewz electricity nodes + cables
- `public/lk-telecom.geojson` — ewz telecom nodes + cables (Swisscom + UPC)
- `public/lk-fernwaerme.geojson` — district heating pipes
- `public/data/processed/route-waypoints.json` — 75 waypoints, 2,682m route

## Tech stack
- Web Audio API (synthesis, spatial audio)
- Leaflet (mapping)
- Vite (build)
- Docker + Nginx (containerised deployment)
- transport.opendata.ch (live tram positions)
- Stadt Zürich open data (VBZ infrastructure GeoJSON)

## Repository
https://github.com/Gombassa/hiddeninfrastructures-zurich
