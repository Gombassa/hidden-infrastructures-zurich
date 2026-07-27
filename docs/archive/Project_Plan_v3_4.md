# **Hidden Infrastructures: Zürich**

## **Project Plan — 6 Infrastructure Layers, District 1**

**Document version:** v3.4 — April 2026
**Changes from v3.3:** Audio synthesis enriched across all 6 layers — line-crossing/alongside detection, layer-appropriate transients, proximity-scaled re-triggers, oscillator pool expansion, burst pool for telecom, Fernwärme bearing panning + radius tightened to 30m; shared density reverb bus driven by active layer count (0–6); `scripts/import-new-tiles.js` automates GeoShop tile ingestion; GeoShop order manifest relocated to `data/processed/.processed-orders.json`; 30 GeoShop orders now processed (55297–55476).

---

## **Executive Summary**

Hidden Infrastructures is a Progressive Web App that makes Zurich's hidden infrastructure audible through spatial audio as you walk through District 1. Six layers of urban systems are sonified in real-time using procedurally generated audio driven by actual municipal geodata. All audio is generated through real-time procedural synthesis; the application contains no samples or pre-rendered audio assets.

The app collects zero personal data. GPS coordinates are processed entirely on-device and never transmitted. There are no user accounts, no analytics, no tracking. In a landscape where data collection happens by default, this absence is a deliberate artistic statement, not just a technical decision. The project makes this visible by offering the only thing it *can* share: users may optionally record the "score" of their walk — the timestamped parameter and control data sent to the synthesis engine — and contribute it to a public archive. The archive contains music, not surveillance. Scores can be replayed through the same patches to regenerate the audio of any walk, but they reveal nothing about where the person actually was.

**The Experience:**

* Walk anywhere in District 1 (postal code 8001, Altstadt)
* Hear 6 layers of urban infrastructure as spatial soundscapes:
  * Tram electrical (600V DC overhead wires, feeders, poles)
  * Water supply (pipes, pumps, flow)
  * Sewage (treatment, drainage, underground)
  * Electricity grid (transformers, distribution, voltage)
  * Telecommunications (fiber, cellular, data)
  * District heating / Fernwärme (thermal distribution network)
* Plus: District 1 musical theme (procedural electronic ambient)
* Real-time events: trams passing, water flowing, data transmitting
* Download a recording of your walk or share your score to a public archive
* Infrastructure becomes visceral and tangible

**Development Strategy:**

* **Phase 0 (March):** Data pipeline and audio synthesis proven. Web Audio API integration with stub engines complete. ✅
* **Phase 1 (Late March–Early April):** Real engine integration, GPS free-roam, Docker build environment, tram layer audio pipeline field-validated. Core audio pipeline complete; user testing and UI controls remaining. ✅
* **Phase 2 (April):** Add 5 infrastructure types on prototype route (water, sewage, electricity, telecom, Fernwärme). ✅
* **Phase 3 (May):** Expand to full District 1 free-roam + production audio
* **Phase 4 (June–August):** PWA, testing, launch

The project focuses on District 1 (postal code 8001), where all six infrastructure datasets are publicly accessible through Stadt Zürich's open data portal (VBZ, WVZ, ERZ, ewz, SIA405 LKMap). The tram network has already validated the technical workflow from raw geodata through to spatial audio. Much of the infrastructure is physically visible — overhead wires, manhole covers, transformer boxes — which anchors the sonic experience to things the listener can actually see. Real-time tram data adds a live, dynamic layer that changes with every walk. The district is compact enough to build and test within the project timeline, but the architecture is designed to expand to Districts 2-6 in future.

## **Current Development Status**

### **Core Engines**

Two JavaScript engine modules and an inline GPS listener form the core of the application. Together they create a real-time loop: the TramEngine tracks where trams are, the ProximityEngine determines which infrastructure is near the listener and which trams are near that infrastructure, and the GPS listener (inline in `index.html`) represents the user's live position.

**TramEngine.js** (180 lines) fetches real-time tram positions from transport.opendata.ch, interpolates movement between 6 stop pairs, and updates every 10 seconds. Working and tested.

**ProximityEngine.js** (125 lines) calculates distances between trams and infrastructure, triggers audio events when trams pass feeders (50m radius), and tracks tram density near substations (150m radius). Supports optional listener coordinates for foot-mode proximity gating. Working and tested.

**GPS Listener** (inline in `index.html`) — `navigator.geolocation.watchPosition()` drives `realLat`/`realLng` directly. Replaces the simulated ListenerEngine. The original simulation-based ListenerEngine.js has been archived to `Archive/simulation/`.

### **Data Layer**

The data layer provides the geographic coordinates of every piece of physical infrastructure that the audio system sonifies — without this, there is nothing to position in space.

**Tram infrastructure** from VBZ has been downloaded and processed into four GeoJSON/JSON files:

* `route-tram-powerlines.geojson`: 1,689 overhead wire segments
* `route-tram-masts.geojson`: 258 support poles
* `route-tram-feeders.geojson`: 366 power feeders
* `route-waypoints.json`: 75 route points (2,682m)

