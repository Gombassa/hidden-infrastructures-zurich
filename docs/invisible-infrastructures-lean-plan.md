# Invisible Infrastructures: Zurich
## Lean Project Plan - 5 Infrastructure Layers, District 1

**Version:** 2.0 Lean Edition  
**Date:** March 2026  
**Status:** Ready to Build  
**Target Launch:** August 2026 (6 months)  
**Funding:** Stadt Zürich Digitale Künste (CHF 14,500)

---

## What We're Building

A Progressive Web App that makes Zurich's hidden infrastructure audible through spatial audio as you walk through District 1.

**The Experience:**
- Walk anywhere in District 1 (postal code 8001, Altstadt)
- Hear 5 layers of urban infrastructure as spatial soundscapes:
  - Tram electrical (600V DC overhead wires, feeders, poles)
  - Water supply (pipes, pumps, flow)
  - Sewage (treatment, drainage, underground)
  - Electricity grid (transformers, distribution, voltage)
  - Telecommunications (fiber, cellular, data)
- Plus: District 1 musical theme (procedural electronic ambient)
- Real-time events: trams passing, water flowing, data transmitting
- Infrastructure becomes visceral and tangible

**Development Strategy:**
- **Phase 1 (March):** Tram network complete on prototype route (2.7km)
- **Phase 2 (April):** Add 4 infrastructure types on same route
- **Phase 3 (May):** Expand to full District 1 free-roam + production audio
- **Phase 4 (June-Aug):** PWA, testing, launch

**Why This Scope:**
- ✅ Complete official data (VBZ, WVZ, ERZ, ewz all accessible)
- ✅ Proven workflow (tram network validates approach)
- ✅ Infrastructure visible (users see wires, pipes, cables)
- ✅ Real-time events (trams, water flow, data packets)
- ✅ Iconic Zurich features (trams, historic center, modern systems)
- ✅ Expandable (can add Districts 2-6 in future)

---

## What's Already Done

### ✅ Core Engines (498 lines, production-ready)

**TramEngine.js** (180 lines)
- Fetches real-time tram positions from transport.opendata.ch
- Interpolates movement between 6 stop pairs
- Updates every 10 seconds
- **Status:** Working, tested

**ProximityEngine.js** (125 lines)
- Calculates distances between trams and infrastructure
- Triggers audio events when trams pass feeders (30m radius)
- Tracks tram density near substations (150m radius)
- **Status:** Working, tested

**ListenerEngine.js** (193 lines)
- Simulates walking along route (75 waypoints, 2.7km)
- Calculates heading for spatial audio
- Updates position every second
- **Status:** Working, ready for GPS swap

### ✅ Data Layer

**Tram Infrastructure (VBZ - downloaded & processed):**
- `route-tram-powerlines.geojson` - 1,689 overhead wire segments
- `route-tram-masts.geojson` - 258 support poles
- `route-tram-feeders.geojson` - 366 power feeders
- `route-waypoints.json` - 75 route points (2,682m) ✅

**Route Processing Pipeline (scripts/extract-route-waypoints.js):**
```javascript
// Input: route-tram-powerlines.geojson (1,689 LineString segments)
// Output: route-waypoints.json (75 waypoints, 2,682m)

// STEP 1: Build graph from LineString segments
// - Load all overhead wire coordinates
// - Snap points to 2.5m grid to merge parallel tracks
// - Create node adjacency graph

// STEP 2: Parallel track merge (Union-Find algorithm)
// - Find nodes within 5m of each other
// - Merge into canonical coordinates (average position)
// - Result: Reduces duplicate parallel tram tracks to single path

// STEP 3: A* pathfinding through forced stops
// Route: Stadelhofen → Bellevue → Paradeplatz → 
//        Rennweg → HB → Bürkliplatz
// - Find nearest graph node to each stop
// - A* stitch between each stop pair
// - Concatenate sub-paths into full route

// STEP 4: Uniform arc-length downsampling
// - Build cumulative distance array
// - Sample 75 points at equal arc-length intervals
// - (RDP inappropriate - route retraces Bahnhofstrasse)
// - Round to 6 decimal places

// VALIDATION:
// - Each stop within 0-23m of nearest waypoint
// - Total distance: 2,682m
// - Waypoint count: 75
```

