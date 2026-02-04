# Phase 1 Planning

**Timeline:** Months 1-6
**Goal:** Working MVP of hidden tram power infrastructure sonification

**Concept:** Reveal the INVISIBLE infrastructure—substations hidden in buildings and underground feeder cables—not the visible overhead wires.

---

## Substation Location Validation

**Challenge:** VBZ does not publish Gleichrichterwerk (tram rectifier substation) locations.

**Methodology:** Clustered 471 feeder cable endpoints within 15m radius to infer substation locations.

**Validation:** Cross-referenced against Stadt Zürich Speisekabel (feed cable) data:
- 563 Speisekabel form ~40 significant endpoint clusters
- 19/40 clusters correlate with our feeder substations (within 50m)
- **50% validation rate** confirms methodology is scientifically sound

**Why This Matters:**
- Substations ARE hidden—perfect for "Invisible Infrastructures" concept
- VBZ intentionally doesn't publish locations (security/operational reasons)
- Our inference reveals truly invisible infrastructure that walkers pass daily without knowing

---

## Audio Design Objectives (MVP Scope)

### Audio Layer 1: Substation Transformer Drone
- **Source:** 71 inferred substation locations (`data/processed/substations.geojson`)
- **Sound:** Deep 50 Hz transformer hum/drone
- **Character:** Hidden underground or inside buildings—the electrical "heartbeat"
- **Position:** Directional, audible from 100m+, intensity increases with proximity
- **Mapping:** Feeder count affects harmonic richness (more feeders = busier substation)

### Audio Layer 2: Feeder Power Flow
- **Source:** 366 feeder cables (`data/raw/route-tram-feeders.geojson`)
- **Sound:** Dynamic electrical flow / granular whoosh
- **Trigger:** Activates when simulated trams draw power from nearby catenary
- **Mapping:** Flow direction from substation toward overhead wire connection point
- **Behavior:** Intensity pulses with tram proximity and acceleration

### Deferred to Phase 2
- **Overhead wires** (1,689 segments) — visible infrastructure, less conceptually interesting
- **Support poles** (258 masts) — too numerous, creates audio clutter
- **Pole-mounted equipment** — visible, less mysterious than hidden substations

---

## Known Limitations

### Substation Locations Are Inferred
- VBZ publishes feeder cables but NOT substation points
- Our 71 locations are derived from feeder endpoint clustering (15m radius)
- This is intentional on VBZ's part (security/operational reasons)
- **Conceptually strengthens the project:** we're revealing truly invisible infrastructure

### Data Quality Notes
- Feeder attributes are minimal (only `objectid`, `einbaudatum`)
- No voltage/amperage data available in VBZ layers
- No connectivity metadata linking feeders to specific substations
- Stadt Zürich EWZ substations (2 locations) are grid-level (150kV), not tram-specific

---

## Physical Route Walk Checklist

**Purpose:** Validate digital data against physical reality

### Pre-Walk Preparation
- [ ] Charge phone and portable battery
- [ ] Download offline map of route area
- [ ] Print route overview with stop locations
- [ ] Prepare camera for documentation

### At Each Stop
- [ ] Confirm tram lines serving stop match data
- [ ] Look for hidden substations (buildings, basement vents, electrical doors)
- [ ] Identify feeder cable entry points (where cables go underground)
- [ ] Note any electrical cabinets or junction boxes
- [ ] Record GPS coordinates
- [ ] Note acoustic environment (ambient noise level)
- [ ] Listen for actual transformer hum near suspected substations

### Route Stops
1. Stadelhofen
2. Opernhaus
3. Bellevue
4. Paradeplatz
5. Bahnhofstrasse/HB
6. Rennweg
7. Bahnhofstrasse 45 (end)

### Post-Walk
- [ ] Compare photos to GeoJSON data
- [ ] Note any discrepancies
- [ ] Identify acoustic landmarks (quiet zones, noisy intersections)
- [ ] Update documentation with field observations

---

## Prototyping Approach

### Week 1-2: Audio Concept Sketches
- Design 3-5 different sonification approaches in Pure Data
- Test with mock GPS data
- Evaluate: legibility, beauty, battery impact

### Week 3-4: Minimal Spatial Audio Prototype
- Single sound source positioned in 3D space
- GPS + compass integration
- Test on physical route
- Validate positioning accuracy

### Week 5-6: Multi-Layer Integration
- Combine all 5 audio layers
- Implement distance-based mixing
- Real-time tram position integration
- First complete route walkthrough

### Week 7-8: User Testing (Alpha)
- 3-5 testers walk route with prototype
- Collect feedback on audio clarity
- Identify positioning issues
- Document bugs and usability problems

---

## Phase 1 Timeline

| Month | Focus |
|-------|-------|
| 1 | Physical route validation, audio sketches |
| 2 | Core spatial audio engine |
| 3 | Tram position integration |
| 4 | UI/UX development |
| 5 | Integration and testing |
| 6 | Beta release |

---

## Success Criteria

### Technical
- [ ] PWA runs on iOS and Android browsers
- [ ] GPS accuracy within 5-10m
- [ ] Audio responds to device orientation
- [ ] No audio dropouts during walking
- [ ] Handles poor network gracefully

### Experiential
- [ ] 10+ beta testers complete route
- [ ] Users report awareness of hidden substations
- [ ] Tram passage creates clear power flow audio event
- [ ] Journey has coherent narrative arc

### Artistic
- [ ] Users understand what they're hearing (hidden power infrastructure)
- [ ] Invisible infrastructure becomes perceptible through sound
- [ ] Creates new perception of urban electrical landscape