**Route processing pipeline** (`scripts/extract-route-waypoints.js`) takes the raw VBZ overhead wire GeoJSON (1,689 LineString segments) and produces a clean set of 75 waypoints covering 2,682m. The pipeline builds a graph from the wire segments, merges parallel northbound/southbound tracks using a Union-Find algorithm with 5m snap tolerance, runs A* pathfinding through forced stops (Stadelhofen → Bellevue → Paradeplatz → Rennweg → HB → Bürkliplatz), and downsamples to uniform arc-length intervals. Arc-length sampling was chosen over Ramer-Douglas-Peucker because the route retraces Bahnhofstrasse — RDP would collapse this U-shaped path, while arc-length preserves experiential distance at ~35m per waypoint for smooth spatial audio updates.

**All six infrastructure layers are now extracted and ready.** GeoShop DXF tile deliveries (18 orders: 55297–55302, 55333–55335, 55350–55352, 55366–55368, 55373–55375) covering District 1 have been downloaded and processed into GeoJSON via `scripts/extract-lk-geojson.js`. Output files are served from `public/`:

| File | Features | Geometry | Content | ProximityEngine radius |
|---|---|---|---|---|
| `lk-water.geojson` | 4,763 | 3,339 pipes + 1,424 fittings | WVZ distribution network | 50m pipe / 25m fitting |
| `lk-sewage.geojson` | 3,552 | pipes only | ERZ main collectors | 80m |
| `lk-electricity.geojson` | 7,223 | cables + nodes | ewz cables and transformers | 40m nodes / 40m cables |
| `lk-tram-lk.geojson` | 2,899 | trasse + nodes (overhead + area excluded) | VBZ track and structure — replaces route-tram-feeders + route-tram-powerlines | nodes: 50m feeder gate / trasse: 5m drone |
| `lk-telecom.geojson` | 8,301 | cables + nodes (overhead excluded) | Swisscom + UPC fiber | 40m nodes / 30m cables |
| `lk-fernwaerme.geojson` | 198 | pipes | District heating network | 30m (tightened — rare discovery encounters) |

**GeoShop extraction pipeline (`scripts/extract-lk-geojson.js`):**

* Processes tiled GeoShop DXF deliveries (GEO405/DXF format, LV95/EPSG:2056 coordinates)
* Walks all `order_*` subdirectories automatically; handles multiple tiles with cross-tile deduplication via `_dedupKey` properties
* Incremental/append mode: re-runs only add new features, never duplicate
* Custom DXF parser (no ezdxf dependency) handles POLYLINE and INSERT entities
* proj4 used for LV95 → WGS84 coordinate conversion (more accurate than Swisstopo formula)
* Layer routing via regex rules maps DXF layer names to output files and geometry types

**Extraction filter decisions (applied at extraction time; excluded features never enter output):**

* **Sewage:** Manholes excluded (`LKZ1131-MSU-`, `LKZ1137-MSU-`) — point features not needed for pipe sonification. Nebenleitung secondary lines excluded (`LKZ1118-MLU0`) — lower positional accuracy, not part of main collector network.
* **Electricity:** Trasse area footprints excluded (`LKZ1512-MFU`) — polygon extents of cable runs, not useful for point/line proximity audio.
* **Tram:** Overhead wire geometry excluded (`LKZ151VOMLU`) — already covered by the VBZ-sourced `route-tram-powerlines.geojson` with better attributes.
* **Telecom:** Overhead cables excluded (`LKZ161SO`, `LKZ161UO`) — aerial runs not relevant to underground infrastructure sonification.

**Water extraction also available as Python script** (`scripts/extract-water-infrastructure.py`) for processing a single `NIS_ZH_WVZ.dxf` directly. Outputs `public/route-water-pipes.geojson` (1,274 pipes) and `public/route-water-nodes.geojson` (520 fittings) as separate files. Uses ezdxf and handles both POLYLINE and LWPOLYLINE entities. Exclusions: `misc` (code 0) and `internal` (code B, lower accuracy) pipe functions; `unknown` node type.

**Real-time API:** transport.opendata.ch confirmed working.

### **Audio Synthesis Pipeline**

All six audio layers have been field-tested and confirmed working. The tram electrical layer was validated on the Bahnhofstrasse/Stadelhofen route; water, sewage, electricity, telecom, and Fernwärme were validated in a subsequent field session covering the same corridor.

**Feeder hiss** — proximity-scaled continuous texture generated by a 6-node comb-filter pool. Each slot has a distinct comb delay time assigned at init. Active-slot tracking prevents double-allocation as feeders enter and leave proximity range.

**Feeder crackle** — debounced one-shot events triggered per feeder ID. A Set of active feeder IDs prevents the event from firing continuously; each feeder ID fires once on entry. Speed-mode detection via the GPS `speed` property (threshold ~3 m/s) distinguishes on-foot listening from on-tram travel and applies different proximity trigger logic for each.

**Drone** — distance-based gain ramp triggered by proximity to powerline segments. A slow dual-LFO sweep modulates timbre, and a synthetic convolver reverb adds spatial depth.

