# Phase 1 Planning

**Timeline:** Months 1-6
**Goal:** Working MVP of tram power network sonification

---

## Audio Design Objectives

### Layer 1: Overhead Wire Hum
- **Source:** 1,689 wire segments (`fahrleitungen_fahrdraht`)
- **Sound:** Continuous 600 Hz electrical drone
- **Mapping:** Harmonic richness varies with wire height (warm/cold)
- **Position:** 3D positioned overhead at actual wire locations

### Layer 2: Power Feeder Flow
- **Source:** 366 feeder segments (`fahrleitungen_feeder`)
- **Sound:** Directional whoosh/flow
- **Mapping:** Granular synthesis suggesting electron flow from substations
- **Position:** Follows feeder geometry toward overhead wires

### Layer 3: Support Pole Pings
- **Source:** 258 poles (`fahrleitungen_mast`)
- **Sound:** Metallic ping/chime triggered by proximity (10m)
- **Mapping:** Pitch varies with pole height, timbre with pole type
- **Rhythm:** Natural ~6m spacing creates walking tempo

### Layer 4: Tram Consumption Events
- **Source:** VBZ Real-Time API + wire locations
- **Sound:** Power surge / electrical crackle
- **Trigger:** Tram position intersects with wire segment
- **Effect:** Doppler as tram approaches and passes

### Layer 5: Substation Drone (Optional)
- **Source:** 71 inferred substation locations
- **Sound:** Deep 50 Hz bass drone
- **Position:** Directional, audible from 100m+

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
- [ ] Photograph overhead wire configuration
- [ ] Note wire height (estimate)
- [ ] Count visible support poles
- [ ] Identify any substations or electrical cabinets
- [ ] Record GPS coordinates
- [ ] Note acoustic environment (ambient noise level)

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
- [ ] Users report noticing wires differently
- [ ] Tram passage creates clear audio event
- [ ] Journey has coherent narrative arc

### Artistic
- [ ] Users understand what they're hearing
- [ ] Visible infrastructure makes audio meaningful
- [ ] Creates new perception of urban space
