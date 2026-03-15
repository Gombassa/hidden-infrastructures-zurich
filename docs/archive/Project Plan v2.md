# **Invisible Infrastructures: Zurich**

## **Project Plan \- 5 Infrastructure Layers, District 1**

## **Executive Summary**

Invisible Infrastructures is a Progressive Web App that makes Zurich's hidden infrastructure audible through spatial audio as you walk through District 1\. Five layers of urban systems are sonified in real-time using procedurally generated audio driven by actual municipal geodata. All audio is generated through real-time procedural synthesis; the application contains no samples or pre-rendered audio assets.

The app collects zero personal data. GPS coordinates are processed entirely on-device and never transmitted. There are no user accounts, no analytics, no tracking. In a landscape where data collection happens by default, this absence is a deliberate artistic statement, not just a technical decision. The project makes this visible by offering the only thing it *can* share: users may optionally record the "score" of their walk: the timestamped parameter and control data sent to the synthesis engine: and contribute it to a public archive. The archive contains music, not surveillance. Scores can be replayed through the same patches to regenerate the audio of any walk, but they reveal nothing about where the person actually was.

**The Experience:**

* Walk anywhere in District 1 (postal code 8001, Altstadt)  
* Hear 5 layers of urban infrastructure as spatial soundscapes:  
  * Tram electrical (600V DC overhead wires, feeders, poles)  
  * Water supply (pipes, pumps, flow)  
  * Sewage (treatment, drainage, underground)  
  * Electricity grid (transformers, distribution, voltage)  
  * Telecommunications (fiber, cellular, data)  
* Plus: District 1 musical theme (procedural electronic ambient)  
* Real-time events: trams passing, water flowing, data transmitting  
* Download a recording of your walk or share your score to a public archive  
* Infrastructure becomes visceral and tangible

**Development Strategy:**

* **Phase 1 (March):** Tram network complete on prototype route (2.7km)  
* **Phase 2 (April):** Add 4 infrastructure types on same route  
* **Phase 3 (May):** Expand to full District 1 free-roam \+ production audio  
* **Phase 4 (June-Aug):** PWA, testing, launch

The project focuses on District 1 (postal code 8001), where all five infrastructure datasets are publicly accessible through Stadt Zürich's open data portal (VBZ, WVZ, ERZ, ewz). The tram network has already validated the technical workflow from raw geodata through to spatial audio. Much of the infrastructure is physically visible: overhead wires, manhole covers, transformer boxes: which anchors the sonic experience to things the listener can actually see. Real-time tram data adds a live, dynamic layer that changes with every walk. The district is compact enough to build and test within the project timeline, but the architecture is designed to expand to Districts 2-6 in future.

## **Current Development Status**

### **Core Engines**

Three JavaScript engines totalling 498 lines of tested code form the core of the application. Together they create a real-time loop: the TramEngine tracks where trams are, the ProximityEngine determines which infrastructure is near the listener and which trams are near that infrastructure, and the ListenerEngine represents the user's position and orientation in space. These three components feed the spatial audio system: their outputs become the parameters that drive the Pure Data patches.

**TramEngine.js** (180 lines) fetches real-time tram positions from transport.opendata.ch, interpolates movement between 6 stop pairs, and updates every 10 seconds. Working and tested.

**ProximityEngine.js** (125 lines) calculates distances between trams and infrastructure, triggers audio events when trams pass feeders (30m radius), and tracks tram density near substations (150m radius). Working and tested.

**ListenerEngine.js** (193 lines) simulates walking along the prototype route (75 waypoints, 2.7km), calculates heading for spatial audio, and updates position every second. Working and ready for GPS swap in Phase 3\.

### **Data Layer**

The data layer provides the geographic coordinates of every piece of physical infrastructure that the audio system sonifies: without this, there is nothing to position in space.

**Tram infrastructure** from VBZ has been downloaded and processed into four GeoJSON/JSON files:

* `route-tram-powerlines.geojson`: 1,689 overhead wire segments  
* `route-tram-masts.geojson`: 258 support poles  
* `route-tram-feeders.geojson`: 366 power feeders  
* `route-waypoints.json`: 75 route points (2,682m)