**Architecture (April 2026 refactor):** All six audio layers — including tram electrical — are now discrete modules inside `src/audio-layers.js`. The tram synthesis code (crackle, hiss pool, drone, reverb, feederToXYZ spatial positioning) was moved out of `index.html` into `AudioLayers._initTramElectrical()`. `index.html` now contains no synthesis code. `AudioLayers.onListenerMove(lat, lng, heading)` was added to update hiss panner positions between tram ticks on GPS fix. Per-layer toggle buttons (TRAM / WATER / SEWAGE / ELECTRICITY / TELECOM / FERNWÄRME) control `AudioLayers.LAYER_ENABLED` flags in real time.

**Architectural decisions confirmed during Phase 1:**
- WebPd dropped: unreliable browser audio output on Windows/Chrome; Web Audio API direct synthesis is the validated development path
- Three.js dropped: not required for current synthesis architecture
- `ListenerEngine` simulation mode stripped; live GPS via `navigator.geolocation.watchPosition()` is the only listener tracking mode
- `pole-ping` sound layer dropped
- District ambient theme deferred to a later phase
- Vite used as the dev server; GeoJSON data files served via the `public/` directory
- Cloudflare Tunnel provides HTTPS on Android Chrome during field testing

Production sound design will be authored in Max/MSP and exported to browser-deployable WebAssembly via RNBO (Cycling '74's official web export tool). This workflow is the intended production path; licences are pending purchase.

---

## **Development Phases**

### **Phase 0: Pre-Funding MVP — Tram Demo (Complete)**

Phase 0 delivered a working data pipeline by March 22 to include as a proof-of-concept with the funding application.

**What was delivered:**

* ✅ 3 working engines (498 lines tested code)
* ✅ VBZ tram data downloaded (1,689 wires, 366 feeders, 258 poles)
* ✅ Web Audio API synthesis pipeline validated
* ✅ Mercator projection and haversine proximity calculations working
* ✅ Feeder trigger events and drone modulation responding to engine data
* ✅ Route simulation working

**Phase 0 MVP Scope:**

* ✅ Tram network only (1 infrastructure type)
* ✅ Prototype route only (2.7km Stadelhofen → Bürkliplatz)
* ✅ Basic audio synthesis (feeder crackle + substation drone)
* ✅ Real tram triggers (via transport.opendata.ch API)
* ✅ Data pipeline proven end to end

**Explicitly NOT in Phase 0:**

* ❌ GPS integration (stub engines only)
* ❌ Spatial audio positioning
* ❌ Production-quality sound design
* ❌ UI/polish/styling
* ❌ PWA features (offline, service worker)
* ❌ Other infrastructure types (water, sewage, etc.)
* ❌ District musical theme
* ❌ Full District 1 expansion
* ❌ User testing

---

### **Phase 1: Tram Network Production (Complete)**

Phase 1 shifts from proof-of-concept to a polished tram layer experience. This means wiring the real engines into the application, validating the Max/MSP + RNBO production audio workflow, setting up the Docker build environment and GCP hosting, and running initial user tests.

**Checklist:**

* ✅ Wire real TramEngine + ProximityEngine into `index.html`
* ✅ GPS free-roam via `watchPosition()`
* ✅ Docker build environment (multi-stage Dockerfile + nginx.conf with COEP/COOP headers)
* ✅ Feeder hiss (proximity-scaled, 6-node comb-filter pool)
* ✅ Feeder crackle (debounced one-shot, tram+listener proximity)
* ✅ Drone (powerline proximity, 20m→5m fade)
* ✅ TramEngine API URL fixed (Zürich prefix + encodeURIComponent)
* ✅ ProximityEngine.calculate() now receives listener coordinates
* ✅ UI cards updating with live data
* ✅ Feeder markers turning red on tram proximity
* ✅ GCP hosting and deployment
* ⬜ User testing (3-5 people)

**Dropped from Phase 1:**

* pole-ping sound layer — dropped entirely
* district-theme — deferred to later phase
* RNBO/Max MSP validation — deferred; Web Audio API is production path
* Three.js — dropped entirely

---

### **Docker Architecture**

Docker is introduced in Phase 1 to provide a reproducible build and deployment environment. RNBO compilation, Node.js tooling, and extraction scripts all run inside the container regardless of host machine, so there is no configuration drift between development and production. If the laptop gets replaced, the entire build environment is recreated from the Dockerfile.

**Single Dockerfile, Multi-Stage Build:**

* **Stage 1 (build):** Node.js image. Runs Vite build, extraction scripts, and produces the full set of static assets (HTML, JS, GeoJSON). GeoJSON data files are served from the `public/` directory. RNBO WASM compilation will be added to this stage once Max/MSP licences are in place.
* **Stage 2 (serve):** Nginx image. Copies compiled assets from Stage 1. Serves static files over HTTPS with COEP/COOP headers preserved in `nginx.conf`. This is what deploys to GCP.

**Development Workflow:**

