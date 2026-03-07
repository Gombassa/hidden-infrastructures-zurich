# Invisible Infrastructures: Zurich

**A location-based generative music application that sonifies Zurich's hidden urban infrastructure through spatial audio.**

Walk through District 1 (Altstadt) as your smartphone generates real-time procedural soundscapes driven by five layers of invisible systems: tram electrical network, water supply, sewage, electricity grid, and telecommunications.

---

## Current Status

| Phase | Status |
|-------|--------|
| Phase 0 - Research & Data | Complete |
| Phase 1 - MVP Development | In Progress |

**Last Updated:** March 2026
**Target Launch:** August 2026
**Funding:** Stadt Zürich Digitale Künste: Umsetzung und Präsentation (CHF 14,500)

---

## Documentation

| Document | Description |
|----------|-------------|
| [phase-0-completion.md](phase-0-completion.md) | Phase 0 research summary and data acquisition |
| [phase-1-planning.md](phase-1-planning.md) | Phase 1 MVP objectives, 5-layer audio design, timeline |
| [phase-1.5-improvements.md](phase-1.5-improvements.md) | Post-MVP refinements: geometry-snapping, time-dependent audio |
| [invisible-infrastructures-lean-plan.md](invisible-infrastructures-lean-plan.md) | Full lean project plan with all phases and budget |
| [archive/master-v3.0.md](archive/master-v3.0.md) | Full project specification (reference) |

---

## Quick Links

**Route:** Stadelhofen → Bellevue → Paradeplatz → Rennweg → Bahnhofstrasse/HB (~2.5km, 75 waypoints)

**Infrastructure (Phase 1 MVP - District 1):**
1. **Tram electrical:** 366 power feeders + real-time tram positions (9 lines)
2. **Water supply:** Distribution pipes, pumping stations (WVZ - 1,550 km network)
3. **Sewage:** Main collectors, treatment facilities (ERZ)
4. **Electricity grid:** High-voltage substations, transformers (ewz)
5. **Telecommunications:** Fiber optic nodes, data hubs (ewz)

**Data Sources:**
- [VBZ Infrastruktur OGD](https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd) (tram electrical)
- [WVZ Leitungskataster](https://www.stadt-zuerich.ch/geodaten/download/WVZ_Leitungskataster) (water)
- [ERZ Abwasser-Werkleitungsdaten](https://www.stadt-zuerich.ch/geodaten/download/ERZ_Abwasser_Werkleitungsdaten) (sewage)
- [ewz Werkleitungsdaten](https://www.stadt-zuerich.ch/geodaten/download/EWZ_Werkleitungsdaten_Elektrizitaet_und_Telekommunikation) (electricity & telecom)
- [transport.opendata.ch](https://transport.opendata.ch) (real-time tram positions)

---

## Repository Structure

```
├── docs/              Documentation
│   ├── archive/       Historical versions
├── data/
│   ├── raw/           Original VBZ infrastructure GeoJSON
│   └── processed/     Substations, route waypoints, generated maps
├── scripts/           One-time data processing (Node.js)
├── prototypes/
│   ├── 01-audio-sketches/   WebPd patch tests (feeder event, substation drone)
│   ├── 02-tram-engine/      TramEngine + ProximityEngine live dashboard
│   └── 04-listener/         ListenerEngine walking simulation + Leaflet map
├── src/
│   ├── tram-engine.js       Live tram positions (transport.opendata.ch API)
│   ├── proximity-engine.js  Tram ↔ infrastructure distance calculations
│   └── listener-engine.js   Simulated walker along route (swaps to GPS in production)
└── tests/             Python analysis scripts (stdlib only)
```

---

## Engine Modules (src/)

Three ES module singletons — no DOM dependencies, serve from project root via `npx http-server . -p 8080`.

| Module | Status | Description |
|--------|--------|-------------|
| `tram-engine.js` | Working | Polls transport.opendata.ch every 10s, interpolates tram positions |
| `proximity-engine.js` | Working | Loads GeoJSON, computes proximity-based audio parameters |
| `listener-engine.js` | Working | Simulates walker along 75 waypoints at 5 km/h, 1s tick |

---

## Audio Layers (Phase 1 MVP)

**Infrastructure soundscapes (procedurally generated):**

| Layer | Source | Sound |
|-------|--------|-------|
| Tram electrical | 366 feeders + live tram API | Feeder crackle, electrical transients |
| Water supply | WVZ static geodata | Hydraulic pulse, flow textures, pump rhythms |
| Sewage | ERZ static geodata | Deep bass churn, underground rumble |
| Electricity grid | ewz static geodata | Harmonic screaming, transformer hum |
| Telecommunications | ewz static geodata | Data chirps, fiber whispers |

Plus: **District 1 musical theme** — procedurally-generated electronic ambient that infrastructure sounds perform atop.

---

## Tech Stack

- **Audio Synthesis:** WebPd (Pure Data patches compiled to WebAssembly)
- **Spatial Audio:** Three.js PositionalAudio + Web Audio API
- **Mapping:** Leaflet
- **Platform:** Progressive Web App (Vanilla JS ES modules)
- **Hosting:** Hetzner Cloud (renewable energy) + Cloudflare CDN
- **Privacy:** Zero personal data collection, GPS processed entirely on-device

---

## Audio Prototypes

Two Pd patches compiled and running in browser via WebPd:

| Patch | Description | Test Page |
|-------|-------------|-----------|
| Substation Drone | 50 Hz hum with harmonics, tram-modulated pulsing | `substation-drone-test.html` |
| Feeder Event | Triggered percussive tone with pitch envelope | `webpd-test.html` |
| Both Combined | Dual-patch test with independent mute controls | `dual-patch-test.html` |

Serve locally: `npx http-server . -p 8080`
Then open: `http://127.0.0.1:8080/prototypes/01-audio-sketches/dual-patch-test.html`