**Route processing pipeline** (`scripts/extract-route-waypoints.js`) takes the raw VBZ overhead wire GeoJSON (1,689 LineString segments) and produces a clean set of 75 waypoints covering 2,682m. The pipeline builds a graph from the wire segments, merges parallel northbound/southbound tracks using a Union-Find algorithm with 5m snap tolerance, runs A\* pathfinding through forced stops (Stadelhofen → Bellevue → Paradeplatz → Rennweg → HB → Bürkliplatz), and downsamples to uniform arc-length intervals. Arc-length sampling was chosen over Ramer-Douglas-Peucker because the route retraces Bahnhofstrasse (north to HB, then south to Bürkliplatz): RDP would collapse this U-shaped path, while arc-length preserves experiential distance at \~35m per waypoint for smooth spatial audio updates.

These algorithms are reusable across all infrastructure types in Phase 2, adapted for each type's characteristics: water pipes (network graph, no parallel track issue), sewage collectors (gravity-driven topology), electricity grid (radial distribution from substations), and fiber optic (point-to-point connections).

**Remaining data sources** for Phase 2 are all accessible through Stadt Zürich's open data portal:

* Water supply (WVZ Leitungskataster): 1,550 km network citywide  
* Sewage (ERZ Abwasser-Werkleitungsdaten): treatment facilities, drainage, main collectors  
* Electricity & telecom (ewz Werkleitungsdaten): distribution network, transformers, substations, fiber optic nodes

**Real-time API:** transport.opendata.ch confirmed working.

### **Audio Synthesis Pipeline**

The WebPd compilation workflow has been validated with two test patches: `feeder-event.pd` (percussive trigger) and `substation-drone.pd` (continuous hum), both compiled to WASM and confirmed running simultaneously in the browser. This is a technical proof only: production sound design is pending.

---

## **Development Phases**

### **Phase 0: Pre-Funding MVP: Tram Demo (March 15-23, 1 week)**

The goal of Phase 0 is a working tram network experience by March 22 to include as a proof-of-concept video with the funding application. This is a zero-budget sprint: all data and code already exist, so the work is purely integration: wiring the three existing engines together with spatial audio and GPS.

**What's Already Ready:**

* ✅ 3 working engines (498 lines tested code)  
* ✅ VBZ tram data downloaded (1,689 wires, 366 feeders, 258 poles)  
* ✅ WebPd compilation workflow validated  
* ✅ Route simulation working

**Weekend 1 (March 15-16, Saturday-Sunday):**

* \[ \] Create `index.html` with Three.js \+ WebPd imports  
* \[ \] Wire TramEngine → ProximityEngine → simple audio trigger  
* \[ \] Convert lat/lng → 3D coordinates (Mercator projection)  
* \[ \] Position 1-2 test audio sources in space  
* \[ \] Test with browser console.log() to verify data flow  
* **Deliverable:** Data pipeline proven (engines → spatial coordinates)

**Monday-Tuesday (March 17-18, evenings):**

* \[ \] Add Three.js PositionalAudio system  
* \[ \] Position all 366 feeders in 3D space  
* \[ \] Create simplest possible Pure Data patch: `tram-beep.pd` (single oscillator)  
* \[ \] Compile to WebPd, load in HTML  
* \[ \] Test with ListenerEngine simulation  
* **Deliverable:** Positioned audio responding to simulated walk

**Wednesday-Thursday (March 19-20, evenings):**

* \[ \] Replace ListenerEngine simulation with device GPS  
* \[ \] Add compass heading (DeviceOrientation API)  
* \[ \] Implement spatial culling (only render nearby sources)  
* \[ \] Test walking around your neighborhood  
* \[ \] Fix any critical GPS/orientation bugs  
* **Deliverable:** GPS-driven spatial audio working

**Friday (March 21, evening):**

* \[ \] Test walking the actual Zurich route  
* \[ \] Record 1-2 minute demo video on phone  
* \[ \] Take screenshots of working app  
* \[ \] Fix show-stopper bugs only  
* **Deliverable:** Video demo for funding application