**Key algorithm features:**
- **5m snap tolerance** - Merges parallel northbound/southbound tracks
- **Arc-length sampling** - Preserves route topology (critical for U-shaped paths)
- **Haversine distance** - Accurate for Zurich latitude (47.37°)
- **Route genuinely retraces** - North to HB, then south to Bürkliplatz (correct walk topology)

**Route stops (validated):**
- Stadelhofen → Bellevue → Paradeplatz → Rennweg → Bahnhofstrasse/HB → Bürkliplatz
- Note: Route genuinely retraces Bahnhofstrasse (north to HB, then south to Bürkliplatz)
- This is correct walk topology for District 1 audio experience

**Why this extraction approach matters:**

1. **Parallel track problem** - VBZ geodata has separate LineStrings for northbound/southbound trams
   - Without 5m snapping: Duplicate infrastructure, confusing spatial audio
   - With snapping: Clean single path through district

2. **Graph topology preservation** - Infrastructure is a network, not just points
   - Water flows through pipes (directed graph)
   - Electricity distributes from substations (tree structure)
   - Sewage drains via gravity (topological ordering)
   - Understanding network topology enables richer sonification

3. **Arc-length sampling** - Why not Ramer-Douglas-Peucker (RDP)?
   - RDP optimizes for visual simplification (removes geographic detail)
   - Arc-length preserves experiential distance (every meter of walking)
   - Critical for audio: User needs waypoint every ~35m for smooth spatial updates

4. **Reusable for April data** - Same algorithms work for:
   - Water pipes (network graph, no parallel issue)
   - Sewage collectors (gravity-driven topology)
   - Electricity grid (radial distribution from substations)
   - Fiber optic (point-to-point connections)

**Water Supply (WVZ Leitungskataster - April download):**
- 1,550 km network citywide
- Distribution pipes, pumping stations
- Source: https://www.stadt-zuerich.ch/geodaten/download/WVZ_Leitungskataster
- Processing: Similar extraction script for District 1 subset

**Sewage (ERZ Abwasser - April download):**
- Treatment facilities, drainage, main collectors
- Source: https://www.stadt-zuerich.ch/geodaten/download/ERZ_Abwasser_Werkleitungsdaten
- Processing: Extract District 1 collectors, treatment points

**Electricity & Telecom (ewz - April download):**
- Distribution network, transformers, substations
- Fiber optic nodes, telecommunications infrastructure
- Source: https://www.stadt-zuerich.ch/geodaten/download/EWZ_Werkleitungsdaten_Elektrizitaet_und_Telekommunikation
- Processing: Extract substations, fiber nodes for District 1

**Real-time API:** transport.opendata.ch confirmed working

### ✅ Audio Synthesis Pipeline

**WebPd compilation workflow validated:**
- `feeder-event.pd` → `patch.wasm` (percussive trigger)
- `substation-drone.pd` → `patch.wasm` (continuous hum)
- Dual-patch test page confirms simultaneous playback
- **Status:** Technical proof only, sound design pending

---

## What Needs Building

### Phase 0: Pre-Funding MVP - Tram Demo (March 8-16, 1 week)

**Goal:** Working tram network experience by **March 15** (next weekend) to demonstrate in funding application

**Why:** Prove technical feasibility before funding decision. Zero budget required - all data/code already exists.

**What's Already Ready:**
- ✅ 3 working engines (498 lines tested code)
- ✅ VBZ tram data downloaded (1,689 wires, 366 feeders, 258 poles)
- ✅ WebPd compilation workflow validated
- ✅ Route simulation working

**Weekend 1 (March 8-9, Saturday-Sunday):**
- [ ] Create `index.html` with Three.js + WebPd imports
- [ ] Wire TramEngine → ProximityEngine → simple audio trigger
- [ ] Convert lat/lng → 3D coordinates (Mercator projection)
- [ ] Position 1-2 test audio sources in space
- [ ] Test with browser console.log() to verify data flow
- **Deliverable:** Data pipeline proven (engines → spatial coordinates)

**Monday-Tuesday (March 10-11, evenings):**
- [ ] Add Three.js PositionalAudio system
- [ ] Position all 366 feeders in 3D space
- [ ] Create simplest possible Pure Data patch: `tram-beep.pd` (single oscillator)
- [ ] Compile to WebPd, load in HTML
- [ ] Test with ListenerEngine simulation
- **Deliverable:** Positioned audio responding to simulated walk

