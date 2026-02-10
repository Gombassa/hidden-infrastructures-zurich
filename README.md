# Invisible Infrastructures: Zurich

An immersive audio walk that sonifies Zurich's tram electrical network, making the invisible 600V DC power grid audible through spatial audio.

## 🎯 Project Status

**Phase:** 1 - Prototyping  
**Week:** 1 of 40  
**Current Focus:** Development environment setup & initial prototypes

## 📍 Route

Stadelhofen Bahnhof → Bahnhofstrasse 45  
- 1,689 overhead wire segments
- 258 support poles
- 366 power feeders
- ~2.5km walking distance

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

- **VBZ Infrastruktur OGD**: Zurich tram electrical infrastructure
  - Source: https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd
  - License: Open Government Data
  - Update: Weekly
  - **Route data files:**
    - `route-tram-powerlines.geojson` - 1,689 overhead wire segments
    - `route-tram-masts.geojson` - 258 support poles
    - `route-tram-feeders.geojson` - 366 power feeders
    - `route-buildings.geojson` - Buildings along route
    
## 🔧 Engine Modules

Three ES module singletons power the runtime:

- **TramEngine** — polls `transport.opendata.ch` every 10s, interpolates tram positions between stops
- **ProximityEngine** — loads 71 substations + 366 feeders, computes `tramCount`/`nearestTramDist` per substation and feeder trigger events (30m radius)
- **ListenerEngine** — walks 75 waypoints (2,682m) extracted from powerline geometry at 5 km/h with 1s tick

```bash
# Serve from project root (ES module imports need it)
npx http-server . -p 8080

# Test pages:
# http://127.0.0.1:8080/prototypes/02-tram-engine/tram-engine-test.html
# http://127.0.0.1:8080/prototypes/04-listener/listener-test.html
```

## 🛠️ Tech Stack

- **Spatial Audio**: Three.js + Tone.js + WebPd (Pure Data → WASM)
- **Mapping**: Leaflet
- **Audio Engine**: Web Audio API + AudioWorklet
- **Framework**: Vanilla JS ES modules + PWA
- **Hosting**: Firebase

## 📝 License

[TBD - likely CC BY-NC-SA 4.0]

## 👤 Author

Robin - Audio engineer & sound designer based in Zurich

---

*Detailed project documentation: [docs/project-master.md](docs/project-master.md)*