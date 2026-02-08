# Invisible Infrastructures: Zurich

**An immersive audio walk that makes Zurich's tram power network audible through spatial sound design.**

> "Listen to the city's electric pulse"

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase 0 - Research | Complete |
| Phase 1 - Prototyping | In Progress |

**Last Updated:** February 8, 2026

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
├── prototypes/
│   └── 01-audio-sketches/
│       ├── *.pd               Pure Data patches (desktop)
│       ├── *-web.pd           WebPd-compatible versions
│       ├── *-app/             Compiled WASM + runtime
│       ├── *-test.html        Single-patch test pages
│       └── dual-patch-test.html  Both patches together
├── src/               Application code
└── tests/             Analysis scripts
```

---

## Tech Stack

- **Spatial Audio:** Three.js + Web Audio API
- **Synthesis:** WebPd (Pure Data patches compiled to WASM)
- **Mapping:** Leaflet
- **Platform:** Progressive Web App
- **Hosting:** Firebase

## Audio Prototypes

Two Pd patches compiled and running in browser via WebPd:

| Patch | Description | Test Page |
|-------|-------------|-----------|
| Substation Drone | 50 Hz hum with harmonics, tram-modulated pulsing | `substation-drone-test.html` |
| Feeder Event | Triggered percussive tone with pitch envelope | `webpd-test.html` |
| Both Combined | Dual-patch test with independent mute controls | `dual-patch-test.html` |

Serve locally: `npx http-server prototypes/01-audio-sketches`