**Wednesday-Thursday (March 12-13, evenings):**
- [ ] Replace ListenerEngine simulation with device GPS
- [ ] Add compass heading (DeviceOrientation API)
- [ ] Implement spatial culling (only render nearby sources)
- [ ] Test walking around your neighborhood
- [ ] Fix any critical GPS/orientation bugs
- **Deliverable:** GPS-driven spatial audio working

**Friday (March 14, evening):**
- [ ] Test walking the actual Zurich route
- [ ] Record 1-2 minute demo video on phone
- [ ] Take screenshots of working app
- [ ] Fix show-stopper bugs only
- **Deliverable:** Video demo for funding application

**Saturday (March 15, target completion):**
- [ ] Write 1-page README.md for repo
- [ ] Clean up code (remove debug logging)
- [ ] Optional: add very basic UI (start/stop button)
- [ ] Final test walk + video
- **Deliverable:** ✅ MVP COMPLETE - ready for funding submission

**Sunday (March 16, buffer day):**
- Contingency for unexpected issues
- Or: rest before funded development begins

**Phase 0 MVP Scope:**
- ✅ Tram network only (1 infrastructure type)
- ✅ Prototype route only (2.7km Stadelhofen → Bürkliplatz)
- ✅ Basic spatial audio (positioned sources, distance attenuation)
- ✅ GPS + compass integration
- ✅ Real tram triggers (via transport.opendata.ch API)
- ✅ Simplest possible Pure Data patch (just proves audio works)

**Explicitly NOT in Phase 0:**
- ❌ Production-quality sound design
- ❌ UI/polish/styling
- ❌ PWA features (offline, service worker)
- ❌ Other infrastructure types (water, sewage, etc.)
- ❌ District musical theme
- ❌ Full District 1 expansion
- ❌ User testing

**Success Criteria (by March 15):**
- [ ] Video shows: walking route with phone
- [ ] Headphones play positioned tram network hum
- [ ] Tram passing overhead triggers audio event
- [ ] GPS updates change audio perspective
- [ ] Compass heading affects left/right/front/back positioning
- [ ] Demo is compelling enough to include with funding application

**Technical Risk: LOW**
- All components already validated individually
- Just need integration (wiring existing pieces)
- 1 week is tight but achievable for basic demo

**Outcome:**
Working demo by March 15 to strengthen funding application with proof-of-concept video.

---

### Phase 1: Tram Network Production (Post-Funding, 3 weeks)

**Weekend 2 (March 15-16, Sat-Sun):**
- [ ] Create 2 basic Pure Data patches:
  - `wire-drone.pd` - simple overhead wire hum (continuous tone)
  - `feeder-event.pd` - tram trigger (percussive click)
- [ ] Compile to WebPd
- [ ] Test on full route with real tram data
- [ ] Record 1-2 minute demo video
- **Deliverable:** Working tram network demo for funding application

**Phase 0 Milestone (March 16):** 
- ✅ Functional tram network experience (basic quality)
- ✅ Video demonstration (1-2 min)
- ✅ Proof of concept complete
- ✅ Include with funding application submission

**Constraints:**
- No budget required (use existing hardware)
- No new data downloads (VBZ tram only)
- Basic audio quality acceptable (placeholder patches)
- Firebase free tier for hosting
- Focus: prove the concept works

---

### Phase 1: Post-Funding Tram Refinement (Late March, 2 weeks)

**Status:** After funding approval, polish the tram experience  
**Budget:** Can now purchase hardware, hosting

**Week 1 (March 17-23):**
- [ ] Set up proper hosting (Hetzner server)
- [ ] Refine `wire-drone.pd` with better synthesis
- [ ] Add `pole-ping.pd` for geometric markers
- [ ] Add `district-theme.pd` basic ambient layer
- [ ] Optimize performance and battery usage
- **Deliverable:** Polished tram experience (3 patches)

**Week 2 (March 24-31):**
- [ ] User testing with 3-5 people
- [ ] Fix bugs and refine audio mix
- [ ] Add basic UI controls
- [ ] Documentation update
- **Deliverable:** Production-ready tram network

**Milestone 1 (End March):** Complete tram network experience

---

### Phase 2: Infrastructure Expansion (April, 4 weeks)

**New data sources integrated, still on prototype route (2.7km)**

