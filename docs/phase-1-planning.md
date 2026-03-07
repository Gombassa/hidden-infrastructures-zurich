# Phase 1 Planning

**Timeline:** March–August 2026
**Goal:** Working MVP of District 1 (Postal Code 8001) with all five infrastructure layers sonified

**Concept:** Make Zurich's hidden infrastructure audible. Walk through Altstadt and hear five invisible systems — tram electrical, water supply, sewage, electricity grid, and telecommunications — as layered spatial soundscapes.

---

## What's Already Complete (Phase 0)

### Core Engine Modules (src/)

| Module | Lines | Status |
|--------|-------|--------|
| `tram-engine.js` | ~180 | Working — live tram positions from transport.opendata.ch |
| `proximity-engine.js` | ~125 | Working — feeder proximity detection, substation density |
| `listener-engine.js` | ~193 | Working — route simulation, ready for GPS swap |

### Data Layer

| Data | Count | Source |
|------|-------|--------|
| Overhead wire segments | 1,689 | VBZ OGD |
| Support poles | 258 | VBZ OGD |
| Power feeders | 366 | VBZ OGD |
| Inferred substations | 71 | Clustering analysis |
| Route waypoints | 75 (2,682m) | Extracted via A* + arc-length sampling |

### API & Pipeline

- **9 tram lines** serving route: 2, 4, 7, 8, 9, 10, 11, 13, 15
- Real-time positions confirmed working (transport.opendata.ch)
- WebPd compilation pipeline validated (Pd → WASM → browser)
- Dual-patch browser test functional

---

## Infrastructure Data (Pending Download - April)

| Layer | Source | Data |
|-------|--------|------|
| Water supply | WVZ Leitungskataster | Distribution pipes, pumping stations (1,550 km network) |
| Sewage | ERZ Abwasser-Werkleitungsdaten | Main collectors, treatment facilities |
| Electricity grid | ewz Werkleitungsdaten | Substations, distribution transformers |
| Telecommunications | ewz Werkleitungsdaten | Fiber optic nodes, data hubs |

Processing approach: adapt `scripts/extract-route-waypoints.js` algorithms (graph building, haversine distance, arc-length sampling) for each new infrastructure type.

---

## Audio Design Objectives (MVP Scope)

### Layer 1: Tram Electrical

- **Source:** 366 power feeders + real-time tram positions (TramEngine)
- **Sound:** Feeder crackle when trams draw power, electrical transients
- **Trigger:** Tram within 30m of feeder → percussive electrical event
- **Continuous:** Substation transformer drone (50 Hz hum, intensity from tram density)

### Layer 2: Water Supply

- **Source:** WVZ distribution pipes, pumping stations (District 1 subset)
- **Sound:** Hydraulic pulse, flow textures, pumping station rhythms
- **Proximity radius:** ~100m for main pipes
- **Trigger:** Proximity to pipe → sustained flow texture; pump stations → rhythmic pulse

### Layer 3: Sewage

- **Source:** ERZ main collectors, treatment facilities (District 1 subset)
- **Sound:** Deep bass churn, underground rumble, treatment facility processes
- **Proximity radius:** ~150m for deep collectors (depth modulates character)
- **Trigger:** Proximity to collector → bass drone; treatment points → rhythmic processing sounds

### Layer 4: Electricity Grid

- **Source:** ewz substations, distribution transformers
- **Sound:** High-frequency harmonic screaming, transformer hum, voltage fluctuations
- **Proximity radii:** 200m for HV substations, 50m for distribution transformers
- **Trigger:** Proximity → harmonic drone modulated by voltage level attribute

### Layer 5: Telecommunications

- **Source:** ewz fiber optic nodes, data hubs
- **Sound:** Data chirps, fiber optic whispers, bandwidth pulses
- **Proximity radius:** ~100m for fiber nodes
- **Trigger:** Proximity → stochastic data chirp texture

### District 1 Musical Theme

- Procedurally-generated electronic ambient as foundation
- Reflects Altstadt character (historic center, layered history)
- Infrastructure sounds "perform" atop this continuous theme

---

## Phase 1 Timeline