* Edit source files in VS Code on the host machine
* Dev server via `npx vite --host`; Cloudflare Tunnel (`npx cloudflared tunnel --url http://localhost:8080`) provides HTTPS for Android Chrome field testing (documented in `STARTUP.md`)
* Serve the Docker build locally for testing (`docker run -p 8080:80`)

**Production Deployment:**

* Build the image (`docker build -t hidden-infrastructures .`)
* Push to Google Container Registry or Artifact Registry
* Run on GCP via Cloud Run or Compute Engine
* Same image that was tested locally runs in production

**Future (Phase 2+):** If additional services are needed (e.g. a caching proxy for the tram API), migrate to Docker Compose. For now, a single Dockerfile keeps things simple.

---

### **Phase 2: Infrastructure Expansion (April, 4 weeks)**

Phase 2 adds the remaining five infrastructure types to the prototype route (water, sewage, electricity, telecom, and Fernwärme). Geodata extraction for all layers is complete. Remaining work is ProximityEngine integration and audio synthesis for each layer.

**Step 1: Water Supply Layer**

* ✅ Download WVZ Leitungskataster (GeoShop DXF, multiple tile orders)
* ✅ Extract District 1 data → `public/lk-water.geojson` (3,339 pipes + 1,424 fittings)
* ✅ Write `scripts/extract-water-infrastructure.py` (single-DXF extractor with pipe/node split, POLYLINE + LWPOLYLINE support, function code filtering)
* ✅ Write `scripts/extract-lk-geojson.js` (multi-tile batch extractor, all layers, deduplication)
* ✅ Update ProximityEngine for water layer (50m pipes / 25m fittings); hydrant exclusion (LKZ1322-MSU-)
* ✅ Audio synthesis: proximity-scaled bandpass noise burst on entry (pipe 800Hz / fitting 1200Hz, 30s cooldown); fitting cluster drip rate (2800Hz, ±25% jitter); pipe crossing one-shot knock (380Hz); alongside loop (~3.5s ±30% jitter)
* **Deliverable:** Water layer fully functional ✅

**Step 2: Sewage Layer**

* ✅ Download ERZ Abwasser-Werkleitungsdaten (GeoShop DXF)
* ✅ Extract District 1 data → `public/lk-sewage.geojson` (pipes only, manholes and secondary lines excluded)
* ✅ Update ProximityEngine: 80m continuous rumble; junction cluster detection (8m endpoint snap); crossing/alongside via `extendLinesWithMovement`
* ✅ Audio synthesis: looped lowpass rumble (gain modulated by distance); rhythmic gurgle below 20m (random 1.25–5s interval); junction thud on entry (55Hz, 10s cooldown); pipe crossing transient (200Hz); alongside loop (~4s ±35% jitter)
* **Deliverable:** Sewage layer fully functional ✅

**Step 3: Electricity & Telecom Layers**

* ✅ Download ewz Werkleitungsdaten (GeoShop DXF)
* ✅ Extract electricity → `public/lk-electricity.geojson` (7,223 features: underground cables + nodes; area footprints excluded)
* ✅ Extract telecom → `public/lk-telecom.geojson` (8,301 features: Swisscom + UPC cables + nodes; overhead excluded)
* ✅ ProximityEngine: electricity 40m nodes / 40m cables; telecom 40m nodes / 30m cables; both LineString layers use `extendLinesWithMovement`
* ✅ Electricity audio: 8-slot sawtooth oscillator pool (1490–1510Hz spread, +3Hz beating per slot); node cluster density gain multiplier (up to 1.8× at 5+ nodes within 30m); cable crossing snap (2200Hz); alongside loop (~5s ±40% jitter)
* ✅ Telecom audio: 4-slot amplitude-gated burst pool (5000–6800Hz, LFO gates at 22/38/54/78Hz per slot); cable density modulates LFO rate (0.5–2.0×); node dwell handshake chirp after 5s (1→8kHz, 8s cooldown); cable crossing click (3500→6000Hz); alongside loop (~4s ±45% jitter)
* **Deliverable:** Electricity and telecom layers fully functional ✅

**Step 4: Fernwärme Layer**

* ✅ Download SIA405 LKMap DXF (GeoShop, included in tile orders)
* ✅ Extract District 1 data → `public/lk-fernwaerme.geojson` (198 pipe features)
* ✅ Added as sixth infrastructure layer — discovered in GeoShop data, fits project theme (genuinely hidden, unknown to most users)
* ✅ ProximityEngine: 30m radius (tightened from 60m for dramatic encounters); `extendLinesWithMovement` for crossing/alongside; `nearestSegmentBearing` computes bearing from listener to nearest point on nearest pipe segment
* ✅ Audio synthesis: 60Hz sine + 0.3Hz tremolo (carrier-gain LFO, not master, prevents bleed); StereoPanner driven by pipe bearing relative to listener heading; fast ramp-in (0.4s time constant); thermal crossing burst (60Hz, 0.5s); alongside loop (~6s ±40% jitter)
* **Deliverable:** Fernwärme layer fully functional ✅