**Saturday (March 22, target completion):**

* \[ \] Write 1-page README.md for repo  
* \[ \] Clean up code (remove debug logging)  
* \[ \] Optional: add very basic UI (start/stop button)  
* \[ \] Final test walk \+ video  
* **Deliverable:** ✅ MVP COMPLETE \- ready for funding submission

**Sunday (March 23, buffer day):**

* Contingency for unexpected issues  
* Or: rest before funded development begins

**Phase 0 MVP Scope:**

* ✅ Tram network only (1 infrastructure type)  
* ✅ Prototype route only (2.7km Stadelhofen → Bürkliplatz)  
* ✅ Basic spatial audio (positioned sources, distance attenuation)  
* ✅ GPS \+ compass integration  
* ✅ Real tram triggers (via transport.opendata.ch API)  
* ✅ Simplest possible Pure Data patch (just proves audio works)

**Explicitly NOT in Phase 0:**

* ❌ Production-quality sound design  
* ❌ UI/polish/styling  
* ❌ PWA features (offline, service worker)  
* ❌ Other infrastructure types (water, sewage, etc.)  
* ❌ District musical theme  
* ❌ Full District 1 expansion  
* ❌ User testing

**Success Criteria (by March 22):**

* \[ \] Video shows: walking route with phone  
* \[ \] Headphones play positioned tram network hum  
* \[ \] Tram passing overhead triggers audio event  
* \[ \] GPS updates change audio perspective  
* \[ \] Compass heading affects left/right/front/back positioning  
* \[ \] Demo is compelling enough to include with funding application

**Technical Risk: LOW**

* All components already validated individually  
* Just need integration (wiring existing pieces)  
* 1 week is tight but achievable for basic demo

**Outcome:** Working demo by March 22 to strengthen funding application with proof-of-concept video.

---

### **Phase 1: Tram Network Production (3 weeks, March 22 – April 6\)**

Phase 1 shifts from proof-of-concept to a polished tram layer experience. This means setting up the Docker build environment and GCP hosting, refining the placeholder audio patches to production quality, and running initial user tests. The tram layer serves as the foundation that all subsequent infrastructure layers build on, so the goal here is to get it right before adding complexity.

**Week 1 (March 22-30):**

* \[ \] Set up Docker build environment (see Docker Architecture below)  
* \[ \] Set up proper hosting (Google Cloud Platform)  
* \[ \] Deploy containerized app to GCP  
* \[ \] Refine `wire-drone.pd` with better synthesis  
* \[ \] Add `pole-ping.pd` for geometric markers  
* \[ \] Add `district-theme.pd` basic ambient layer  
* \[ \] Optimize performance and battery usage  
* **Deliverable:** Polished tram experience (3 patches), containerized build pipeline

**Week 2 (March 31-April 6):**

* \[ \] User testing with 3-5 people  
* \[ \] Fix bugs and refine audio mix  
* \[ \] Add basic UI controls  
* \[ \] Documentation update  
* **Deliverable:** Production-ready tram network

**Milestone 1 (Early April):** Complete tram network experience

---

### **Docker Architecture**

Docker is introduced in Phase 1 to provide a reproducible build and deployment environment. WebPd compilation, Node.js tooling, and extraction scripts all run inside the container regardless of host machine, so there is no configuration drift between development and production. If the laptop gets replaced, the entire build environment is recreated from the Dockerfile.

**Single Dockerfile, Multi-Stage Build:**

* **Stage 1 (build):** Node.js image with WebPd CLI installed. Compiles all .pd patches to .wasm, runs extraction scripts, produces the full set of static assets (HTML, JS, WASM, GeoJSON)  
* **Stage 2 (serve):** Nginx image. Copies compiled assets from Stage 1\. Serves static files over HTTPS with appropriate caching headers. This is what deploys to GCP

**Development Workflow:**

* Edit .pd patches in Pure Data on the host machine (normal desktop workflow)  
* Compile patches inside the container via a shell script or `docker run` command  
* Serve locally for testing (`docker run -p 8080:80`)  
* Host project directory mounted as a volume so edits are reflected without rebuilding