| Month | Focus |
|-------|-------|
| March | Engine integration, spatial audio proof-of-concept, GPS integration |
| April | Water, sewage, electricity, telecom data download + ProximityEngine integration |
| May | Geographic expansion to full District 1, production sound design |
| June–July | PWA, UI, service worker, user testing |
| August | Beta testing, launch event, public release |

---

## Prototyping Approach

### March: Tram Network Integration
- Wire TramEngine → ProximityEngine → Three.js PositionalAudio
- Replace ListenerEngine simulation with device GPS + DeviceOrientation API
- Test on physical route (Stadelhofen → Bahnhofstrasse)
- Record demo video for funding application

### April: Infrastructure Expansion (on prototype route)
- Download WVZ, ERZ, ewz geodata for District 1
- Adapt extraction scripts for each infrastructure type
- Update ProximityEngine for all 5 layers
- Basic placeholder Pure Data patches per layer

### May: District 1 Full Scale + Sound Design
- Scale extraction scripts from route-buffer to full postal code 8001
- Implement spatial culling for ~4,000–5,000 infrastructure elements
- Free-roam GPS (remove fixed route constraint)
- Production-quality sound design for all 6 layers (5 infrastructure + theme)

### June–August: PWA & Launch
- Service worker, Web App Manifest (offline capability)
- Minimal UI (audio-first: layer toggles, battery indicator)
- User testing (15+ participants on District 1)
- Public launch event

---

## Route Stops

1. Stadelhofen
2. Opernhaus
3. Bellevue
4. Paradeplatz
5. Rennweg
6. Bahnhofstrasse/HB
7. Bürkliplatz (loop back to start)

Note: Route genuinely retraces Bahnhofstrasse (north to HB, then south to Bürkliplatz) — correct walk topology for the audio experience.

---

## Known Limitations

### Substation Locations Are Inferred
- VBZ publishes feeder cables but NOT substation points
- 71 locations derived from feeder endpoint clustering (15m radius)
- This is intentional on VBZ's part (security/operational reasons)
- Conceptually strengthens the project: we're revealing truly invisible infrastructure

### Static Infrastructure Data
- Water/sewage/electricity/telecom layers use static geodata snapshots
- Only tram positions update in real-time
- No real-time flow/usage data available for other layers

### Straight-Line Tram Interpolation
- Current: linear interpolation between stop GPS coordinates
- Actual tracks are curved — offset ±10–20m
- Mitigation: 30m trigger radius covers the error budget
- Phase 1.5 improvement: geometry-snap to powerline curves (see `phase-1.5-improvements.md`)

---

## Physical Route Walk Checklist

**Purpose:** Validate digital data against physical reality

### At Each Stop
- [ ] Confirm tram lines match data
- [ ] Look for hidden infrastructure (electrical doors, pump housings, junction boxes)
- [ ] Note acoustic environment (ambient noise level, reverb character)
- [ ] Listen for actual transformer hum near suspected substations

### Post-Walk
- [ ] Compare photos to GeoJSON data
- [ ] Note acoustic landmarks (quiet zones, noisy intersections)
- [ ] Update ProximityEngine trigger radii based on real-world acoustics

---

## Success Criteria

### Technical
- [ ] PWA runs on iOS Safari and Android Chrome
- [ ] GPS accuracy within 10m in District 1 urban canyons
- [ ] Audio responds to compass heading within 100ms
- [ ] No audio dropouts during 30+ min walk
- [ ] Battery drain <25% over full District 1 exploration
- [ ] Spatial culling handles 4,000–5,000 infrastructure elements
- [ ] Works offline after initial cache

### Experiential
- [ ] 15+ user testing participants complete experience
- [ ] Users report "seeing infrastructure differently"
- [ ] Clear sonic differentiation between 5 infrastructure types
- [ ] Real-time tram events create synchronized audio moments
- [ ] District 1 theme provides coherent musical foundation

### Artistic
- [ ] Sonification is legible (users understand 5 layers)
- [ ] Balances data fidelity with aesthetic beauty
- [ ] Celebrates (not critiques) hidden systems
- [ ] Each infrastructure type has distinct, memorable sonic character
