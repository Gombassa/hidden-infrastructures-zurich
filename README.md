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
├── docs/           - Project documentation
├── data/           - GeoJSON data from VBZ
│   ├── raw/        - Original VBZ infrastructure data
│   └── processed/  - Cleaned/optimized data for app
├── prototypes/     - Early audio/spatial tests
├── src/            - Main application code
│   ├── css/
│   ├── js/
│   └── assets/
└── tests/          - Testing scripts
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
    
## 🛠️ Tech Stack (Planned)

- **Spatial Audio**: Three.js + Tone.js
- **Mapping**: Leaflet
- **Audio Engine**: Web Audio API
- **Framework**: Vanilla JS + PWA
- **Hosting**: Firebase

## 📝 License

[TBD - likely CC BY-NC-SA 4.0]

## 👤 Author

Robin - Audio engineer & sound designer based in Zurich

---

*Detailed project documentation: [docs/project-master.md](docs/project-master.md)*
```

Save the file (Ctrl+S).

## Step 6: Update .gitignore

Open `.gitignore` and add these lines at the **bottom** of the file:
```
# Audio files (large)
*.wav
*.aif
*.aiff
*.flac
*.mp3
*.ogg
*.m4a

# Data exports (keep only processed versions)
data/raw/*.kml
data/raw/*.shp
data/raw/*.zip

# Environment variables
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build outputs
dist/
build/
.cache/