**Production Deployment:**

* Build the image (`docker build -t invisible-infrastructures .`)  
* Push to Google Container Registry or Artifact Registry  
* Run on GCP via Cloud Run or Compute Engine  
* Same image that was tested locally runs in production

**Future (Phase 2+):** If additional services are needed (e.g. a caching proxy for the tram API), migrate to Docker Compose. For now, a single Dockerfile keeps things simple.

---

### **Phase 2: Infrastructure Expansion (April, 4 weeks)**

Phase 2 adds the remaining four infrastructure types to the prototype route. Each step introduces a new data source from Stadt Zürich's open data portal, with a corresponding extraction script, ProximityEngine update, and placeholder Pure Data patch. Since this is all static geodata (no real-time API integration needed), these steps may move faster than the weekly estimates suggest. The extraction scripts reuse the core algorithms validated during tram data processing (graph building, haversine distance, arc-length sampling) adapted for each infrastructure type's characteristics. By the end of Phase 2, all five layers run simultaneously on the 2.7km route with basic audio.

**Step 1: Water Supply Layer**

* \[ \] Download WVZ Leitungskataster for route area  
* \[ \] Write `scripts/extract-water-infrastructure.js` (filter District 1 pipes and pumping stations, extract flow direction)  
* \[ \] Update ProximityEngine for water layer (100m radius for pipes)  
* \[ \] Create `water-flow.pd` patch (placeholder audio)  
* **Deliverable:** Water layer functional

**Step 2: Sewage Layer**

* \[ \] Download ERZ Abwasser-Werkleitungsdaten for route area  
* \[ \] Write `scripts/extract-sewage-infrastructure.js` (main collectors, treatment facilities, depth attributes, gravity-driven topology)  
* \[ \] Update ProximityEngine for sewage layer (150m radius for deep collectors)  
* \[ \] Create `sewage-rumble.pd` patch (placeholder audio)  
* **Deliverable:** Sewage layer functional

**Step 3: Electricity & Telecom Layers**

* \[ \] Download ewz Werkleitungsdaten for route area  
* \[ \] Write `scripts/extract-electricity-infrastructure.js` (substations, transformers, voltage level attributes)  
* \[ \] Write `scripts/extract-telecom-infrastructure.js` (fiber nodes, data hubs, capacity attributes)  
* \[ \] Update ProximityEngine for both layers (electricity: 200m substations / 50m transformers, telecom: 100m fiber nodes)  
* \[ \] Create `grid-hum.pd` and `data-chirp.pd` patches (placeholder audio)  
* **Deliverable:** All 5 infrastructure types functional

**Step 4: Multi-Layer Integration**

* \[ \] 6-layer audio mixing (5 infrastructure \+ 1 theme)  
* \[ \] User controls (toggle layers, adjust mix)  
* \[ \] Performance optimization (5x data volume vs Phase 1\)  
* \[ \] Test all layers simultaneously on full route  
* **Deliverable:** Complete multi-infrastructure experience on prototype route

**Milestone 2:** End of April: All 5 infrastructure types working on 2.7km route

---

### **Phase 3: District 1 Expansion \+ Sound Design (May, 4 weeks)**

Phase 3 is where the project scales from a linear prototype route to a full geographic experience. The extraction scripts developed in Phase 2 are broadened from route-based filtering to district boundary filtering, expanding the dataset from \~366 infrastructure elements on the prototype route to an estimated 4,000-5,000 across all of postal code 8001\. This introduces the need for spatial culling in the ProximityEngine to maintain performance. At the same time, the fixed-route constraint is removed in favour of free-roam GPS exploration: users can walk anywhere in District 1\. The second half of the phase focuses on production sound design, refining all six Pure Data patches from placeholders to finished compositions.

**Step 1: Geographic Data Expansion**