**Week 1: Water Supply Layer**
- Download WVZ Leitungskataster for route area
- **Adapt extraction script** (based on `extract-route-waypoints.js`):
  ```javascript
  // scripts/extract-water-infrastructure.js
  // Reuse core algorithms from route extraction:
  
  // 1. Load WVZ water pipe GeoJSON (LineStrings + Points)
  // 2. Filter to infrastructure within 100m of route waypoints
  // 3. Build graph (if needed for network topology)
  // 4. Extract key features:
  //    - Distribution pipes (LineStrings)
  //    - Pumping stations (Points)
  //    - Flow direction indicators
  // 5. Save water-infrastructure.geojson
  
  // Key differences from tram extraction:
  // - No parallel track merging (pipes don't have this issue)
  // - May need depth/pressure attributes
  // - Flow direction matters for audio (toward/away from user)
  ```
- Update ProximityEngine for water layer (100m radius for pipes)
- Create basic `water-flow.pd` patch
- **Deliverable:** Water layer functional (placeholder audio)

**Week 2: Sewage Layer**
- Download ERZ Abwasser-Werkleitungsdaten for route area
- **Adapt extraction script** for sewage:
  ```javascript
  // scripts/extract-sewage-infrastructure.js
  // Similar to water, but:
  // - Focus on main collectors (not every service pipe)
  // - Extract treatment facilities as point features
  // - Depth information critical (deeper = different audio)
  // - Flow is gravity-driven (topological constraints)
  ```
- Update ProximityEngine for sewage layer (150m radius for deep collectors)
- Create basic `sewage-rumble.pd` patch
- **Deliverable:** Sewage layer functional (placeholder audio)

**Week 3: Electricity & Telecom Layers**
- Download ewz Werkleitungsdaten for route area
- **Dual extraction scripts**:
  ```javascript
  // scripts/extract-electricity-infrastructure.js
  // Extract substations, transformers from ewz geodata
  // - Substations as point features (high voltage)
  // - Distribution transformers (lower voltage, more common)
  // - Voltage level attribute for audio modulation
  
  // scripts/extract-telecom-infrastructure.js
  // Extract fiber nodes, data hubs
  // - Fiber optic junction points
  // - Data infrastructure nodes
  // - Bandwidth/capacity attributes if available
  ```
- Update ProximityEngine for both layers
  - Electricity: 200m radius for substations, 50m for transformers
  - Telecom: 100m radius for fiber nodes
- Create basic patches: `grid-hum.pd`, `data-chirp.pd`
- **Deliverable:** 5 infrastructure types functional (placeholder audio)

**Week 4: Multi-Layer Integration**
- 6-layer audio mixing (5 infrastructure + 1 theme)
- User controls (toggle layers, adjust mix)
- Performance optimization (5x data volume)
- Test all layers simultaneously
- **Deliverable:** Complete multi-infrastructure experience on prototype route

**Milestone 2:** End of April - All 5 infrastructure types working on 2.7km route

---

### Phase 3: District 1 Expansion + Sound Design (May, 4 weeks)

**Geographic expansion to full postal code 8001 + production-quality audio**

**Week 1: Geographic Data Expansion**
- **Scale extraction scripts to full District 1 (postal code 8001)**:
  ```javascript
  // Modify all 5 extraction scripts from route-based to district-based
  
  // BEFORE (March-April): Route filtering
  const ROUTE_BUFFER = 100; // meters
  function isNearRoute(lat, lng) {
    return waypoints.some(wp => 
      haversine([lng, lat], wp) <= ROUTE_BUFFER
    );
  }
  
  // AFTER (May): District boundary filtering
  const DISTRICT_1_BOUNDS = {
    minLat: 47.360, maxLat: 47.380,  // Approximate
    minLng: 8.530,  maxLng: 8.550
  };
  
  function isInDistrict1(lat, lng) {
    return lat >= DISTRICT_1_BOUNDS.minLat && 
           lat <= DISTRICT_1_BOUNDS.maxLat &&
           lng >= DISTRICT_1_BOUNDS.minLng && 
           lng <= DISTRICT_1_BOUNDS.maxLng;
  }
  
  // Process each infrastructure type for full district:
  // scripts/extract-tram-district1.js     → ~1,000 feeders
  // scripts/extract-water-district1.js    → ~500 distribution points
  // scripts/extract-sewage-district1.js   → ~200 collectors
  // scripts/extract-electricity-district1.js → ~300 substations
  // scripts/extract-telecom-district1.js  → ~100 fiber nodes
  
  // Total: ~4,000-5,000 infrastructure elements
  
  // CRITICAL: Same algorithms, just broader filtering
  // - Keep 5m snap tolerance for tram parallel tracks
  // - Keep graph building for network topology
  // - Keep haversine distance calculations
  // - Remove route waypoint proximity checks
  ```