**Step 5: Multi-Layer Integration & Audio Enrichment**

* ✅ 6-layer audio mixing with per-layer LAYER_ENABLED toggle
* ✅ User controls (toggle buttons per layer)
* ✅ Spatial culling in ProximityEngine (bounding-box pre-filter, all layers)
* ✅ Line-crossing / alongside detection for all 5 LineString layers (water pipes, sewage pipes, electricity cables, telecom cables, fernwärme pipes) via `extendLinesWithMovement` helper (cross-product sign test + acute angle threshold 35°, ALONGSIDE_RADIUS 20m)
* ✅ Shared density reverb bus: 5 continuous-gain outputs (drone, sewage, elec, telecom, fern) send to shared convolver; wet level driven by active layer count (0→6 layers); exponential curve 0.007–0.07 wet (kicks in at 2+ overlapping layers, peaks at all 6); makes Bahnhofstrasse multi-layer overlap noticeably richer
* ✅ `scripts/import-new-tiles.js` — scans `data/raw/GeoShop` for new `order_*` dirs, diffs against `data/processed/.processed-orders.json` manifest, runs extractor if new tiles found, updates manifest; 30 orders now processed (55297–55476)
* **Deliverable:** Complete multi-infrastructure experience, event-driven audio, shared spatial depth ✅

**Milestone 2:** End of April — All 6 infrastructure types working, line-event detection, density reverb ✅

---

### **Phase 3: District 1 Expansion + Sound Design (May, 4 weeks)**

Phase 3 scales from a linear prototype route to a full geographic experience. The extraction scripts developed in Phase 2 are broadened from route-based filtering to district boundary filtering, expanding the dataset from ~366 infrastructure elements on the prototype route to an estimated 4,000-5,000 across all of postal code 8001. This introduces the need for spatial culling in the ProximityEngine to maintain performance. At the same time, the fixed-route constraint is removed in favour of free-roam GPS exploration. The second half of the phase focuses on production sound design, authoring all six Max/MSP patches and exporting them via RNBO to replace the placeholder Web Audio API synthesis.

Note: district-scale GeoJSON is already available from the GeoShop extraction (the current `lk-*.geojson` files cover the full District 1 bounding box, not just the prototype route). Geographic expansion may therefore be simpler than originally estimated — primarily a ProximityEngine culling update rather than a data re-extraction.

**Step 1: Geographic Data Expansion**

* \[ \] Verify `lk-*.geojson` coverage matches full District 1 boundary (bbox check confirms data extends across 8001)
* \[ \] Add spatial culling to ProximityEngine (200m audio culling distance, handles current total of ~11,000 features across all layers)
* \[ \] Test spatial culling performance at full district scale
* **Deliverable:** Full District 1 geodata confirmed loaded and culled

**Step 2: GPS Free-Roam**

GPS free-roam was completed in Phase 1. This step is done.

* ✅ Raw device GPS via `navigator.geolocation.watchPosition()` feeding coordinates directly to ProximityEngine
* \[ \] Dynamic infrastructure loading (only render elements within 200m of user, cull further by layer type)
* **Deliverable:** Free-roam exploration in District 1

**Step 3: Production Sound Design**

Each infrastructure layer will require one or more Max/MSP patches to cover its range of sonic behaviours (continuous drones, triggered events, proximity-modulated textures). Patches are authored in Max/MSP and exported via RNBO to replace the placeholder Web Audio API synthesis.

* \[ \] Tram electrical: rich, dynamic, responsive
* \[ \] Water: hydraulic pulse, flow textures
* \[ \] Sewage: deep bass, underground character
* \[ \] Electricity: transformer hum, voltage fluctuations
* \[ \] Telecom: data chirps, fiber whispers
* \[ \] Fernwärme: slow thermal pulse, warm low rumble (sparse encounters — discovery moment character)
* \[ \] District theme: procedural electronic, Altstadt character
* \[ \] Export all patches via RNBO, integrate into application
* \[ \] Parameter mapping refinement
* \[ \] Mix balancing across all layers
* **Deliverable:** Production-quality multi-layer audio system

**Milestone 3:** End of May — Full District 1, free-roam, production audio

---

### **Phase 4: PWA & Launch (June–August, 12 weeks)**

Phase 4 wraps the working application into a production-quality Progressive Web App and takes it public. The audio system and infrastructure layers are complete by this point — the work here is making the experience robust, installable, and offline-capable, then testing it with real users walking real routes. The UI remains minimal by design (this is an audio-first experience), but needs to handle GPS permissions, layer controls, and battery management gracefully. The phase ends with public launch, documentation, and a launch event.

**Week 1-2: User Interface**

The interface will be designed using standard UX methods, prioritising a minimal screen presence that stays out of the way of the audio experience.

* UX design process: user flows, wireframing, and iterative prototyping
* Minimal on-screen elements (audio-first)
* Layer toggles (tram electrical / water / sewage / electricity / telecom / Fernwärme / district theme)
* Options page: score recording and archive sharing, local audio download
* **Deliverable:** Functional UI

**Week 3-4: Progressive Web App**

