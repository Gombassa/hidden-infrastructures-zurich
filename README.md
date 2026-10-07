# Hidden Infrastructures: Zürich

Location-aware generative audio Progressive Web App that sonifies Zürich's
urban infrastructure as users move through the downtown District 1 area. All audio procedurally
generated via Web Audio API. No samples or pre-rendered assets. 

**Live:** https://hidden-infrastructures-zurich-50944718104.europe-west2.run.app/

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

All synthesis *shipped in production* is direct Web Audio API code — no Max/MSP, no RNBO, no compiled WASM patches; this is the confirmed production path, not a placeholder pending a native-audio toolchain. Each of the 24 sonic behaviours across the six layers (proximity pulses, crossing transients, alongside loops, oscillator/burst pools, continuous drones) is built as a self-contained instrument module (`src/instruments/*.js`) with a paired HTML control surface for hands-on sound design and MIDI-driven auditioning — Phase 3 is **complete**: the interface contract (Option A, ratified Step 1), all 24 behaviours across all six layers (Steps 2–7), and reintegration (Step 8) are all done. `index.html` runs on the new orchestrator, `src/instrument-layers.js`, in production — `step-8-reintegration` merged to `main` on 2026-10-02 after two field-walk rounds found and fixed real issues (electricity read too loud, trimmed -9dB; audio glitched riding a tram, fixed with a claim-rate throttle in the tram-hiss pool), both confirmed clean before merging. The original `src/audio-layers.js` is superseded; kept rather than deleted, it has moved to `Archive/audio-layers.js` as a field-tested reference. The District 1 musical theme remains a separate, not-yet-started workstream (Step 9). See `docs/Technical_Architecture_v5.md` for the interface contract writeup and `docs/Implementation_Plan.md` for the build plan. `max/` holds archived Max for Live specifications retained as sonic reference — not part of the current toolchain.

**Since Step 8 (2026-10-02/03):** `tram-drone.js`'s own private reverb was removed — the shared density reverb bus is now the only reverb in the app. A per-layer mixer strip (mute, 0–1 fader, live meter per layer) replaced the old on/off toggles, and each layer's fader now carries a fixed, *measured* calibration trim (tram -21.3dB, water +7.5dB peak-matched, sewage +4.0dB, electricity 0.0dB reference at the time, telecom -7.3dB, fernwaerme -10.7dB — electricity's value has since changed, see below) — every layer bus and the reverb output feed a master makeup-gain (+12dB) then a limiter (`DynamicsCompressorNode`) before destination, instead of connecting to it directly. A "Simulate Walk" toggle can drive the whole app from a randomised walker (`src/sim-walker.js`) along a street-like graph built from water-pipe geometry, for testing away from Zürich. The mute fix and GPS re-subscribe fix (2026-10-06) are confirmed working onsite; the trims, limiter and simulated-walk specifics are still to be confirmed. The dev-only measurement tool these trims came from (`calibrate-layers.html`) lives on its own `feature/layer-calibration` branch, deliberately not merged.

**Since 2026-10-07:** electricity's mixer trim was cut a further -6dB by ear. Telecom's node-triggered sounds (chirp, dwell handshake) — previously fixed-gain anywhere within a flat 40m trigger radius — now fade in over a narrower 25m radius with a sharper (squared) proximity curve, and their peak gain is cut a further -9dB. A rotary master-volume knob sits next to the Listener Position readout, dragged with mouse/touch or nudged with arrow keys, wired as a final output-level stage after the limiter. The "Trams within 150m"/"Nearest Feeder Dist" readouts and the Hiss Voice Instrument link are both gone from the main page. All deployed and confirmed live on Cloud Run, not yet confirmed by ear.

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

GeoJSON files served from `public/` — figures below are regenerated by `scripts/generate-counts.js` (see `CLAUDE.md`'s standing instruction), run automatically at the end of `import-new-tiles.js` and `extract-lk-geojson.js`:

<!-- COUNTS:BEGIN -->
| File | Total features | By geomType | Size |
|---|---|---|---|
| `lk-sewage.geojson` | 20,855 | pipe: 20,855 | 8.89 MB (8,886,835 B) |
| `lk-electricity.geojson` | 40,660 | cable: 29,630, node: 11,030 | 17.64 MB (17,643,611 B) |
| `lk-water.geojson` | 31,953 | pipe: 22,788, fitting: 9,165 | 12.43 MB (12,430,835 B) |
| `lk-tram-lk.geojson` | 15,620 | trasse: 9,934, node: 3,291, area: 2,395 | 7.60 MB (7,602,071 B) |
| `lk-telecom.geojson` | 51,990 | cable: 40,170, node: 8,178, area: 3,642 | 23.91 MB (23,914,120 B) |
| `lk-fernwaerme.geojson` | 898 | pipe: 898 | 471.9 KB (471,881 B) |

**134 GeoShop orders processed** (55297–57521) · **161,976 total features** across 6 files · **70.95 MB (70,949,353 B)** served.

*Generated by `scripts/generate-counts.js` from `data/processed/.processed-orders.json` and `public/lk-*.geojson` — do not hand-edit the content between the markers above and below.*
<!-- COUNTS:END -->

`public/data/processed/route-waypoints.json` — 75 pts, 2,682m route, Stadelhofen → Paradeplatz (legacy — drives tram interpolation, not the free-roam user experience).

To ingest new GeoShop tile deliveries:
```bash
node scripts/import-new-tiles.js
```

**Provenance:** all infrastructure geodata originates from Stadt Zürich's Open Government Data program (VBZ, WVZ, ERZ, ewz, SIA405 LKMap via GeoShop) and transport.opendata.ch. **Code license:** All rights reserved — see `LICENSE`. No open-source licence is granted; use, copying, modification, or distribution requires the copyright holder's express written permission.

## Architecture

```
src/
├── tram-engine.js         # Live tram positions (transport.opendata.ch, 10s poll)
├── proximity-engine.js    # Distance calc for all 6 layers; crossing/alongside detection
├── instrument-layers.js   # Orchestrates src/instruments/*.js — what index.html runs on in production
├── sim-walker.js          # Randomised simulated walk ("Simulate Walk" toggle) for testing away from Zürich
└── instruments/           # One self-contained class per sonic behaviour (24 total)
```

`Archive/audio-layers.js` — original monolithic synthesis, superseded; kept (not deleted) as a reference, imported directly by `ab-compare.html`.

Key ProximityEngine capabilities: nearest-point-on-segment distance, spatial bounding-box culling, `extendLinesWithMovement()` (crossing + alongside detection for all LineString layers), `nearestSegmentBearing()` (Fernwärme panning), sewage junction clustering.

## Tech stack

- Web Audio API (synthesis, spatial audio, StereoPanner, PannerNode HRTF)
- Leaflet + Swisstopo basemap
- Vite (build)
- Docker + Nginx (containerised deployment)
- Google Cloud Run (hosting)
- transport.opendata.ch (live tram positions)
- Stadt Zürich open data / GeoShop (infrastructure geodata — see the counts table above for the current order count, which grows with each ingestion)

## Repository

https://github.com/Gombassa/hiddeninfrastructures-zurich