- Update ProximityEngine for increased scale:
  ```javascript
  // Add spatial culling to handle 5,000 elements
  const AUDIO_CULLING_DISTANCE = 200; // meters
  
  function getCulledInfrastructure(userLat, userLng) {
    return allInfrastructure.filter(item => 
      haversine([userLng, userLat], [item.lng, item.lat]) 
      <= AUDIO_CULLING_DISTANCE
    );
  }
  ```
- Test spatial culling (critical at this scale)
- **Deliverable:** Full District 1 geodata loaded (4,000-5,000 elements)

**Week 2: GPS Free-Roam**
- Remove fixed route constraint
- Users can walk anywhere in District 1
- Dynamic infrastructure loading (only nearby elements)
- Spatial culling essential:
  ```javascript
  // Only render infrastructure within 200m of user
  // Cull further based on audio layer (tram=30m, water=100m, etc.)
  ```
- **Deliverable:** Free-roam exploration in District 1

**Week 3-4: Production Sound Design**
- Refine all 6 Pure Data patches to production quality:
  - Tram electrical: rich, dynamic, responsive
  - Water: hydraulic pulse, flow textures
  - Sewage: deep bass, underground character
  - Electricity: transformer hum, voltage fluctuations
  - Telecom: data chirps, fiber whispers
  - District theme: procedural electronic, Altstadt character
- Parameter mapping refinement
- Mix balancing across all layers
- **Deliverable:** Production-quality 6-layer audio system

**Milestone 3:** End of May - Full District 1, free-roam, production audio

---

### Phase 4: PWA & Launch (June–August, 12 weeks)

**Week 1-2: User Interface**
- Minimal on-screen elements (audio-first)
- Layer toggles (wire hum / poles / trams / theme)
- Battery indicator, tram tracker
- "Look up" prompts at key moments
- **Deliverable:** Functional UI

**Week 3-4: Progressive Web App**
- Service worker for offline capability
- Web App Manifest (installable)
- Cache route data and audio assets
- **Deliverable:** PWA works offline

**Week 5-6: User Testing**
- 5-10 beta testers walk the route
- Collect feedback via in-app survey
- Fix critical bugs
- Refine audio mix based on real-world use
- **Deliverable:** Beta-tested experience

**Week 7-8: Documentation & Polish**
- User guide (how to experience)
- Technical documentation
- Demo video (3-5 min)
- Press kit materials
- **Deliverable:** Launch-ready materials

**Week 9-10: Public Launch**
- Deploy to production URL
- Announce on social media, local groups
- Monitor analytics
- Gather testimonials
- **Deliverable:** Public release

**Milestone 3:** Public launch, August 2026

---

## Technical Stack (Confirmed)

### Frontend
- **HTML/CSS/JavaScript** - PWA foundation
- **Three.js** - 3D spatial audio positioning
- **WebPd** - Pure Data → JavaScript compilation
- **Web Audio API** - Binaural panning, distance attenuation
- **Geolocation API** - GPS position
- **DeviceOrientation API** - Compass heading

### Backend
- **Hetzner Cloud** (CX31) - PWA deployment (renewable energy hosting)
- **Cloudflare CDN** - Asset delivery and caching
- **transport.opendata.ch** - Direct API calls (no server-side proxy needed)
- **Cost:** CHF ~700/year (server + domain + CDN)

### Data Sources
- **VBZ Infrastruktur OGD** - Tram infrastructure geodata (confirmed access)
- **transport.opendata.ch** - Live tram positions (confirmed working)
- **Route data** - Already extracted and processed

### Audio Production
- **Pure Data** - Patch design (desktop)
- **WebPd Compiler** - .pd → .wasm conversion
- **Field recordings** - Optional (tram sounds, urban ambience)

---

## Critical Path

**The shortest path to full District 1 launch:**

**PRE-FUNDING (9 days, March 8-16):**
1. **Spatial audio + engine integration** (Weekend 1)
   - Prove core concept works
   
2. **Full route with GPS** (Weekdays)
   - End-to-end system functional
   
