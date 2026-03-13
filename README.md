# Invisible Infrastructures: Zurich

A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio. Walk through District 1 (Altstadt) as your smartphone generates real-time procedural soundscapes driven by five layers of invisible systems: tram electrical network, water supply, sewage, electricity grid, and telecommunications.

## 🎯 Project Status

**Phase:** Concept Development - District 1 (Postal Code 8001)  
**Concept Phase:** March–June 2026  
**Production Phase:** July–December 2026  
**Target Launch:** December 2026  
**Current Focus:** Engine integration + spatial audio + proof-of-concept demo

**Funding:** Stadt Zürich Digitale Künste: Ideenfindung und Konzeptentwicklung (CHF 9,000)

## 📍 Route

**Phase 1 MVP:** Stadelhofen → Paradeplatz (District 1 - Altstadt)  
- Distance: ~2.5km walking
- 75 waypoints extracted from infrastructure geometry
- Wheelchair accessible (flat terrain, Bahnhofstrasse)

## 🏗️ Infrastructure Layers

**Phase 1 (District 1):**
1. **Tram electrical:** 366 power feeders + real-time tram positions
2. **Water supply:** Distribution pipes, pumping stations (WVZ - 1,550 km network)
3. **Sewage:** Main collectors, treatment facilities (ERZ)
4. **Electricity grid:** High-voltage substations, transformers (ewz)
5. **Telecommunications:** Fiber optic nodes, data hubs (ewz)

**Future Expansion (Districts 2-6, 2027-2030):**
- Same 5 infrastructure layers per district
- Unique musical theme per district
- Collaborative model with local sound artists

## 🗂️ Repository Structure
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

## 📊 Data Sources

**Stadt Zürich Open Data:**
- **VBZ Infrastruktur OGD** (Tram electrical): https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd
  - `route-tram-feeders.geojson` - 366 power feeders
  - `route-tram-powerlines.geojson` - Overhead wire reference
- **WVZ Leitungskataster** (Water supply): https://www.stadt-zuerich.ch/geodaten/download/WVZ_Leitungskataster
  - Distribution pipes, pumping stations (1,550 km network)
- **ERZ Abwasser-Werkleitungsdaten** (Sewage): https://www.stadt-zuerich.ch/geodaten/download/ERZ_Abwasser_Werkleitungsdaten
  - Main collectors, treatment facilities
- **ewz Werkleitungsdaten** (Electricity & Telecom): https://www.stadt-zuerich.ch/geodaten/download/EWZ_Werkleitungsdaten_Elektrizitaet_und_Telekommunikation
  - High-voltage substations, distribution transformers, fiber optic nodes

**Real-Time Data:**
- **transport.opendata.ch API**: Live tram positions and delays
- License: Open Government Data (CC BY 4.0)
- Update frequency: Real-time for trams, weekly for geodata
    
## 🔧 Engine Modules

Three ES module singletons power the runtime:

- **TramEngine** (`src/tram-engine.js`) - Polls `transport.opendata.ch` every 10s, interpolates tram positions between stops
- **ProximityEngine** (`src/proximity-engine.js`) - Loads infrastructure geodata (feeders, water, sewage, electricity, telecom), computes proximity-based audio parameters
- **ListenerEngine** (`src/listener-engine.js`) - Simulates walker along 75 waypoints (2,682m route) at 5 km/h with 1s tick, uses device GPS in production

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

## 🛠️ Tech Stack

- **Audio Synthesis**: WebPd (Pure Data → WebAssembly) - procedural sound generation
- **Spatial Audio**: Three.js PositionalAudio + Web Audio API
- **Data Integration**: Stadt Zürich Open Data APIs (5 infrastructure types)
- **Framework**: Progressive Web App (PWA) - Vanilla JS ES modules
- **Privacy**: Zero personal data collection, GPS processed entirely on-device
- **Hosting**: Hetzner Cloud (renewable energy), Cloudflare CDN

## 🎨 Project Vision

**Concept Phase (March–June 2026):** Prototype route, five layers, proof-of-concept video  
**Production Phase (July–December 2026):** Full District 1, production sound design, PWA, public launch  
**Phases 2-6 (2027-2030):** Expand to Districts 2-6 with unique musical themes  
**Collaborative Model:** Local sound artists contribute procedural elements per district  
**Open Source:** PWA architecture and synthesis code publicly available

**Artistic Goals:**
- Celebrate (not critique) Zurich's invisible infrastructure
- Radical accessibility - no app store, no account, no barriers
- Audio-first methodology - eyes free to observe environment
- Infinite variation through procedural generation

## 📝 License

Code: MIT License (open source)  
Artistic Content: CC BY-NC-SA 4.0  
Data: Stadt Zürich Open Government Data (CC BY 4.0)

## 👤 Author

**Robin Pender** - Sound designer, electro-acoustic composer, and audio engineer  
MSc Sound Design | 20+ years broadcast/spatial audio experience  
Based in Zurich since 2020

**Contact:** robinpender23@gmail.com  
**GitHub:** https://github.com/Gombassa/invisible-infrastructures-zurich  
**Funding:** Stadt Zürich Digitale Künste: Ideenfindung und Konzeptentwicklung

---

*Full project documentation: [docs/invisible-infrastructures-zurich-master.md](docs/invisible-infrastructures-zurich-master.md)*  
*Funding application: [Stadt Zürich Kulturförderung](https://www.stadt-zuerich.ch/kultur/de/index/foerderung.html)*
