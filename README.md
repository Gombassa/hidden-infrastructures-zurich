# Hidden Infrastructures: Zurich

A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio. Walk freely through District 1 (Altstadt) as your smartphone generates real-time procedural soundscapes driven by six audio layers: five invisible infrastructure systems and a procedural District 1 musical theme. All audio is generated through real-time procedural synthesis; the application contains no samples or pre-rendered audio assets.

The app collects zero personal data. GPS coordinates are processed entirely on-device and never transmitted. No user accounts, no analytics, no tracking.

## Project Status

**Phase:** MVP Development - District 1 (Postal Code 8001)  
**Timeline:** March-August 2026  
**Target Launch:** August 2026  
**Current Focus:** Engine integration + spatial audio

**Funding:** Applied — Stadt Zürich Digitale Künste: Umsetzung und Präsentation (CHF 13,200, pending)

## Route & Geography

**Phase 0-1:** Prototype route — Stadelhofen → Bellevue → Paradeplatz → Rennweg → Bahnhofstrasse/HB → Bürkliplatz (2.7km, 75 waypoints)  
**Phase 3+:** Free-roam GPS exploration across all of District 1 (postal code 8001)

## Infrastructure Layers

1. **Tram electrical:** 366 power feeders + real-time tram positions (VBZ geodata + transport.opendata.ch API)
2. **Water supply:** Distribution pipes, pumping stations (WVZ Leitungskataster — 1,550 km network)
3. **Sewage:** Main collectors, treatment facilities (ERZ Abwasser-Werkleitungsdaten)
4. **Electricity grid:** High-voltage substations, distribution transformers (ewz Werkleitungsdaten)
5. **Telecommunications:** Fiber optic nodes, data infrastructure (ewz Telecom)
6. **District 1 musical theme:** Procedural electronic ambient reflecting Altstadt character

## Development Phases

**Phase 0 (March):** Tram demo on prototype route — spatial audio + GPS integration, proof-of-concept video  
**Phase 1 (March-April):** Docker build environment, GCP hosting, tram layer to production quality  
**Phase 2 (April):** Add water, sewage, electricity, telecom layers on prototype route  
**Phase 3 (May):** Expand to full District 1 free-roam + production sound design  
**Phase 4 (June-August):** UI, PWA deployment, user testing, public launch

## Repository Structure
```
├── docs/               - Project documentation
├── data/
│   ├── raw/            - Original VBZ infrastructure GeoJSON
│   └── processed/      - Substations, route waypoints, maps
├── scripts/            - Data processing (route extraction)
├── src/
│   ├── tram-engine.js       - Live tram positions (transport.opendata.ch API)
│   ├── proximity-engine.js  - Tram ↔ infrastructure distance calculations
│   └── listener-engine.js   - Simulated walker along route
├── prototypes/
│   ├── 01-audio-sketches/   - WebPd patch tests (Pure Data → WASM)
│   ├── 02-tram-engine/      - TramEngine + ProximityEngine dashboard
│   └── 04-listener/         - ListenerEngine walking simulation + Leaflet map
└── tests/              - Python analysis scripts
```

## Data Sources

**Stadt Zürich Open Data:**
- **VBZ Infrastruktur OGD** (Tram electrical): https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd
- **WVZ Leitungskataster** (Water supply): https://www.stadt-zuerich.ch/geodaten/download/WVZ_Leitungskataster
- **ERZ Abwasser-Werkleitungsdaten** (Sewage): https://www.stadt-zuerich.ch/geodaten/download/ERZ_Abwasser_Werkleitungsdaten
- **ewz Werkleitungsdaten** (Electricity & Telecom): https://www.stadt-zuerich.ch/geodaten/download/EWZ_Werkleitungsdaten_Elektrizitaet_und_Telekommunikation

**Real-Time Data:**
- **transport.opendata.ch API**: Live tram positions and delays
- License: Open Government Data (CC BY 4.0)

## Engine Modules

Three ES module singletons power the runtime:

- **TramEngine** (`src/tram-engine.js`) — Polls `transport.opendata.ch` every 10s, interpolates tram positions between stops
- **ProximityEngine** (`src/proximity-engine.js`) — Loads infrastructure geodata, computes proximity-based audio parameters
- **ListenerEngine** (`src/listener-engine.js`) — Simulates walker along 75 waypoints (2,682m) at 5 km/h; uses device GPS in production

**Integration Status:**
- ✅ TramEngine: Live API integration functional
- ✅ ProximityEngine: Feeder proximity detection working  
- ✅ ListenerEngine: Route simulation complete
- ⏳ Infrastructure API integration: Water, sewage, electricity, telecom layers pending
- ⏳ Spatial audio system: Three.js PositionalAudio integration in progress
- ⏳ WebPd/WASM audio: Dual-patch test functional, multi-layer mixing pending

```bash
# Serve from project root (ES module imports need it)
npx http-server . -p 8080

# Test pages:
# http://127.0.0.1:8080/prototypes/02-tram-engine/tram-engine-test.html
# http://127.0.0.1:8080/prototypes/04-listener/listener-test.html
# http://127.0.0.1:8080/prototypes/01-audio-sketches/dual-patch-test.html
```

## Tech Stack

- **Audio Synthesis**: WebPd (Pure Data → WebAssembly) — procedural sound generation
- **Spatial Audio**: Three.js PositionalAudio + Web Audio API
- **Data Integration**: Stadt Zürich Open Data APIs (5 infrastructure types)
- **Framework**: Progressive Web App (PWA) — Vanilla JS ES modules
- **Containerisation**: Docker multi-stage build (WebPd compilation + Nginx)
- **Hosting**: Google Cloud Platform (Cloud Run / Compute Engine), Cloudflare CDN
- **Privacy**: Zero personal data collection, GPS processed entirely on-device

## Walk Recording & Score Archive

Users may optionally record the audio output of their walk (client-side via MediaRecorder API) or share the "score" of their walk — a timestamped JSON of parameter and control data sent to the synthesis engine. Scores contain no GPS coordinates or device information and cannot reconstruct the user's physical path. A web-based playback page regenerates the audio from any archived score using the same WebPd patches.

## License

Code: MIT License (open source)  
Artistic Content: CC BY-NC-SA 4.0  
Data: Stadt Zürich Open Government Data (CC BY 4.0)

## Author

**Robin Pender** — Sound designer, electro-acoustic composer, and audio engineer  
MSc Sound Design | 20+ years broadcast/spatial audio experience  
Based in Zurich since 2020

**Contact:** robinpender23@gmail.com  
**GitHub:** https://github.com/Gombassa/hiddeninfrastructures-zurich  
**Funding applied:** Stadt Zürich Digitale Künste: Umsetzung und Präsentation
