# Invisible Infrastructures: Zurich Technical Architecture Document

# Executive Summary

This document describes the technical architecture for Invisible Infrastructures: Zurich, a location-based generative music application that sonifies five layers of urban infrastructure through spatial audio. The system combines real-time municipal data, procedural audio synthesis, and privacy-by-design principles to create an accessible public artwork requiring only a smartphone and headphones. 

Coding and advanced technical implementations have been developed with the assistance of Anthropic Claude’s coding agent. All sound design is conceived and created from the outset by the artist, with some code reviews and assistance from AI.

This document focuses on architecture, purpose, and functionality. For actual code implementations, see the [GitHub repository](https://github.com/Gombassa/invisible-infrastructures-zurich). It presents the planned architecture with validated prototypes demonstrating technical feasibility. Core components have been prototyped; integration and refinement are the subjects of this funding application.

The piece is an homage to the City and the principles enshrined in the Open By Default resolution of the City Council of 2021\. Speaking to these, the piece aims to enhance accessibility and transparency through the following approaches:-

* Zero personal data collection, making it FADP/GDPR compliant by design.  
* Browser-based Progressive Web App, which offers no app store barriers.  
* WebAssembly audio synthesis which offers efficient, procedural sound generation \- no large data transfers of sampled or streamed audio.  
* Multi-layer spatial audio sonifying 5 infrastructure types \+ a district theme, with an interface to allow interactive choices.  
* Real-time data integration derived from [www.stadt-zuerich.ch](http://www.stadt-zuerich.ch) open data sources  
* Offline-capable after initial load, minimising potentially-exclusive data usage.

This document seeks to offer greater insight into the technical aspects of the project in support of an application for funding from the Zurich Digital Arts: Implementation and Presentation program. 

The current status is that there are working models and a phase 0 Minimal Viable Product. The successful awarding of this grant would allow for the following developments to be implemented and to support the project to grow towards a full public launch. 

* Integration of validated prototypes into unified application  
* Development of 4 additional infrastructure audio layers (water, sewage, electricity, telecom)  
* District 1 musical theme composition  
* Spatial audio system implementation  
* User testing and refinement  
* Public launch (August 2026\)

The project is envisaged to be live for a minimum of one year with the potential for expansion and continuation beyond this scope.

# Development Status

As proof of concept, I have developed some basic Validated Prototypes and placeholder sound design patches

#### **1\. WebPd Audio Synthesis Pipeline**

This allows me to create PureData (PD) patches locally on my workstation and compile them into web-ready Javascript functions, mainly placeholders at present which allow me to move forward with functionality. I have planned to iterate and refine these aesthetically at a later stage.

**Technology Stack**

WebPd transpiles the patch graph directly to optimized browser code thus:- 

Pure Data → WebPd transpiler → WebAssembly \+ JavaScript → Web Audio API AudioWorklet → browser audio output

**Step-by-Step Process**

* The initial Pd Patch is authored in desktop Pure Data, using standard vanilla Pd DSP objects: oscillators, filters, envelope followers, logic, routing, table lookups. No externals. Keeping to vanilla Pd ensures full compatibility with WebPd's object library.  
* WebPd parses the patch file by reading the .pd file and constructing an internal graph of the patch, ie each object, its connections, and its initial arguments, mapping its structure.  
* WebPd transpiles the patch graph into optimised JavaScript, generating a WebAssembly module for the DSP-critical processing paths. Each Pd object becomes a corresponding JS/Wasm equivalent. This is compiled to native browser code.  
* The compiled module is loaded inside a Web Audio API AudioWorkletProcessor, which runs on a dedicated high-priority audio thread separate from the browser's main JS thread. This is essential for glitch-free, low-latency DSP in the browser.  
* The Web Audio API calls the worklet's process function on every audio render quantum (128 samples by default). The Wasm DSP module fills the output buffer with computed audio samples, which the Web Audio graph routes to the system audio output.  
* External data (in the working prototype, tram position and network voltage values derived from GeoJSON) is passed into the running patch as control messages from JavaScript. WebPd exposes send/receive hooks that mirror Pd's own \[send\] and \[receive\] objects. For example: webPdRuntime.sendFloat('tram\_voltage', 0.73) fires a float into the patch's \[receive tram\_voltage\] object.  
* The patch processes control input and generates audio, which is routed through the Web Audio graph for spatialisation. A Web Audio PannerNode in HRTF mode, or a custom ambisonics pipeline, is inserted downstream of the WebPd output node to handle location-aware positioning of sonification layers.

**Data Flow Summary**

GeoJSON tram network data (position, line, schedule) is consumed by JavaScript on the main thread. Values are extracted and forwarded as float or bang messages into the WebPd runtime via send hooks. The running patch responds to these control signals and generates audio in real time.

**Key Constraints**

Only vanilla Pd objects are supported, so I can’t use fancy C externals, or any of the  Pd-extended libraries. For iOS users, Mobile Safari requires a user gesture to unlock the AudioContext before audio can play. Patch complexity affects CPU load in the browser; keep polyphony and signal chain depth proportionate to target devices, which is why I am using very basic placeholder patches at this stage.

**Development Workflow**

Because the patch file is plain text and WebPd loads it at runtime, no separate build step is needed during development. Iterate on the patch in desktop Pure Data, save the .pd file, and reload the browser page: WebPd re-transpiles on load. For production, pre-compile with the WebPd CLI to generate static assets. As the piece becomes more developed, it may become more efficient to  use Emscripten or the libpd runtime to precompile a PD emulation, which should allow for more polyphony and complex patches.

#### **2\. Core Engine Modules**

**TramEngine** ([`src/tram-engine.js`](https://github.com/Gombassa/invisible-infrastructures-zurich/blob/main/src/tram-engine.js))

TramEngine polls transport.opendata.ch every 10 seconds for tram departure times, then interpolates positions between stops using linear progression at 15 km/h average speed. Built as a singleton with observer pattern, it handles API failures gracefully by retaining last known positions. The Phase 0 MVP tracks 6 stop pairs covering 3.8km through District 1\.

**ProximityEngine** ([`src/proximity-engine.js`](https://github.com/Gombassa/invisible-infrastructures-zurich/blob/main/src/proximity-engine.js))

ProximityEngine calculates distances between trams, infrastructure elements, and the user using haversine math. It implements a dual threshold system: substations count trams within 150m (for drone intensity), while feeders trigger percussive events when trams pass within 30m. The prototype currently loads 366 tram feeders on the 2.7km route.

**ListenerEngine** ([`src/listener-engine.js`](https://github.com/Gombassa/invisible-infrastructures-zurich/blob/main/src/listener-engine.js))

ListenerEngine simulates a walker moving along the 75-waypoint route at 5 km/h, using binary search for position lookup and calculating compass heading (0-360°) for spatial audio. The MVP runs in simulation mode; production will swap this for device GPS and compass to enable free-roam exploration across District 1\.

#### **3\. Data Layer Validation**

The prototype focuses on tram infrastructure data since it's the only layer requiring real-time API integration. 

366 VBZ tram feeders have been downloaded and processed on the prototype route, confirming that the transport.opendata.ch API works reliably. From this raw data, 75 route waypoints were extracted using a custom script (extract-route-waypoints.js) that follows the actual tram network topology rather than crow-flies distances. The script builds a graph from LineString segments, snaps parallel tracks within 5m, then uses A\* pathfinding to stitch a walking route through the real overhead wire geometry. 

The other four infrastructure types—water supply (WVZ Leitungskataster), sewage (ERZ Abwasser), electricity grid (ewz), and telecommunications (ewz)—are all identified and accessible through Stadt Zürich's open data portal, but extraction is pending until a future development phase when the scope is expanded from the 2.7km prototype to full District 1 coverage.

#### **4\. Integration Test Pages**

Each engine was built with its own test page to validate functionality before integration:

* **`prototypes/02-tram-engine/tram-engine-test.html`** \- Live dashboard showing tram positions updating every 10 seconds alongside proximity calculations to infrastructure elements  
* **`prototypes/04-listener/listener-test.html`** \- Interactive Leaflet map displaying the simulated walker moving along the route with real-time position and heading updates  
* **`prototypes/01-audio-sketches/dual-patch-test.html`** \- WebPd multi-patch playback confirming multiple patches could run simultaneously in the browser

All three engines functioned independently on the prototype route data, demonstrating the core architecture works prior to spatial audio integration.

#### **5\. Documentation & Planning**

A comprehensive project overview document (currently WIP) brings together the full development narrative, including project documentation, the technical architecture presented in this document, route analysis and photography from the prototype walk, and identification of infrastructure data sources for all 5 layers. This documentation establishes the complete scope and validates the feasibility of the funded development work.

# Future Development Work

### **Phase 1: Geographic Expansion & Core Integration**

**Geographic Data Expansion** 

This involves extracting full District 1 infrastructure geodata for each infrastructure layer.

The scope increases are:

* Tram feeders: 366 (prototype) → \~800-1000 (full District 1\)  
* 4 new infrastructure types: water, sewage, electricity, telecom

Resulting in a total of \~4,000-5,000 infrastructure elements

Once the raw datasets have been identified, it will be necessary to adapt the existing extraction script ([`scripts/extract-route-waypoints.js`](https://github.com/Gombassa/invisible-infrastructures-zurich/blob/main/scripts/extract-route-waypoints.js)) for each infrastructure type.

Based on the working prototype, the key key algorithm features will be:

* Graph-based extraction from LineString geodata  
* 5m snap tolerance to merge parallel infrastructure  
* Topology preservation (critical for network sonification)  
* Arc-length sampling (maintains experiential distance)

**SpatialAudioController.js** 

Critical to this phase is the goal to integrate the existing engines with Three.js PositionalAudio for spatial audio rendering to add the following functionality:

* Coordinate transformation (lat/lng → 3D space relative to user heading)  
* 6-layer audio mixing (5 infrastructure \+ 1 district theme)  
* Real-time position updates based on device GPS/compass  
* Connection to WebPd patches for procedural audio synthesis  
* Parameter modulation based on proximity data from ProximityEngine

The basic implementation approach is to:

* Three.js AudioListener attached to User Listerner sink  
* Define PositionalAudio sources for each infrastructure element  
* Integrate Haversine distance calculations for relative positioning  
* Implement Binaural panning based on user heading

**GPS Integration \- ListenerEngine Enhancement**

Once spatial audio rendering has been functional and tested, the next stage is to replace fixed route simulation with free-roam GPS exploration

This will add the functionality of allowing users to walk anywhere in District 1 (not just prototype route), by employing: 

* `Navigator.geolocation` API allows for device positionining  
* `DeviceOrientationEvent` API allows the browser to derive compass headings  
* Dynamic infrastructure loading (only nearby elements) using spatial culling due to increased data volume

### **Phase 2: Sound Design & Musical Composition**

**Tram Electrical Layer**

The tram electrical layer already has technical proof-of-concept patches—`feeder-event.pd` for percussive electrical crackle and `substation-drone.pd` for continuous transformer hum. The work here is refining these prototypes to production quality, which means enhancing the timbral complexity, improving the synthesis techniques, and testing with real infrastructure density. The prototype ran with 366 feeders; the full District 1 deployment will have 800-1000, which changes the sonic character significantly. More feeders means denser spatial texture, more overlapping events, and a need for clearer sonic differentiation so individual triggers remain perceptually distinct rather than blurring into noise.

**Water Supply Layer**

Water infrastructure sonification starts from scratch. The sonic concept centers on hydraulic pulse—the rhythmic compression and release of water moving through pipes under pressure—combined with flow textures that evoke liquid movement and pumping station rhythms that reflect the mechanical systems driving distribution. The Pure Data patch will map to WVZ Leitungskataster infrastructure points, translating pipe locations, pumping stations, and flow characteristics into procedural audio. The data source is identified and accessible, but no sound design work has started yet.

**Sewage Layer**

The sewage layer occupies the low-frequency register—deep bass churn representing the movement of waste through underground collectors, rumble textures evoking the hidden infrastructure beneath streets, and treatment facility processes that bring industrial mechanical character. The sonic palette needs to feel subterranean and visceral without being unpleasant; this is infrastructure we depend on but rarely think about. The Pure Data patch will draw from ERZ Abwasser infrastructure points, mapping sewage collectors and treatment facilities to bass synthesis parameters. Like water, the data source is identified but sound design hasn't begun.

**Electricity Grid Layer**

Electrical infrastructure occupies the opposite end of the frequency spectrum from sewage—transformer hum in the low-mid range, high-frequency harmonic screaming from high-voltage equipment, and voltage fluctuations that create rhythmic variation. The challenge here is making power distribution audible without simply reproducing the 50 Hz mains hum everyone's familiar with; it needs to feel electrical and energetic while remaining musically interesting. The patch will map to ewz electricity infrastructure points, with substations and transformers driving different synthesis parameters. Data source identified, no sound design started.

**Telecommunications Layer**

The telecom layer is the most abstract—there's no physical analog like flowing water or humming transformers. The sonic concept uses data chirps (short digital pulses), fiber optic whispers (high-frequency textural noise suggesting light moving through glass), and bandwidth pulses (rhythmic swells reflecting network traffic intensity). Since there's no real-time data available for network traffic, these will be simulated or driven by other infrastructure activity as a proxy. The Pure Data patch maps to ewz telecom infrastructure points showing fiber nodes and data hubs. Data source identified, no sound design started.

**District 1 Musical Theme**

The district musical theme functions as the foundation layer that all five infrastructure types perform atop. This is a procedurally-generated electronic ambient composition reflecting Altstadt's character—medieval street layout, modern financial center, cultural hub—expressed through generative Pure Data algorithms rather than a fixed score. The theme provides harmonic and rhythmic scaffolding that infrastructure sounds can reinforce, diverge from, or comment on, creating coherence across the five disparate sonic layers. Implementation uses Pure Data's algorithmic composition capabilities (random choices, pattern generation, parameter drift) to ensure variation across repeated walks. Sonic concept is defined but no composition work has started.

### **Phase 3: Progressive Web App Deployment**

**Service Worker & Offline Capability**

The Service Worker acts as a programmable network proxy, intercepting requests and implementing a caching strategy that makes the app work offline after initial load. All infrastructure geodata (5 layers, \~4,000-5,000 elements), WebPd WASM patches, and core application code get cached locally. Once cached, the app launches without internet—only real-time tram positions require connectivity, gracefully degrading to last known positions when offline.

**Web App Manifest**

The Web App Manifest is a JSON file containing metadata (app name, icons, theme colors) that enables home screen installation. Users can add the app to their device alongside native apps, launching it in full-screen mode without browser chrome. This removes URL friction—the app becomes a persistent icon rather than a bookmark.

**Cross-Platform Testing**

iOS Safari and Android Chrome handle PWAs differently—iOS is more restrictive on geolocation permissions, compass access, and background audio. Testing verifies spatial audio works correctly on both platforms, GPS/compass permissions are requested properly, installation works from browser menus, and battery consumption remains reasonable. Multiple device models (iPhone, Samsung, Pixel) across OS versions catch platform-specific issues.

---

### **Phase 4: Testing & Refinement**

**User Testing Sessions**

15 participants walk actual District 1 routes, revealing issues invisible in simulated testing: GPS drift near buildings, compass calibration problems, audio mixing when layers overlap, confusing UI elements, battery drain. Structured feedback via in-app surveys and post-walk interviews identifies which sonic layers are legible, whether spatial positioning feels accurate, and if the experience engages or overwhelms.

**Performance Optimization**

With 4,000-5,000 infrastructure elements plus real-time tram data, optimization is critical for mobile performance. Spatial culling algorithms process only infrastructure within audible range (200-500m depending on layer). WebPd patches are simplified to reduce CPU load. Memory management avoids garbage collection pauses that cause audio dropouts. GPS update rate balances positioning accuracy against battery consumption. Target: stable 60fps spatial audio, \<25% battery drain over 30 minutes.

**Documentation & Bug Fixes**

User-facing documentation covers PWA installation, walking instructions, and infrastructure layer explanations. Technical documentation includes system architecture, API integration details, Pure Data patch designs, and deployment procedures. Bug fixes address edge cases discovered during user testing: proximity calculation errors, audio artifacts, UI glitches on specific devices, GPS accuracy issues in particular locations.

### **Phase 5: Public Launch**

**Beta Testing Period**

50-100 early adopters test the app before official launch, catching scale-dependent issues: server load with concurrent users, edge cases in geodata not covered by initial testing, UX issues across diverse user base. Beta testers access via direct link rather than public promotion. Feedback informs final adjustments.

**Launch Event**

Held at a District 1 location with good infrastructure density (Paradeplatz or Bellevue), the event includes guided walks, artist talks explaining technical/conceptual approach, and hands-on tryouts with provided devices. Pre-prepared press materials (demo videos, artist statements, technical overviews) facilitate media coverage and generate initial momentum.

**Public Deployment**

App goes live at permanent URL, accessible to anyone with a smartphone. Anonymous analytics track usage patterns. Server monitoring catches technical issues and handles scaling if needed. Promotional activities include Zurich cultural event listings, social media, submissions to sound art/digital art festivals, and potential partnerships with VBZ or Stadt Zürich tourism.

## 

# 1\. System Architecture Overview \*WIP

## **Data Flow**

### **1\. External Data Sources**

**Static Infrastructure Geodata (pre-loaded, cached locally):**

* Tram electrical: 366 feeders (prototype) → \~800-1000 (full District 1\) \- VBZ Infrastruktur OGD  
* Water supply: Distribution pipes, pumping stations \- WVZ Leitungskataster  
* Sewage: Main collectors, treatment facilities \- ERZ Abwasser-Werkleitungsdaten  
* Electricity grid: Substations, transformers \- ewz Werkleitungsdaten  
* Telecommunications: Fiber nodes, data hubs \- ewz Telecom

**Real-time Data:**

* Tram positions: transport.opendata.ch API (10-second polling interval)

### **2\. Core Engines (ES6 Modules, 498 lines total)**

**TramEngine** (180 lines) \- Polls transport.opendata.ch API, interpolates tram positions between stops. Unique among infrastructure types because trams move in real-time.

**ProximityEngine** (125 lines) \- Loads infrastructure geodata for all 5 layers (tram, water, sewage, electricity, telecom) from GeoJSON files. Calculates haversine distances between user, trams, and infrastructure elements. Determines audio trigger parameters based on proximity thresholds. Implements spatial culling (only processes infrastructure within 200-500m of user) to reduce computational load—essential when scaling from 366 elements (prototype) to 4,000-5,000 elements (full District 1). Currently loads tram feeders only; Phase 2 expands to all 5 infrastructure types simultaneously.

**ListenerEngine** (193 lines) \- GPS position from device sensors (`navigator.geolocation`) \+ compass heading from magnetometer (`DeviceOrientationEvent`). Provides user location/orientation regardless of infrastructure layer count.

### **3\. Spatial Audio Controller (NEW DEVELOPMENT)**

* Receives position data from ListenerEngine (user lat/lng/heading)  
* Receives proximity data from ProximityEngine (distances to infrastructure)  
* Receives tram activity from TramEngine (real-time positions)  
* Transforms lat/lng coordinates → 3D space relative to user heading  
* Manages 6-layer audio mixing:  
  1. Tram electrical layer  
  2. Water supply layer  
  3. Sewage layer  
  4. Electricity grid layer  
  5. Telecommunications layer  
  6. District 1 musical theme  
* Creates Three.js PositionalAudio sources for each infrastructure element  
* Modulates WebPd patch parameters based on proximity/activity

### **4\. WebPd/WASM Audio Engine**

Pure Data patches compiled to WebAssembly for procedural audio synthesis. Each infrastructure layer requires one or more patches; the exact architecture and patch count will be determined during sound design (Phase 2, May-June 2026).

**Example patches (prototype/proof-of-concept):**

* `feeder-event.pd` → Tram electrical percussive events  
* `substation-drone.pd` → Tram electrical continuous drone  
* Additional patches for water, sewage, electricity, telecom, and district theme layers (to be developed)

**WebPd/WASM Integration:**

* Patches communicate with JavaScript via AudioWorklet port messaging  
* Full exploration of WebPd capabilities for real-time audio synthesis  
* Implementation approach determined during sound design phase based on sonic requirements

### **5\. Web Audio API**

* Three.js PositionalAudio provides spatial positioning (binaural panning)  
* Distance-based volume attenuation per infrastructure element  
* Heading-based left/right/front/back positioning  
* 6-layer gain nodes for mixing control

### **6\. Performance Optimization**

**Spatial Culling:** With 4,000-5,000 infrastructure elements, calculating distances every frame is computationally expensive. Grid-based spatial indexing (100m x 100m cells) enables querying only infrastructure within audible range (\~500m, adjustable per layer). Grid bucketing followed by distance filtering provides 10x reduction in calculations compared to checking all elements.

**Audio Source Pooling:** Creating/destroying Three.js PositionalAudio objects causes garbage collection pauses that interrupt audio playback. Pre-creating a pool of 50 sources per infrastructure type and reusing them as elements enter/exit range eliminates GC pauses during user movement. Sources are activated when infrastructure enters range, deactivated when exiting.

**WebAssembly Optimization:** Pure Data patches compile with `-O3` optimization, reducing size from \~200KB to \~80KB per patch while ensuring native-speed execution. Lazy loading defers patch initialization until the user approaches each infrastructure type, reducing initial load time and memory usage.

### **7\. Deployment Architecture**

**Hosting Infrastructure:** Dedicated server (Germany): 2 vCPUs, 8GB RAM, 80GB SSD, 20TB/month bandwidth, \~CHF 7/month, renewable energy. Nginx web server with HTTPS, HTTP/2, Gzip compression. Caching strategy: static assets (1 year), geodata (7 days), HTML (no cache for PWA updates). Optional CDN for global edge caching and DDoS protection.

**Continuous Deployment:** CI/CD pipeline triggers on repository updates: install dependencies → compile WebPd patches (Pure Data → WASM) → copy static assets → deploy to server via rsync.

### **8\. Testing Strategy**

**Unit Tests:** Engine modules tested for core functionality—position interpolation, API failure handling, haversine distance accuracy, trigger detection, binary search, heading calculation. JavaScript testing framework validates individual module behavior before integration.

**Integration Tests:** End-to-end browser automation verifies complete user flow: geolocation permission grant, data fetching, spatial audio initialization, position-triggered audio changes. Tests confirm all engines work together as unified system.

**Audio Testing:** Manual verification of spatial audio using test tones at known positions. Validates left/right/front/back panning accuracy, distance attenuation behavior, and compass heading integration. Ensures Three.js PositionalAudio performs correctly across device types.

### **9\. Monitoring & Analytics (Anonymous)**

**Error Reporting:** Anonymous error logging captures browser info (user agent) only—no GPS coordinates, no user IDs, no session tracking. Improves stability without compromising privacy.

**Performance Metrics:** Core Web Vitals tracking (page load time, FCP, LCP) and custom performance marks (audio initialization time). No user tracking or behavioral profiling.

### **10\. Output**

Headphones/speakers on user's smartphone

# Future Technical Enhancements

**District Expansion (2027-2030)**

Scale to postal codes 8002-8006 with unique musical theme per district. Same 5 infrastructure layers with district-specific sonic character. Auto-switch theme based on user's GPS-detected postal code.

**Advanced Spatial Audio**

HRTF (Head-Related Transfer Function) via Web Audio API PannerNode for improved binaural positioning and front/back differentiation. Ambisonics using first-order encoding library for higher-order spatial audio and more immersive surround sound.

**Multilingual Support**

Browser language auto-detection determines UI language (German, English, French, Italian supported). Translations loaded dynamically for interface elements. Audio itself is universal—no language barrier.

**Voice Navigation**

Web Speech API for audio announcements to visually impaired users. Speaks nearby infrastructure names and distances, announces when entering/exiting District 1 boundaries.

**Machine Learning Integration**

TensorFlow.js for tram position prediction between API polls. Model trained on historical movement data interpolates smoother trajectories, reducing perceived latency in audio triggers.

# Conclusion: Technical Feasibility & Development Readiness

The system architecture is technically sound and ready for implementation. Core technologies are validated: WebPd/WASM compilation pipeline functions correctly, three engine modules (TramEngine, ProximityEngine, ListenerEngine) are implemented and tested across 498 lines of code, and all infrastructure geodata sources are accessible via Stadt Zürich open data programs. Privacy-by-design architecture ensures FADP/GDPR compliance, and performance optimization strategies address computational scaling from 366 elements to 4,000-5,000.

Development work is clearly scoped: geographic expansion from 2.7km prototype route to full District 1 coverage with five infrastructure types, sound design for five infrastructure layers plus district theme, spatial audio integration connecting engines to Three.js/WebPd, GPS implementation replacing simulation with device sensors, and PWA deployment with offline capability. The current prototype demonstrates feasibility at small scale—the development path scales proven concepts to production scope.

Technical risks are mitigated through validated prototypes and mature technologies. Development risks are managed through iterative development, continuous testing, and conservative six-month timeline with buffer time. The prototype proves the concept works; the development phase scales it to full District 1 deployment.

**Document Version:** 1.1 (Code-Free Reference Edition)  
**Last Updated:** March 2026  
**Author:** Robin Pender  
**Contact:** robinpender23@gmail.com  
**Repository:** https://github.com/Gombassa/invisible-infrastructures-zurich  
**Funding Application:** Stadt Zürich Digitale Künste: Umsetzung und Präsentation (CHF 14,500)