3. **Basic patches + demo video** (Weekend 2)
   - Include with funding application
   - **Milestone:** Proof of concept complete

**POST-FUNDING (if approved):**

4. **Polish tram experience** (Late March)
   - Better audio quality, proper hosting
   
5. **All 5 infrastructure types integrated** (April)
   - Water, sewage, electricity, telecom added
   
6. **Geographic expansion to District 1** (May Week 1-2)
   - Scale to full postal code 8001
   - GPS free-roam (not fixed route)
   
7. **Production sound design** (May Week 3-4)
   - All 6 patches refined to production quality
   
8. **PWA deployment** (June-August)
   - Makes it accessible to public

**Phase 0 (9 days) is the sprint.** Everything after depends on funding approval.

---

## Risk Mitigation

### Technical Risks

**GPS accuracy in urban canyons**
- **Mitigation:** Wide trigger zones (50m), position smoothing, compass for orientation
- **Fallback:** Route snapping, manual calibration option

**Battery drain**
- **Mitigation:** Lower GPS update rate (5s), optimize Web Audio graph
- **Fallback:** Battery warning, power-saving mode

**Audio source overload**
- **Mitigation:** Spatial culling (only nearby sources), source pooling
- **Fallback:** Reduce max simultaneous sources, simpler synthesis

**WebPd performance**
- **Mitigation:** Test on older devices, optimize patch complexity
- **Fallback:** Tone.js synthesis instead of WebPd (easier but less flexible)

### Sound Design Risks

**Sonic clarity vs. realism**
- **Challenge:** 1,689 wires might create mud, not music
- **Solution:** Iterative testing, AI-driven mixing, user controls

**District theme composition**
- **Challenge:** Creating compelling generative music is hard
- **Solution:** Start simple (ambient drone), iterate, consider collaboration

---

## Success Criteria

### Technical
- [ ] PWA loads on iOS Safari and Android Chrome
- [ ] GPS accuracy within 10m in District 1
- [ ] Audio responds to compass heading within 100ms
- [ ] No audio dropouts during 30-min walk
- [ ] Battery drain <25% over full District 1 exploration
- [ ] Works offline after initial cache
- [ ] All 5 infrastructure layers render simultaneously
- [ ] Spatial culling handles 4,000-5,000 infrastructure elements

### Experiential
- [ ] 15+ user testing participants complete experience
- [ ] 70%+ would recommend to others
- [ ] Users report "seeing infrastructure differently"
- [ ] Tram/water/data events create synchronized experiences
- [ ] Clear sonic differentiation between 5 infrastructure types
- [ ] District 1 theme provides coherent musical foundation
- [ ] Free-roam exploration feels natural and compelling

### Artistic
- [ ] Sonification is legible (users understand 5 layers)
- [ ] Balances data fidelity with aesthetic beauty
- [ ] Creates new perception of urban infrastructure
- [ ] Celebrates (not critiques) hidden systems
- [ ] Documented with high-quality video/photos
- [ ] Each infrastructure type has distinct sonic character

