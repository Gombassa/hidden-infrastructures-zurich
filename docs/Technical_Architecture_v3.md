# Hidden Infrastructures: Zürich — Technical Architecture

# Executive Summary

This document describes the technical architecture for Hidden Infrastructures: Zürich, a location-based generative music application that sonifies five layers of urban infrastructure through spatial audio. The system combines real-time municipal data, procedural audio synthesis, and privacy-by-design principles to create an accessible public artwork requiring only a smartphone and headphones.

Coding and advanced technical implementations have been developed with the assistance of Anthropic Claude's coding agent. All sound design is conceived and created from the outset by the artist, with some code reviews and assistance from AI.

This document focuses on architecture, purpose, and functionality. For actual code implementations, see the [GitHub repository](https://github.com/Gombassa/hiddeninfrastructures-zurich). It presents the planned architecture with validated prototypes demonstrating technical feasibility. Core components have been prototyped; integration and refinement are the subjects of this funding application.

The piece is an homage to the City and the principles enshrined in the Open By Default resolution of the City Council of 2021. Speaking to these, the piece aims to enhance accessibility and transparency through the following approaches:

* Zero personal data collection, making it FADP/GDPR compliant by design.
* Browser-based Progressive Web App, which offers no app store barriers.
* Real-time procedural audio synthesis via Web Audio API — no large data transfers of sampled or streamed audio.
* Multi-layer spatial audio sonifying 5 infrastructure types + a district theme, with an interface to allow interactive choices.
* Real-time data integration derived from [www.stadt-zuerich.ch](http://www.stadt-zuerich.ch) open data sources.
* Offline-capable after initial load, minimising potentially-exclusive data usage.

This document seeks to offer greater insight into the technical aspects of the project in support of an application for funding from the Zurich Digital Arts: Implementation and Presentation program.

The current status is that there are working models and a Phase 0 Minimal Viable Product. The successful awarding of this grant would allow for the following developments to be implemented and to support the project to grow towards a full public launch.

* Integration of validated prototypes into unified application
* Development of 4 additional infrastructure audio layers (water, sewage, electricity, telecom)
* District 1 musical theme composition
* Spatial audio system implementation
* User testing and refinement
* Public launch (August 2026)

The project is envisaged to be live for a minimum of one year with the potential for expansion and continuation beyond this scope.

# Development Status

The following components are built and tested as proof of concept.

#### **1\. Audio Synthesis Pipeline**

**Validated: Direct Web Audio API Synthesis**

Browser audio synthesis has been validated using the Web Audio API directly. Proximity data from the engine modules drives synthesis parameters in real time — feeder trigger events fire a noise burst through a highpass filter with a fast gain envelope, and tram density within the substation radius modulates the amplitude of a detuned oscillator pair drone. All synthesis runs on the browser's main audio graph with no external dependencies.

This direct approach is used for development and pipeline validation. It confirms that the data flow from engines through proximity calculations to audio output is correct and responsive.

**Planned: Max/MSP + RNBO for Production Sound Design**

Production sound design will be authored in Max/MSP and exported to browser-deployable WebAssembly via RNBO (Cycling '74's official web export tool). RNBO compiles Max patches to self-contained WASM modules that run inside a Web Audio API AudioWorklet on a dedicated high-priority audio thread, with patch parameters addressable from JavaScript.

This workflow — Max/MSP → RNBO compiler → WebAssembly → AudioWorklet — is the intended production path. It has not yet been validated in this project. Validation is planned as part of Phase 1 development.

**Spatial Audio**

Spatial positioning uses the Web Audio API PannerNode in HRTF mode. Each infrastructure element is positioned as an audio source in 2D space relative to the listener. GPS coordinates and compass heading from DeviceOrientationEvent determine the bearing and distance to each source, which drives the PannerNode's x and z coordinates. No external 3D library is required.

#### **2\. Core Engine Modules**

**TramEngine** ([`src/tram-engine.js`](https://github.com/Gombassa/hiddeninfrastructures-zurich/blob/main/src/tram-engine.js))

TramEngine polls transport.opendata.ch every 10 seconds for tram departure times, then interpolates positions between stops using linear progression at 15 km/h average speed. Built as a singleton with observer pattern, it handles API failures gracefully by retaining last known positions. The Phase 0 MVP tracks 6 stop pairs covering 3.8km through District 1.

**ProximityEngine** ([`src/proximity-engine.js`](https://github.com/Gombassa/hiddeninfrastructures-zurich/blob/main/src/proximity-engine.js))

ProximityEngine calculates distances between trams, infrastructure elements, and the user using haversine math. It implements a dual threshold system: substations count trams within 150m (for drone intensity), while feeders trigger percussive events when trams pass within 50m. Supports an optional listener position parameter — when provided, feeder triggers also require the listener to be within range (foot mode); without it, tram proximity alone fires triggers (tram-mode). Loads 366 tram feeders on the 2.7km route.

**GPS Listener** (inline in `index.html`)

Live GPS via `navigator.geolocation.watchPosition()` drives the listener position directly. The simulation-based ListenerEngine.js (which walked a fixed 75-waypoint route at 5 km/h) has been archived; the GPS listener replaces it with real device coordinates. Compass heading via `DeviceOrientationEvent` is planned for spatial audio orientation.

#### **3\. Data Layer Validation**

The prototype focuses on tram infrastructure data since it's the only layer requiring real-time API integration.

366 VBZ tram feeders have been downloaded and processed on the prototype route, confirming that the transport.opendata.ch API works reliably. From this raw data, 75 route waypoints were extracted using a custom script (extract-route-waypoints.js) that follows the actual tram network topology rather than crow-flies distances. The script builds a graph from LineString segments, snaps parallel tracks within 5m, then uses A* pathfinding to stitch a walking route through the real overhead wire geometry.

The other four infrastructure types — water supply (WVZ Leitungskataster), sewage (ERZ Abwasser), electricity grid (ewz), and telecommunications (ewz) — are all identified and accessible through Stadt Zürich's open data portal, but extraction is pending until the funded development phase when the scope expands from the 2.7km prototype to full District 1 coverage.

#### **4\. Integration Test Pages**

Each engine was validated with its own test page before integration. These are now archived in `Archive/`:

* **`Archive/prototype-tests/tram-engine-test.html`** — Live dashboard showing tram positions updating every 10 seconds alongside proximity calculations
* **`Archive/simulation/listener-test.html`** — Interactive Leaflet map with the simulated walker moving along the route
* **`Archive/webpd-patches/01-audio-sketches/index.html`** — Phase 0 pipeline test: stub engines + Web Audio API synthesis

The integrated application is now **`index.html`** at the project root, combining real TramEngine, ProximityEngine, live GPS, Leaflet map, and Web Audio API synthesis in a single page. Docker build confirmed working; served via nginx with COEP/COOP headers for AudioWorklet compatibility.

#### **5\. Documentation & Planning**

A comprehensive project overview document (currently WIP) brings together the full development narrative, including project documentation, the technical architecture presented in this document, route analysis and photography from the prototype walk, and identification of infrastructure data sources for all 5 layers. This documentation establishes the complete scope and validates the feasibility of the funded development work.

# Future Development Work

### **Phase 1: Geographic Expansion & Core Integration**

**Geographic Data Expansion**

This involves extracting full District 1 infrastructure geodata for each infrastructure layer. The scope increases are: tram feeders from 366 (prototype) to ~800-1000 (full District 1), plus 4 new infrastructure types (water, sewage, electricity, telecom), resulting in a total of ~4,000-5,000 infrastructure elements.

Once the raw datasets have been identified, it will be necessary to adapt the existing extraction script ([`scripts/extract-route-waypoints.js`](https://github.com/Gombassa/hiddeninfrastructures-zurich/blob/main/scripts/extract-route-waypoints.js)) for each infrastructure type. The key algorithm features are graph-based extraction from LineString geodata, 5m snap tolerance to merge parallel infrastructure, topology preservation (critical for network sonification), and arc-length sampling (maintains experiential distance).

**SpatialAudioController.js**

Critical to this phase is the integration of the existing engines with the Web Audio API spatial audio system:

* Mercator coordinate transformation (lat/lng → metres relative to listener position and heading)
* 6-layer audio mixing (5 infrastructure + 1 district theme)
* Real-time position updates based on device GPS and compass
* PannerNode positioning per infrastructure element, updated each GPS tick
* Parameter modulation based on proximity data from ProximityEngine

**RNBO Validation**

Phase 1 includes validating the Max/MSP → RNBO → WebAssembly → AudioWorklet pipeline in the browser. A single test patch will be authored in Max/MSP, exported via RNBO, and integrated into the application to confirm the production sound design workflow functions as intended before committing to it for all five layers.

**GPS Integration — ListenerEngine Enhancement**

Once spatial audio rendering is functional and tested, the fixed route simulation is replaced with free-roam GPS exploration via `navigator.geolocation.watchPosition()` and compass heading from `DeviceOrientationEvent`. Dynamic infrastructure loading culls elements beyond audible range to manage the increased data volume.

### **Phase 2: Sound Design & Musical Composition**

**Tram Electrical Layer**

The tram electrical layer has placeholder Web Audio API synthesis — a noise burst crackle for feeder events and a detuned oscillator pair drone for substation proximity. Production sound design will be authored in Max/MSP and exported via RNBO. The full District 1 deployment will have 800-1000 feeders, which changes the sonic character significantly — denser spatial texture, more overlapping events, and a need for clearer sonic differentiation so individual triggers remain perceptually distinct.

**Water Supply Layer**

Water infrastructure sonification starts from scratch. The sonic concept centres on hydraulic pulse — the rhythmic compression and release of water moving through pipes under pressure — combined with flow textures and pumping station rhythms. The Max/MSP patch will map to WVZ Leitungskataster infrastructure points. The data source is identified and accessible; sound design has not started.

**Sewage Layer**

The sewage layer occupies the low-frequency register — deep bass churn representing the movement of waste through underground collectors, rumble textures evoking the hidden infrastructure beneath streets, and treatment facility processes. The sonic palette needs to feel subterranean and visceral without being unpleasant. The patch will draw from ERZ Abwasser infrastructure points. Data source identified; sound design has not started.

**Electricity Grid Layer**

Electrical infrastructure occupies the opposite end of the frequency spectrum — transformer hum in the low-mid range, high-frequency harmonic content from high-voltage equipment, and voltage fluctuations creating rhythmic variation. The patch will map to ewz electricity infrastructure points. Data source identified; sound design has not started.

**Telecommunications Layer**

The telecom layer is the most abstract — data chirps, fiber optic whispers (high-frequency textural noise), and bandwidth pulses reflecting network traffic intensity. The patch maps to ewz telecom infrastructure points. Data source identified; sound design has not started.

**District 1 Musical Theme**

The district musical theme functions as the foundation layer that all five infrastructure types perform atop — a procedurally-generated electronic ambient composition reflecting Altstadt's character, expressed through generative Max/MSP algorithms rather than a fixed score. Sonic concept is defined; composition has not started.

### **Phase 3: Progressive Web App Deployment**

**Service Worker & Offline Capability**

The Service Worker acts as a programmable network proxy, implementing a caching strategy that makes the app work offline after initial load. All infrastructure geodata (5 layers, ~4,000-5,000 elements), RNBO-compiled WASM patches, and core application code get cached locally. Once cached, the app launches without internet — only real-time tram positions require connectivity, gracefully degrading to last known positions when offline.

**Web App Manifest**

The Web App Manifest is a JSON file containing metadata (app name, icons, theme colours) that enables home screen installation. Users can add the app alongside native apps, launching it in full-screen mode without browser chrome.

**Cross-Platform Testing**

iOS Safari and Android Chrome handle PWAs differently — iOS is more restrictive on geolocation permissions, compass access, and background audio. Testing verifies spatial audio works correctly on both platforms, GPS and compass permissions are requested properly, installation works from browser menus, and battery consumption remains reasonable. Multiple device models across OS versions catch platform-specific issues.

### **Phase 4: Testing & Refinement**

**User Testing Sessions**

15 participants walk actual District 1 routes, revealing issues invisible in simulated testing: GPS drift near buildings, compass calibration problems, audio mixing when layers overlap, confusing UI elements, battery drain. Structured feedback via in-app surveys and post-walk interviews identifies which sonic layers are legible, whether spatial positioning feels accurate, and if the experience engages or overwhelms.

**Performance Optimization**

With 4,000-5,000 infrastructure elements plus real-time tram data, optimization is critical for mobile performance. Spatial culling algorithms process only infrastructure within audible range (200-500m depending on layer). RNBO patches are kept lightweight to manage CPU load. Memory management avoids garbage collection pauses that cause audio dropouts. GPS update rate balances positioning accuracy against battery consumption. Target: stable spatial audio with no dropouts, battery drain under 25% over 30 minutes.

**Documentation & Bug Fixes**

User-facing documentation covers PWA installation, walking instructions, and infrastructure layer explanations. Technical documentation includes system architecture, API integration details, Max/MSP patch designs, and deployment procedures. Bug fixes address edge cases discovered during user testing.

### **Phase 5: Public Launch**

**Beta Testing Period**

50-100 early adopters test the app before official launch, catching scale-dependent issues: server load with concurrent users, edge cases in geodata not covered by initial testing, UX issues across a diverse user base. Feedback informs final adjustments.

**Launch Event**

Held at a District 1 location with good infrastructure density (Paradeplatz or Bellevue), the event includes guided walks, artist talks explaining the technical and conceptual approach, and hands-on tryouts. Pre-prepared press materials facilitate media coverage.

**Public Deployment**

The app goes live at a permanent URL, accessible to anyone with a smartphone. Server monitoring catches technical issues and handles scaling if needed. Promotional activities include Zurich cultural event listings, social media, submissions to sound art and digital art festivals, and potential partnerships with VBZ or Stadt Zürich tourism.

# 1\. System Architecture Overview

## **Data Flow**

### **1\. External Data Sources**

**Static Infrastructure Geodata (pre-loaded, cached locally):**

* Tram electrical: 366 feeders (prototype) → ~800-1000 (full District 1) — VBZ Infrastruktur OGD
* Water supply: Distribution pipes, pumping stations — WVZ Leitungskataster
* Sewage: Main collectors, treatment facilities — ERZ Abwasser-Werkleitungsdaten
* Electricity grid: Substations, transformers — ewz Werkleitungsdaten
* Telecommunications: Fiber nodes, data hubs — ewz Telecom

**Real-time Data:**

* Tram positions: transport.opendata.ch API (10-second polling interval)

### **2\. Core Engines (ES6 Modules, 498 lines total)**

**TramEngine** — Polls transport.opendata.ch API, interpolates tram positions between stops. Unique among infrastructure types because trams move in real-time.

**ProximityEngine** — Loads infrastructure geodata for all 6 layers from GeoJSON files. Calculates distances between user, trams, and infrastructure elements. Determines audio trigger parameters based on proximity thresholds.

**AudioLayers** — Web Audio API synthesis for all 6 infrastructure layers (tram electrical, water, sewage, electricity, telecom, fernwärme). All synthesis lives here; `index.html` contains no audio synthesis code. `AudioLayers.onListenerMove(lat, lng, heading)` updates spatial panner positions on GPS fix between tram ticks. Per-layer `LAYER_ENABLED` flags control each layer independently at runtime.

**GPS Listener** (inline in `index.html`) — GPS position from `navigator.geolocation.watchPosition()` + compass heading from `DeviceOrientationEvent`.

### **3\. Spatial Audio Controller (new development)**

* Receives position data from ListenerEngine (user lat/lng/heading)
* Receives proximity data from ProximityEngine (distances to infrastructure)
* Receives tram activity from TramEngine (real-time positions)
* Converts lat/lng offsets to metres using equirectangular projection relative to listener position
* Manages 6-layer audio mixing: tram electrical, water supply, sewage, electricity grid, telecommunications, District 1 musical theme
* Creates a Web Audio API PannerNode (HRTF mode) per active infrastructure element
* Updates PannerNode x/z coordinates each GPS tick based on bearing and distance to each element
* Modulates synthesis patch parameters based on proximity and tram activity

### **4\. Audio Engine**

During development, synthesis runs as direct Web Audio API code — oscillators, noise nodes, and gain envelopes wired in JavaScript. This allows pipeline validation at every iteration without requiring compiled patches.

For production, sound design patches are authored in Max/MSP and compiled to WebAssembly via RNBO for browser deployment. Each infrastructure layer has one or more patches covering its range of sonic behaviours — continuous drones, triggered events, proximity-modulated textures. The exact patch count will emerge from the sound design process.

**RNBO Integration (production):**

* Patches compiled from Max/MSP via RNBO to self-contained WASM modules
* Parameters addressable from JavaScript main thread via RNBO parameter interface
* AudioWorklet runs DSP on dedicated high-priority thread
* Each patch output connects to a PannerNode for spatial positioning

### **5\. Web Audio API Spatial Positioning**

* PannerNode per infrastructure element, panningModel set to HRTF
* Distance-based volume attenuation per element (rolloffFactor tuned per layer type)
* Bearing from listener to element calculated each GPS tick; converted to PannerNode x/z coordinates
* Compass heading from DeviceOrientationEvent rotates the reference frame so sources move correctly as the user turns
* 6-layer gain nodes for mix control

### **6\. Performance Optimization**

**Spatial Culling:** With 4,000-5,000 infrastructure elements, calculating distances every tick is computationally expensive. Grid-based spatial indexing (100m × 100m cells) enables querying only infrastructure within audible range (~500m, adjustable per layer). Grid bucketing followed by distance filtering provides a 10x reduction in calculations compared to checking all elements.

**Audio Source Pooling:** Pre-allocating a pool of PannerNodes per infrastructure type and recycling them as elements enter and leave range eliminates garbage collection pauses during user movement.

**Patch Efficiency:** Production patches are kept lightweight by design — no heavy FFT or convolution. CPU load scales with the number of active pool nodes, capped by the culling radius.

### **7\. Deployment Architecture**

**Hosting Infrastructure:** Google Cloud Platform (existing account). Static assets served via Cloud Storage + Cloud CDN or Cloud Run container. Nginx web server with HTTPS, HTTP/2, and gzip compression. Estimated CHF 5-10/month at expected traffic levels.

**Docker:** Multi-stage Dockerfile — build stage compiles RNBO patches and runs extraction scripts; serve stage is an Nginx image serving the resulting static assets. Same image runs in development and production, eliminating configuration drift.

**Continuous Deployment:** CI/CD pipeline triggers on repository updates: install dependencies → compile RNBO patches → run extraction scripts → build Docker image → deploy to GCP.

### **8\. Testing Strategy**

**Unit Tests:** Engine modules tested for core functionality — position interpolation, API failure handling, haversine distance accuracy, trigger detection, binary search, heading calculation.

**Integration Tests:** End-to-end browser automation verifies the complete user flow: geolocation permission grant, data fetching, spatial audio initialisation, position-triggered audio changes.

**Audio Testing:** Manual verification of spatial audio using test tones at known positions. Validates left/right/front/back panning accuracy, distance attenuation behaviour, and compass heading integration across device types.

### **9\. Monitoring & Analytics (Anonymous)**

**Error Reporting:** Anonymous error logging captures browser info (user agent) only — no GPS coordinates, no user IDs, no session tracking.

**Performance Metrics:** Core Web Vitals tracking (page load time, FCP, LCP) and custom performance marks (audio initialisation time). No user tracking or behavioural profiling.

### **10\. Output**

Headphones or speakers on user's smartphone.

# Future Technical Enhancements

**District Expansion (2027-2030)**

Scale to postal codes 8002-8006 with a unique musical theme per district. Same 5 infrastructure layers with district-specific sonic character. Auto-switch theme based on user's GPS-detected postal code.

**Advanced Spatial Audio**

Higher-order ambisonics using a first-order encoding library for more immersive surround positioning and improved front/back differentiation.

**Multilingual Support**

Browser language auto-detection determines UI language (German, English, French, Italian). Translations loaded dynamically. Audio itself is universal — no language barrier.

**Voice Navigation**

Web Speech API for audio announcements to visually impaired users. Speaks nearby infrastructure names and distances, announces when entering or exiting District 1 boundaries.

**Machine Learning Integration**

TensorFlow.js for tram position prediction between API polls. Model trained on historical movement data interpolates smoother trajectories, reducing perceived latency in audio triggers.

# Conclusion: Technical Feasibility & Development Readiness

The system architecture is technically sound and ready for implementation. Core technologies are validated: the Web Audio API synthesis pipeline functions correctly in the browser, three engine modules (TramEngine, ProximityEngine, ListenerEngine) are implemented and tested across 498 lines of code, and all infrastructure geodata sources are accessible via Stadt Zürich open data programs. The Phase 0 pipeline test confirms that proximity data from stub engines drives audio synthesis correctly, with feeder trigger events and drone modulation both functioning as designed.

Development work is clearly scoped: geographic expansion from the 2.7km prototype route to full District 1 coverage with five infrastructure types, sound design for five infrastructure layers plus district theme authored in Max/MSP and exported via RNBO, spatial audio integration connecting engines to Web Audio API PannerNodes, GPS implementation replacing simulation with device sensors, and PWA deployment with offline capability. The prototype proves the concept works; the development phase scales proven components to production scope.

Technical risks are mitigated through validated prototypes and mature, stable technologies. Development risks are managed through iterative development, continuous testing, and a six-month timeline with buffer. Privacy-by-design architecture ensures FADP/GDPR compliance throughout.

**Document Version:** 3.1  
**Last Updated:** April 2026  
**Author:** Robin Pender  
**Contact:** robinpender23@gmail.com  
**Repository:** https://github.com/Gombassa/hiddeninfrastructures-zurich  
**Funding Application:** Stadt Zürich Digitale Künste: Umsetzung und Präsentation (CHF 13,200)
