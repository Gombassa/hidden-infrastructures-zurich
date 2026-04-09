# Hidden Infrastructures: Zürich

Location-aware generative audio Progressive Web App that sonifies Zürich's
urban infrastructure as users move through District 1. All audio procedurally
generated via Web Audio API. No samples or pre-rendered assets.

## Current Status
Phase 1 in progress. Core tram electrical layer working in the field:
- Feeder hiss: proximity-scaled continuous texture (6-node comb-filter pool)
- Feeder crackle: debounced one-shot event on tram+listener proximity
- Drone: powerline proximity fade (20m→5m)
- Live GPS tracking via browser geolocation API
- Real-time tram positions via transport.opendata.ch

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
GeoJSON files served from public/data/:
- public/data/processed/substations.geojson
- public/data/raw/route-tram-feeders.geojson
- public/data/raw/route-tram-powerlines.geojson

## Tech stack
- Web Audio API (synthesis, spatial audio)
- Leaflet (mapping)
- Vite (build)
- Docker + Nginx (containerised deployment)
- transport.opendata.ch (live tram positions)
- Stadt Zürich open data (VBZ infrastructure GeoJSON)

## Repository
https://github.com/Gombassa/hiddeninfrastructures-zurich