A Service Worker caches all static assets (HTML, JS, compiled RNBO WASM patches, GeoJSON infrastructure data) on first load, so the app runs offline after initial visit. A Web App Manifest makes it installable to the home screen without an app store.

* Service worker for offline capability
* Web App Manifest (installable)
* Cache geodata and compiled audio patches
* **Deliverable:** PWA works offline

**Week 5-6: User Testing**

Recruited testers explore District 1 freely with the production app and provide structured feedback. Findings are prioritised into critical bugs, audio mix issues, and UX improvements.

* 5-10 beta testers free-roam District 1
* Collect feedback
* Fix critical bugs
* Refine audio mix based on real-world use
* **Deliverable:** Beta-tested experience, survey data analysis

**Week 7-8: Documentation & Polish**

All project documentation is finalised for public release — a user-facing guide explaining how to experience the work, technical documentation for the open-source repository, a demo video capturing the walk, and press kit materials for media outreach.

* User guide
* Technical documentation
* Demo video (3-5 min)
* Press kit materials
* **Deliverable:** Launch-ready materials

**Week 9-10: Public Launch**

The containerised app is deployed to the production URL on GCP. Launch is announced through social media, local Zurich groups, and relevant sound art / digital arts channels.

* Deploy to production URL
* Production smoke testing (GPS, audio, PWA install, offline mode, cross-device)
* Announce on social media, local groups
* Gather testimonials
* **Deliverable:** Public release

**Milestone 4:** Public launch, August 2026

---

### **Walk Recording & Score Archive**

**Timeline:** Candidate for Phase 4 or post-launch

**Conceptual framing:** Data collection happens all the time by default. Every app on a user's phone is silently harvesting location data, usage patterns, and device fingerprints — this is so normalised that most people don't think about it. Hidden Infrastructures collects nothing: no GPS logs, no user accounts, no analytics, no tracking. By then explicitly offering the option to record and share something — and making that something purely musical — the project draws attention to what it is *not* doing. The only data that can leave the device is the interaction between the listener and the procedural synthesis engine. The archive feature turns the project's privacy-by-design principle from a passive technical decision into an active artistic statement.

**Local Audio Download**

Users can record the audio output of their walk and download it to their device. This captures the mixed output of the Web Audio graph — all active layers as heard through headphones — via the MediaRecorder API connected to a MediaStreamDestination node. The recording happens entirely client-side and never touches a server. Users choose their preferred format (WAV, OGG/Opus, or MP3) before starting the recording.

**Score Archive (Web)**

Rather than storing audio, the archive captures the "score" of each walk — the timestamped stream of parameter and control data sent to the synthesis patches during the experience. This includes proximity values, trigger events (e.g. tram passing a feeder), layer mix levels, and synthesis parameter changes, all timestamped relative to walk start. The score is a lightweight JSON file containing only the interaction between the listener's movement and the synthesis engine — no GPS coordinates, no compass headings, no device information, nothing that could reconstruct the user's physical path.

At the end of a walk, the user can optionally share their score to a public web archive. A playback page on the site loads the same patches and replays any archived score, regenerating the audio in the browser. Every score produces a unique composition shaped by an individual's path through the infrastructure, but the archive reveals nothing about where that person actually walked.

**Privacy compliance:** The score data is infrastructure-interaction data, not location data. It records *what the synth engine did*, not *where the user was*. Two different routes through District 1 could produce similar parameter streams if they pass the same density of infrastructure, making scores non-invertible to physical paths.

**Storage:** Scores are small (timestamped JSON, likely a few hundred KB per 30-minute walk), so archive hosting costs are negligible. No database of user accounts — scores are anonymous contributions.

**Technical requirements:**

* MediaRecorder API + MediaStreamDestination node (local download)
* Parameter logging middleware between ProximityEngine/SpatialAudioController and synthesis patches (score capture)
* Simple server endpoint or static file store for score submission (archive)
* Score playback page that loads patches and feeds them the archived parameter stream

---

## **Technical Stack**

### **Frontend**

* **HTML/CSS/JavaScript** — PWA foundation
* **Vite** — dev server and build tooling
* **Web Audio API** — Synthesis (current development path), spatial positioning (PannerNode HRTF), distance attenuation, mixing
* **RNBO** — Max/MSP → WebAssembly compilation for production audio patches (planned; licence pending)
* **Geolocation API** — GPS position
* **DeviceOrientation API** — Compass heading (planned; Phase 1 remaining)

### **Backend**

* **Google Cloud Platform** — Existing GCP account, containerised deployment via Cloud Run or Compute Engine
* **Cloud Firestore** — Cache tram data (free tier)
* **Cloud Functions** — API aggregation (free tier)

### **Data Sources**

* **VBZ Infrastruktur OGD** — Tram infrastructure geodata (confirmed access)
* **transport.opendata.ch** — Live tram positions (confirmed working)
* **GeoShop (Stadt Zürich)** — DXF tile deliveries for all 6 infrastructure layers (18 orders, downloaded)
* **Route data** — Already extracted and processed