The Phase 2 extraction scripts filtered infrastructure to within 100m of the prototype route waypoints. For District 1 expansion, each script is modified to filter by postal code 8001 boundary coordinates instead, using the same core algorithms (graph building, haversine distance, 5m snap tolerance for tram parallel tracks). This is a filtering change, not a rewrite.

* \[ \] Modify `scripts/extract-tram-district1.js`: expand from 366 feeders (route) to \~1,000 (full district)  
* \[ \] Modify `scripts/extract-water-district1.js`: \~500 distribution points (WVZ Leitungskataster)  
* \[ \] Modify `scripts/extract-sewage-district1.js`: \~200 collectors (ERZ Abwasser)  
* \[ \] Modify `scripts/extract-electricity-district1.js`: \~300 substations/transformers (ewz)  
* \[ \] Modify `scripts/extract-telecom-district1.js`: \~100 fiber nodes (ewz)  
* \[ \] Add spatial culling to ProximityEngine (200m audio culling distance, handles \~4,000-5,000 total elements)  
* \[ \] Test spatial culling performance at full district scale  
* **Deliverable:** Full District 1 geodata loaded (4,000-5,000 elements)

**Step 2: GPS Free-Roam**

ListenerEngine currently interpolates position along a fixed sequence of 75 waypoints. Free-roam replaces this with raw device GPS via `navigator.geolocation.watchPosition()`, feeding coordinates directly to the ProximityEngine without route snapping.

* \[ \] Remove fixed route constraint from ListenerEngine  
* \[ \] Implement free-roam GPS: users can walk anywhere in District 1  
* \[ \] Dynamic infrastructure loading (only render elements within 200m of user, cull further by layer type)  
* **Deliverable:** Free-roam exploration in District 1

**Step 3: Production Sound Design**

Each infrastructure layer will require multiple Pure Data patches to cover its range of sonic behaviours (continuous drones, triggered events, proximity-modulated textures, etc.). The full patch list will emerge from the sound design process: the layers and their sonic directions are:

* \[ \] Tram electrical: rich, dynamic, responsive

* \[ \] Water: hydraulic pulse, flow textures

* \[ \] Sewage: deep bass, underground character

* \[ \] Electricity: transformer hum, voltage fluctuations

* \[ \] Telecom: data chirps, fiber whispers

* \[ \] District theme: procedural electronic, Altstadt character

* \[ \] Refine all patches to production quality

* \[ \] Parameter mapping refinement

* \[ \] Mix balancing across all layers

* **Deliverable:** Production-quality multi-layer audio system

**Milestone 3:** End of May: Full District 1, free-roam, production audio

---

### **Phase 4: PWA & Launch (June–August, 12 weeks)**

Phase 4 wraps the working application into a production-quality Progressive Web App and takes it public. The audio system and infrastructure layers are complete by this point: the work here is making the experience robust, installable, and offline-capable, then testing it with real users walking real routes. The UI remains minimal by design (this is an audio-first experience), but needs to handle GPS permissions, layer controls, and battery management gracefully. The phase ends with public launch, documentation, and a launch event.

**Week 1-2: User Interface**

The interface will be designed using standard UX methods, prioritising a minimal screen presence that stays out of the way of the audio experience.

* UX design process: user flows, wireframing, and iterative prototyping  
* Minimal on-screen elements (audio-first)  
* Layer toggles (tram electrical / water / sewage / electricity / telecom / district theme)  
* Options page: score recording and archive sharing, local audio download  
* **Deliverable:** Functional UI

**Week 3-4: Progressive Web App**

A Service Worker caches all static assets (HTML, JS, compiled WASM patches, GeoJSON infrastructure data) on first load, so the app runs offline after initial visit. A Web App Manifest makes it installable to the home screen without an app store.

* Service worker for offline capability  
* Web App Manifest (installable)  
* Cache route data and audio assets  
* **Deliverable:** PWA works offline

**Week 5-6: User Testing**

Recruited testers explore District 1 freely with the production app and provide structured feedback. Findings are prioritised into critical bugs, audio mix issues, and UX improvements.

* 5-10 beta testers free-roam District 1  
* Collect feedback  
* Fix critical bugs  
* Refine audio mix based on real-world use  
* **Deliverable:** Beta-tested experience, survey data analysis

