# Invisible Infrastructures: Zurich

**An immersive audio walk that makes Zurich's tram power network audible through spatial sound design.**

> "Listen to the city's electric pulse"

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase 0 - Research | Complete |
| Phase 1 - Prototyping | Ready to Start |

**Last Updated:** February 1, 2026

---

## Documentation

| Document | Description |
|----------|-------------|
| [phase-0-completion.md](phase-0-completion.md) | Phase 0 research summary and achievements |
| [phase-1-planning.md](phase-1-planning.md) | Phase 1 objectives, route walk checklist, prototyping approach |
| [phase-1.5-improvements.md](phase-1.5-improvements.md) | Post-MVP refinements: geometry-snapping, time-dependent audio |
| [archive/master-v3.0.md](archive/master-v3.0.md) | Full project specification (reference) |

---

## Quick Links

**Route:** Stadelhofen Bahnhof → Bahnhofstrasse 45 (~2.5km)

**Infrastructure:**
- 1,689 overhead wire segments
- 258 support poles
- 366 power feeders
- 71 substations
- 9 tram lines

**Data Source:** [VBZ Infrastruktur OGD](https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd)

---

## Repository Structure

```
├── docs/              Documentation
│   ├── archive/       Historical versions
├── data/
│   ├── raw/           Original VBZ data
│   └── processed/     GeoJSON for app
├── prototypes/        Audio/spatial tests
├── src/               Application code
└── tests/             Analysis scripts
```

---

## Tech Stack

- **Spatial Audio:** Three.js + Web Audio API
- **Synthesis:** Tone.js / WebPd
- **Mapping:** Leaflet
- **Platform:** Progressive Web App
- **Hosting:** Firebase