### **Extraction Scripts**

* `scripts/extract-lk-geojson.js` — Batch DXF extractor for all GeoShop layers; handles multi-tile deduplication, LV95→WGS84 via proj4, layer routing by regex
* `scripts/import-new-tiles.js` — Automated tile ingestion: scans `data/raw/GeoShop` for new `order_*` dirs, diffs against `data/processed/.processed-orders.json`, runs extractor for new tiles, updates manifest; 30 orders processed to date
* `scripts/extract-water-infrastructure.py` — Single-DXF water extractor; outputs pipes and nodes as separate files; uses ezdxf (handles POLYLINE + LWPOLYLINE)
* `scripts/extract-route-waypoints.js` — Route waypoint extraction from VBZ powerline geometry (A* path-stitching, Union-Find merge, arc-length sampling)

### **Audio Production**

* **Max/MSP** — Patch design (desktop)
* **RNBO** — Max/MSP → WebAssembly compilation for browser deployment

---

## **Critical Path**

**Phase 0 (March):** Web Audio API synthesis + engine stub integration, Mercator projection, haversine proximity calculations, feeder triggers. Data pipeline proven end to end. ✅

**Phase 1 (Late March – Early April):** Real engine integration, GPS, spatial audio via PannerNode, Docker build environment, GCP hosting, tram layer to production quality. ✅

**Phase 2 (April):** Geodata for all 6 layers extracted and filtered ✅. ProximityEngine integration complete ✅. Web Audio API synthesis for all 6 layers complete ✅. Tram electrical refactored into audio-layers.js ✅. Per-layer toggle UI ✅. Audio lifecycle (Unlock/Start/Stop) stable ✅. Line-crossing/alongside detection for all 5 LineString layers ✅. Layer-appropriate crossing transients (knock/snap/click/burst) ✅. Alongside loops ✅. Fernwärme bearing panning + 30m radius ✅. Shared density reverb bus (0–6 layers, 0–0.07 wet) ✅. 30 GeoShop tile orders processed ✅. Automated tile ingestion script ✅. Deployed to Cloud Run ✅. Remaining: field validation of all 6 layers, multi-layer mix tuning.

**Phase 3 (May):** Geographic expansion to full District 1 (postal code 8001) — district-scale GeoJSON already available, primarily a ProximityEngine culling update. GPS free-roam already complete. Production Max/MSP patches exported via RNBO across all layers.

**Phase 4 (June–August):** UI design, PWA deployment (Service Worker, offline caching, Web App Manifest), user testing, documentation, public launch.

Development continues regardless of funding outcome.

---

## **Risk Mitigation**

### **Technical Risks**

**GPS accuracy in urban canyons**

* **Mitigation:** ProximityEngine trigger radii are already wide enough (30-200m depending on layer type) to tolerate GPS drift of 10-30m typical in urban canyons. Position smoothing via exponential moving average on incoming `watchPosition()` coordinates dampens jitter without adding perceptible lag at walking speed. Compass heading from `DeviceOrientationEvent` may be distorted by steel buildings, but spatial audio panning tolerates several degrees of error without audible impact.
* **Fallback:** The experience degrades softly — wider GPS scatter means slightly less precise spatial positioning, but infrastructure sounds still respond to proximity. No hard failure mode.

**Battery drain**

* **Mitigation:** GPS updates via `watchPosition()` with `maximumAge` set to 5 seconds to limit fix frequency. Spatial culling already reduces the Web Audio graph size by only connecting PannerNodes for infrastructure within 200m. Audio nodes for out-of-range infrastructure are disconnected and released, not just muted.
* **Fallback:** Reduce culling radius, increase GPS interval, or suspend non-essential layers. Specific thresholds to be determined through real-device testing in Phase 1.

**Audio source overload at district scale**

* **Mitigation:** Spatial culling at 200m radius reduces the working set from ~11,000 total features across all layers to ~50-100 nearby. Within that set, each layer type has its own audible radius (tram feeders 30m, water 100m, substations 200m), so not all culled elements are producing audio simultaneously. A fixed pool of pre-allocated Web Audio nodes (target 50-100) is recycled as infrastructure enters and leaves range, avoiding garbage collection pauses from node creation/destruction. Toggling a layer off in the UI disconnects its nodes from the audio graph entirely, freeing pool capacity.
* **Fallback:** If performance drops on a given device, reduce the pool size or tighten the culling radius. Most distant elements are dropped first — the experience thins out rather than breaking.

**RNBO patch performance on lower-end devices**

* **Mitigation:** Each active audio node runs its own compiled WASM patch instance, so CPU load scales with pool size. Patches are kept lightweight by design (oscillators, filters, envelopes — no heavy FFT or convolution). The audio source pool caps the maximum number of simultaneous WASM instances. Testing on older devices during Phase 1 establishes a performance baseline early.
* **Fallback:** Reduce pool size or simplify patch complexity first. Direct Web Audio API synthesis as a fallback requires no recompilation — the placeholder synthesis used in Phase 0 can be retained for any layer where RNBO performance is insufficient.