**Week 7-8: Documentation & Polish**

All project documentation is finalised for public release: a user-facing guide explaining how to experience the work, technical documentation for the open-source repository, a demo video capturing the walk, and press kit materials for media outreach.

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

**Milestone 3:** Public launch, August 2026

---

### **Walk Recording & Score Archive**

**Timeline:** To be determined (candidate for Phase 4 or post-launch)

**Conceptual framing:** Data collection happens all the time by default. Every app on a user's phone is silently harvesting location data, usage patterns, and device fingerprints: this is so normalised that most people don't think about it. Invisible Infrastructures collects nothing: no GPS logs, no user accounts, no analytics, no tracking. By then explicitly offering the option to record and share something: and making that something purely musical: the project draws attention to what it is *not* doing. The only data that can leave the device is the interaction between the listener and the procedural synthesis engine. The archive feature turns the project's privacy-by-design principle from a passive technical decision into an active artistic statement.

**Local Audio Download**

Users can record the audio output of their walk and download it to their device. This captures the mixed output of the Web Audio graph: all active layers as heard through headphones: via the MediaRecorder API connected to a MediaStreamDestination node. The recording happens entirely client-side and never touches a server. Users choose their preferred format (WAV, OGG/Opus, or MP3) before starting the recording.

**Score Archive (Web)**

Rather than storing audio, the archive captures the "score" of each walk: the timestamped stream of parameter and control data sent to the WebPd patches during the experience. This includes proximity values, trigger events (e.g. tram passing a feeder), layer mix levels, and synthesis parameter changes, all timestamped relative to walk start. The score is a lightweight JSON file containing only the interaction between the listener's movement and the procedural synthesis engine: no GPS coordinates, no compass headings, no device information, nothing that could reconstruct the user's physical path.

At the end of a walk, the user can optionally share their score to a public web archive. A playback page on the site loads the same WebPd patches and replays any archived score, regenerating the audio in the browser. Every score produces a unique composition shaped by an individual's path through the infrastructure, but the archive reveals nothing about where that person actually walked.

**Privacy compliance:** The score data is infrastructure-interaction data, not location data. It records *what the synth engine did*, not *where the user was*. Two different routes through District 1 could produce similar parameter streams if they pass the same density of infrastructure, making scores non-invertible to physical paths.

**Storage:** Scores are small (timestamped JSON, likely a few hundred KB per 30-minute walk), so archive hosting costs are negligible. No database of user accounts: scores are anonymous contributions.

**Technical requirements:**

* MediaRecorder API \+ MediaStreamDestination node (local download)  
* Parameter logging middleware between ProximityEngine/SpatialAudioController and WebPd patches (score capture)  
* Simple server endpoint or static file store for score submission (archive)  
* Score playback page that loads WebPd patches and feeds them the archived parameter stream

---

## **Technical Stack**

### **Frontend**

* **HTML/CSS/JavaScript** \- PWA foundation  
* **Three.js** \- 3D spatial audio positioning  
* **WebPd** \- Pure Data → JavaScript compilation  
* **Web Audio API** \- Binaural panning, distance attenuation  
* **Geolocation API** \- GPS position  
* **DeviceOrientation API** \- Compass heading

### **Backend**

* **Google Cloud Platform** \- Existing GCP account, containerized deployment via Cloud Run or Compute Engine  
* **Cloud Firestore** \- Cache tram data (free tier)  
* **Cloud Functions** \- API aggregation (free tier)

### **Data Sources**

* **VBZ Infrastruktur OGD** \- Tram infrastructure geodata (confirmed access)  
* **transport.opendata.ch** \- Live tram positions (confirmed working)  
* **Route data** \- Already extracted and processed

### **Audio Production**

* **Pure Data** \- Patch design (desktop)  
* **WebPd Compiler** \- .pd → .wasm conversion

---

## **Critical Path**

**The shortest path to full District 1 launch:**

**Phase 0 (March 15-23):** Spatial audio \+ engine integration, GPS positioning, basic patches, demo video. Proof of concept complete.