### Launch (August 2026)
- [ ] 100+ completed journeys in first 3 months
- [ ] 70%+ completion rate (users explore, don't abandon)
- [ ] Positive media coverage (1+ Zurich publication)
- [ ] GitHub repo public with documentation
- [ ] Stadt Zürich acknowledges project in digital arts context
- [ ] Open-source code enables adaptation to other cities

---

## Budget

**Total: CHF 14,500** (Stadt Zürich Digitale Künste application)

### Infrastructure & Hosting (CHF 1,800)
- Dedicated server (Hetzner Cloud CX31): CHF 600/year
- Domain + SSL certificates: CHF 100/year
- CDN/asset hosting (Cloudflare): CHF 300/year
- Backup storage: CHF 200/year
- Development/testing environments: CHF 600

### Development Hardware (CHF 2,500)
- Replacement laptop (current machine failing): CHF 2,500

### Artistic Development (CHF 7,200)
- Infrastructure layer sound design (5 layers): CHF 4,000
  - Tram electrical (already built): CHF 0
  - Water supply sonification: CHF 1,000
  - Sewage/wastewater sonification: CHF 1,000
  - Electricity grid sonification: CHF 1,000
  - Telecommunications/fiber sonification: CHF 1,000
- District 1 musical theme composition: CHF 1,500
  - Procedurally-generated electronic theme reflecting district character
- Integration & spatial audio mixing: CHF 1,000
- Field recording & validation: CHF 700

### Testing & Iteration (CHF 1,500)
- User testing sessions (15 participants): CHF 900
- Technical optimization across 5 layers: CHF 600

### Public Presentation (CHF 1,500)
- Launch event (venue, promotion): CHF 800
- Documentation (video, photography): CHF 400
- Promotional materials (website, social media): CHF 300

**Post-launch annual costs:** CHF 700 (server + domain only)

---

## Timeline Visual

```
Week: Mar 8-16  Mar 17-31  April          May            June           July           August
      |---------|----------|--------------|--------------|--------------|--------------|
Phase 0: Pre-Funding (9 days)
  Weekend 1: Spatial audio proof
  Weekdays: GPS integration
  Weekend 2: Basic patches + demo video
               Phase 1: Tram Polish (2 weeks - post-funding)
                 Week 1: Better patches, hosting setup
                 Week 2: Testing, UI, documentation
                          Phase 2: Infrastructure Expansion (4 weeks)
                            Week 1: Water layer
                            Week 2: Sewage layer
                            Week 3: Electricity & telecom
                            Week 4: Multi-layer integration
                                       Phase 3: District 1 + Sound Design (4 weeks)
                                         Week 1: Full district geodata
                                         Week 2: GPS free-roam
                                         Week 3-4: Production sound design
                                                    Phase 4: PWA & Launch (12 weeks)
                                                      Weeks 1-3: UI & PWA
                                                      Weeks 4-6: Testing (15 participants)
                                                      Weeks 7-9: Documentation
                                                      Weeks 10-12: Launch event
```

**Total: 27 weeks (6.5 months)**

**Key Milestones:**
- **March 16:** Phase 0 complete - demo for funding application
- **End March:** Phase 1 complete - polished tram network
- **End April:** Phase 2 complete - all 5 infrastructure types on route
- **End May:** Phase 3 complete - full District 1, production audio
- **August:** Public launch

---

## Post-Launch Expansion (Phase 2+)

**After District 1 launch (August 2026):**

### Geographic Expansion to Districts 2-6 (2027–2030)
- Each district receives the same 5 infrastructure layers
- Unique musical theme per district reflecting its character
- Collaborative model: local sound artists contribute procedural elements per district
- Full Zurich city coverage by 2030

### Additional Features
- Multiple tram routes across Zurich
- User-generated walks
- Educational mode with labels
- Historical comparisons
- Other Swiss cities (Basel, Bern, Geneva trams)

### Partnerships
- VBZ (educational tool)
- Stadt Zürich funding (Digitale Künste grant)
- ETH/ZHAW collaborations
- Media coverage for broader vision

**The tram network is the foundation, not the limitation.**

---

## Immediate Next Actions - Phase 0 Sprint

### Weekend 1: March 8-9 (Saturday-Sunday)

**Goal:** Prove spatial audio works with existing engines

**Saturday (6-8 hours):**
1. **Set up basic project structure**
   - [ ] Create `public/index.html` with Three.js
   - [ ] Import existing engines from `src/`
   - [ ] Set up basic HTML skeleton

2. **Three.js PositionalAudio test**
   - [ ] Create AudioListener attached to camera
   - [ ] Create single PositionalAudio source
   - [ ] Test with simple oscillator (not WebPd yet)
   - [ ] Verify binaural panning works with device orientation

3. **Coordinate conversion**
   - [ ] Write `latLngToXYZ()` function
   - [ ] Test with mock GPS coordinates
   - [ ] Position audio source in 3D space

**Sunday (6-8 hours):**
1. **Engine integration**
   - [ ] Import TramEngine, ProximityEngine
   - [ ] Wire up: TramEngine.getState() → ProximityEngine.calculate()
   - [ ] Map proximity results → audio parameters (volume, frequency)

2. **First audio trigger**
   - [ ] When tram within 30m of feeder → play sound
   - [ ] Test with real API data
   - [ ] Log to console to verify triggers working

3. **Test on route**
   - [ ] Load route-tram-feeders.geojson
   - [ ] Position a few feeders (not all 366 yet)
   - [ ] ListenerEngine walks route → triggers audio

**Weekend 1 Goal:** ✅ Prove tram proximity triggers positioned audio

---

### Weekdays: March 10-13 (Evenings, 2-3 hours/night)

**Monday-Tuesday:**
- [ ] Position ALL 1,689 wire segments in 3D space
- [ ] Implement spatial culling (only render sources within 200m)
- [ ] Test performance with full infrastructure

**Wednesday-Thursday:**
- [ ] Replace ListenerEngine.getState() with device GPS
- [ ] Add DeviceOrientation API for compass heading
- [ ] Test walking around real location (even just around block)
- [ ] Verify spatial audio follows your movement

**Weekday Goal:** ✅ Full route with real GPS positioning

---

### Weekend 2: March 15-16 (Saturday-Sunday)

**Goal:** Create basic audio + demo video for funding application

**Saturday (6-8 hours):**
1. **Pure Data patches (keep it simple)**
   - [ ] `wire-drone.pd`: Single sine oscillator at 600 Hz (represents 600V)
   - [ ] `feeder-event.pd`: Short noise burst (tram trigger)
   - No fancy synthesis yet - just prove the pipeline

2. **Compile to WebPd**
   - [ ] Use WebPd compiler to convert .pd → .wasm
   - [ ] Test patches in browser
   - [ ] Connect to proximity triggers

3. **Integration test**
   - [ ] Wire hum plays continuously from all nearby wires
   - [ ] Feeder events trigger when trams pass
   - [ ] Test on full route

**Sunday (4-6 hours):**
1. **Demo video recording** (1-2 minutes)
   - [ ] Screen recording showing:
     - Map with your position
     - Trams moving in real-time
     - Audio playing as you move
   - [ ] Or: Record walking outside with phone (audio + video)
   - [ ] Show proximity triggering feeders

2. **Clean up for submission**
   - [ ] Deploy to Firebase (free tier)
   - [ ] Create simple README
   - [ ] Test on different device

**Weekend 2 Goal:** ✅ Demo video ready for funding application

---

### Phase 0 Constraints (Critical)

**Zero Budget:**
- Use existing laptop (don't buy anything)
- Use local `npx http-server` for testing (no hosting cost yet)
- No domain purchase yet
- No new hardware

**Minimal Scope:**
- VBZ tram data only (already downloaded)
- 2 simple Pure Data patches (drone + trigger)
- Basic GPS positioning (no fancy filtering)
- No UI polish (barebones HTML)

**Good Enough Quality:**
- Audio can be simple (just prove it works)
- GPS can be a bit jittery (that's fine)
- No multi-layer mixing yet (just tram)
- Video can be rough (just show the concept)

**What Matters:**
- ✅ Spatial audio works
- ✅ Real tram data triggers sounds
- ✅ GPS positioning functional
- ✅ Video demonstrates the experience

**After funding approval, you can:**
- Buy proper laptop (CHF 2,500 budget)
- Set up Hetzner server (proper hosting)
- Refine audio quality
- Add other infrastructure types
- Polish everything

---

### File Structure (Phase 0 - Minimal)

```
invisible-infrastructures-zurich/
├── public/
│   ├── index.html (new - basic Three.js setup)
│   └── app.js (new - main integration logic)
├── src/
│   ├── tram-engine.js ✅
│   ├── proximity-engine.js ✅
│   └── listener-engine.js ✅
├── audio/
│   ├── wire-drone.pd (new - Weekend 2)
│   ├── feeder-event.pd (new - Weekend 2)
│   └── compiled/ (WebPd .wasm files)
├── data/
│   └── raw/ ✅ (already have this)
└── README.md (update)
```

**Keep it minimal. Prove the concept. Get the funding. Then build properly.**

---

## Key Principles

1. **Ship incrementally** - Working prototype every 2 weeks
2. **Test with real data** - Use actual VBZ data from day 1
3. **Audio-first** - UI is minimal, sound is the experience
4. **Document as you go** - README, comments, decisions
5. **Embrace constraints** - Free tier limits = good design pressure

---

## Why This Will Work

1. **Data is confirmed** - No waiting on partnerships
2. **Engines are done** - 498 lines of tested code
3. **Scope is focused** - Tram network only, District 1 only
4. **Timeline is realistic** - 6 months, part-time effort
5. **Tech stack is proven** - Three.js, WebPd, PWA all mature
6. **Concept is validated** - Visible wires make audio meaningful

**You have everything you need. Time to build.**

---

**Last Updated:** March 2026  
**Next Review:** End of Phase 1 (May 2026)