**Docker/deployment complexity**

* **Mitigation:** Single Dockerfile with multi-stage build, same image in dev and production. The app is ultimately static files (HTML, JS, WASM, GeoJSON), so Docker adds convenience but not dependency.
* **Fallback:** Deploy static files directly to a GCP Cloud Storage bucket behind a load balancer. No containerisation required — the app works the same way.

### **Sound Design Risks**

**Sonic clarity with dense infrastructure**

* **Challenge:** Full District 1 has ~11,000 infrastructure features across all layers — risk of sonic mud rather than legible layers.
* **Mitigation:** Frequency separation by design — each layer occupies a distinct part of the spectrum (sewage in the bass, electricity in the mids, telecom in the highs). Spatial separation reinforces this: elements are positioned around the listener via Web Audio API PannerNode, so dense infrastructure reads as spatial texture rather than a wall of sound. Per-layer mix controls give the user agency. User testing in Phase 4 validates legibility.

**District theme composition**

* **Challenge:** Creating compelling procedural generative music is difficult — the theme needs to work as a foundation that infrastructure sounds perform atop, across infinite walk variations.
* **Mitigation:** Start with a simple ambient foundation (sustained tones, slow harmonic drift) and iterate based on how the infrastructure layers interact with it. The infrastructure layers carry the experience; the theme enhances but isn't load-bearing. If generative composition doesn't produce satisfying results, a well-crafted static ambient bed still functions.

---

## **Success Criteria**

### **Technical**

* \[ \] PWA loads on iOS Safari and Android Chrome
* \[ \] GPS accuracy within 10m in District 1
* \[ \] Audio responds to compass heading within 100ms
* \[ \] No audio dropouts during 30-min walk
* \[ \] Battery drain <25% over full District 1 exploration
* \[ \] Works offline after initial cache
* \[ \] All 6 infrastructure layers render simultaneously
* \[ \] Spatial culling handles ~11,000 infrastructure features

### **Experiential**

* \[ \] 15+ user testing participants complete experience
* \[ \] 70%+ would recommend to others
* \[ \] Users report "seeing infrastructure differently"
* \[ \] Tram/water/data events create synchronised experiences
* \[ \] Clear sonic differentiation between 6 infrastructure types
* \[ \] District 1 theme provides coherent musical foundation
* \[ \] Free-roam exploration feels natural and compelling

### **Artistic**

* \[ \] Sonification is legible (users understand 6 layers)
* \[ \] Balances data fidelity with aesthetic beauty
* \[ \] Creates new perception of urban infrastructure
* \[ \] Celebrates (not critiques) hidden systems
* \[ \] Documented with high-quality video/photos
* \[ \] Each infrastructure type has distinct sonic character

### **Launch (August 2026)**

* \[ \] 100+ completed journeys in first 3 months
* \[ \] 70%+ completion rate (users explore, don't abandon)
* \[ \] Positive media coverage (1+ Zurich publication)
* \[ \] GitHub repo public with documentation
* \[ \] Stadt Zürich acknowledges project in digital arts context
* \[ \] Open-source code enables adaptation to other cities

---

## **Budget**

**Total: CHF 12,819** (Stadt Zürich Digitale Künste application)

### **Infrastructure & Hosting (CHF 1,200)**

* Hosting (Google Cloud Platform): Existing GCP account. Static assets served via Cloud Storage + Cloud CDN or Cloud Run container. Estimated CHF 5-10/month at expected traffic levels (~CHF 100/year)
* Domain + SSL certificates: CHF 100/year
* CDN/asset hosting (Cloudflare): CHF 300/year
* Backup storage: CHF 200/year
* Development/testing environments: CHF 500

### **Development Hardware (CHF 2,500)**

* Replacement laptop (current machine failing): CHF 2,500

### **Artistic Development (CHF 6,119)**

* Infrastructure layer sound design (6 layers): CHF 4,000
  * Tram electrical (placeholder synthesis complete, production Max/MSP patch pending): CHF 0
  * Water supply sonification: CHF 1,000
  * Sewage/wastewater sonification: CHF 1,000
  * Electricity grid sonification: CHF 1,000
  * Telecommunications/fiber sonification: CHF 1,000
  * Fernwärme / district heating sonification (sparse network — included within budget envelope): CHF 0
* District 1 musical theme composition: CHF 1,500
  * Procedurally-generated electronic theme reflecting district character
* Audio software licences: CHF 619
  * Max/MSP permanent licence: CHF 354
  * RNBO permanent licence: CHF 265

### **Testing & Iteration (CHF 1,500)**

* User testing sessions (15 participants): CHF 900
* Technical optimisation across 6 layers: CHF 600

### **Public Presentation (CHF 1,500)**

* Launch event (venue, promotion): CHF 1,000
* Documentation (video, photography): CHF 400
* Promotional materials (website, social media): CHF 300

**Post-launch annual costs:** ~CHF 500 (GCP hosting + domain)

---

**Document Version:** 3.4
**Last Updated:** April 2026
**Next Review:** End of Phase 3 (field validation + production sound design)