**Phase 1 (March 22 – April 6):** Docker build environment, GCP hosting, tram layer refined to production quality, initial user testing.

**Phase 2 (April):** Water, sewage, electricity, and telecom layers added to prototype route. Extraction scripts, ProximityEngine updates, placeholder patches for each. Multi-layer integration and mixing.

**Phase 3 (May):** Geographic expansion to full District 1 (postal code 8001). Extraction scripts broadened from route to district boundary filtering. GPS free-roam replaces fixed route. Production sound design across all layers.

**Phase 4 (June–August):** UI design, PWA deployment (Service Worker, offline caching, Web App Manifest), user testing, documentation, public launch.

Development continues regardless of funding outcome.

---

## **Risk Mitigation**

### **Technical Risks**

**GPS accuracy in urban canyons**

* **Mitigation:** ProximityEngine trigger radii are already wide enough (30-200m depending on layer type) to tolerate GPS drift of 10-30m typical in urban canyons. Position smoothing via exponential moving average on incoming `watchPosition()` coordinates dampens jitter without adding perceptible lag at walking speed. Compass heading from `DeviceOrientationEvent` may be distorted by steel buildings, but spatial audio panning tolerates several degrees of error without audible impact.  
* **Fallback:** The experience degrades softly: wider GPS scatter means slightly less precise spatial positioning, but infrastructure sounds still respond to proximity. No hard failure mode.

**Battery drain**

* **Mitigation:** GPS updates via `watchPosition()` with `maximumAge` set to 5 seconds to limit fix frequency. Spatial culling already reduces Web Audio graph size by only connecting nodes for infrastructure within 200m. Audio nodes for out-of-range infrastructure are disconnected and released, not just muted.  
* **Fallback:** Reduce culling radius, increase GPS interval, or suspend non-essential layers. Specific thresholds to be determined through real-device testing in Phase 1\.

**Audio source overload at district scale**

* **Mitigation:** Spatial culling at 200m radius reduces the working set from \~4,000-5,000 district elements to \~50-100 nearby. Within that set, each layer type has its own audible radius (tram feeders 30m, water 100m, substations 200m), so not all culled elements are producing audio simultaneously. A fixed pool of pre-allocated Web Audio nodes (target 50-100) is recycled as infrastructure enters and leaves range, avoiding garbage collection pauses from node creation/destruction. Toggling a layer off in the UI disconnects its nodes from the audio graph entirely, freeing pool capacity.  
* **Fallback:** If performance drops on a given device, reduce the pool size or tighten the culling radius. Most distant elements are dropped first: the experience thins out rather than breaking.

**WebPd performance on lower-end devices**

* **Mitigation:** Each active audio node runs its own compiled WASM patch instance, so CPU load scales with pool size. Patches are kept lightweight by design (oscillators, filters, envelopes: no heavy FFT or convolution). The audio source pool caps the maximum number of simultaneous WASM instances. Testing on older devices during Phase 1 establishes a performance baseline early.  
* **Fallback:** Reduce pool size or simplify patch complexity first. Tone.js as a full alternative to WebPd is a significant rewrite and a last resort only.

**Docker/deployment complexity**

* **Mitigation:** Single Dockerfile with multi-stage build, same image in dev and production. The app is ultimately static files (HTML, JS, WASM, GeoJSON), so Docker adds convenience but not dependency.  
* **Fallback:** Deploy static files directly to a GCP Cloud Storage bucket behind a load balancer. No containerisation required: the app works the same way.

### **Sound Design Risks**

**Sonic clarity with dense infrastructure**

* **Challenge:** Full District 1 has 4,000-5,000 infrastructure elements: risk of sonic mud rather than legible layers.  
* **Mitigation:** Frequency separation by design: each layer occupies a distinct part of the spectrum (sewage in the bass, electricity in the mids, telecom in the highs). Spatial separation reinforces this: elements are physically positioned around the listener via Three.js PositionalAudio, so dense infrastructure reads as spatial texture rather than a wall of sound. Per-layer mix controls give the user agency. User testing in Phase 4 validates legibility.

**District theme composition**

* **Challenge:** Creating compelling procedural generative music is difficult: the theme needs to work as a foundation that infrastructure sounds perform atop, across infinite walk variations.  
* **Mitigation:** Start with a simple ambient foundation (sustained tones, slow harmonic drift) and iterate based on how the infrastructure layers interact with it. The infrastructure layers carry the experience; the theme enhances but isn't load-bearing. If generative composition doesn't produce satisfying results, a well-crafted static ambient bed still functions.

---

## **Success Criteria**

### **Technical**

* \[ \] PWA loads on iOS Safari and Android Chrome  
* \[ \] GPS accuracy within 10m in District 1  
* \[ \] Audio responds to compass heading within 100ms  
* \[ \] No audio dropouts during 30-min walk  
* \[ \] Battery drain \<25% over full District 1 exploration  
* \[ \] Works offline after initial cache  
* \[ \] All 5 infrastructure layers render simultaneously  
* \[ \] Spatial culling handles 4,000-5,000 infrastructure elements

### **Experiential**

* \[ \] 15+ user testing participants complete experience  
* \[ \] 70%+ would recommend to others  
* \[ \] Users report "seeing infrastructure differently"  
* \[ \] Tram/water/data events create synchronized experiences  
* \[ \] Clear sonic differentiation between 5 infrastructure types  
* \[ \] District 1 theme provides coherent musical foundation  
* \[ \] Free-roam exploration feels natural and compelling

### **Artistic**

* \[ \] Sonification is legible (users understand 5 layers)  
* \[ \] Balances data fidelity with aesthetic beauty  
* \[ \] Creates new perception of urban infrastructure  
* \[ \] Celebrates (not critiques) hidden systems  
* \[ \] Documented with high-quality video/photos  
* \[ \] Each infrastructure type has distinct sonic character

### **Launch (August 2026\)**

* \[ \] 100+ completed journeys in first 3 months  
* \[ \] 70%+ completion rate (users explore, don't abandon)  
* \[ \] Positive media coverage (1+ Zurich publication)  
* \[ \] GitHub repo public with documentation  
* \[ \] Stadt Zürich acknowledges project in digital arts context  
* \[ \] Open-source code enables adaptation to other cities

---

## **Budget**

**Total: CHF 13,200** (Stadt Zürich Digitale Künste application)

### **Infrastructure & Hosting (CHF 1,200)**

* Hosting (Google Cloud Platform): Existing GCP account. Static assets served via Cloud Storage \+ Cloud CDN or Cloud Run container. Estimated CHF 5-10/month at expected traffic levels (\~CHF 100/year)  
* Domain \+ SSL certificates: CHF 100/year  
* CDN/asset hosting (Cloudflare): CHF 300/year  
* Backup storage: CHF 200/year  
* Development/testing environments: CHF 500

### **Development Hardware (CHF 2,500)**

* Replacement laptop (current machine failing): CHF 2,500

### **Artistic Development (CHF 6,500)**

* Infrastructure layer sound design (5 layers): CHF 4,000  
  * Tram electrical (already built): CHF 0  
  * Water supply sonification: CHF 1,000  
  * Sewage/wastewater sonification: CHF 1,000  
  * Electricity grid sonification: CHF 1,000  
  * Telecommunications/fiber sonification: CHF 1,000  
* District 1 musical theme composition: CHF 1,500  
  * Procedurally-generated electronic theme reflecting district character  
* Integration & spatial audio mixing: CHF 1,000

### **Testing & Iteration (CHF 1,500)**

* User testing sessions (15 participants): CHF 900  
* Technical optimization across 5 layers: CHF 600

### **Public Presentation (CHF 1,500)**

* Launch event (venue, promotion): CHF 800  
* Documentation (video, photography): CHF 400  
* Promotional materials (website, social media): CHF 300

**Post-launch annual costs:** \~CHF 500 (GCP hosting \+ domain)

---

**Last Updated:** March 2026 (dates shifted \+1 week, to be locked in)  
**Next Review:** End of Phase 0

