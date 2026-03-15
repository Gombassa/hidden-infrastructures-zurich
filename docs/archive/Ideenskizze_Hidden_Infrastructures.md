# Hidden Infrastructures: Zürich — Ideenskizze

## Digitale Künste: Ideenfindung und Konzeptentwicklung

---

## Artist CV

Robin Pender is a sound designer, electro-acoustic composer, field recordist and multidisciplinary artist with over 20 years of professional experience spanning audio post-production, broadcast engineering, spatial audio, electro-acoustic composition, and interactive/generative music systems.

### Professional Background

* L2 AV Break Fix Engineer, UBS Zurich (2023–present)
* Event Technician and Regional Technical Lead EMEA, Google (2019–2020)
* Senior Audio Post-Production Engineer, Qatar Television (2012–2019)
* Senior Sound Specialist, Al Jazeera International (2008–2012)
* Sound Supervisor, London College of Communication (2002–2008)

### Education

* MSc Sound Design, Edinburgh Napier University (2018)
* PGCE Learning and Teaching for Arts and Design, London College of Communication (2002)
* HND Sonic Arts and Music Technology, London College of Printing (2000)

### Artistic Practice

Robin's sound artworks explore the world and human relationships to the non-apparent. He is interested in location-based audio experiences and urban psychogeography and, in the context of this piece, sonification of data and systems. He is also interested in the creative application of agentic AI to enhance and support technical realisation of human creativity. Recent projects include "Teleporter Dome" (WebXR spatial audio installation), a series of field recordings of the annual Temple Burn at Black Rock City, and "Vapoosh!" (a maths-based educational mobile and web-based game).

### Zurich Residency

Residing in Zurich since 2020, creative works encompass composition, field recordings, sculpture, print-making, explorations of bioacoustic methodologies and delving into the Stadt Zürich open data infrastructure.

### Selected Works

**Composition**
* Gombassa@Bandcamp

**Field Recordings**
* Once You've Heard One
* Temple of Direction 2019
* Empyrean Temple 2022
* Temple of Together, 2024

**Film / TV Sound Design**
* Bahrain: Shouting In The Dark
* Qatar TV Muezzin Competition 2025
* Al Johara
* Mousakka and Chips
* As Old As My Tongue
* Crossing Bridges
* Rituals Of Fire

**App Development**
* Vapoosh!
* Teleporter Dome

---

## Project Concept

Hidden Infrastructures is a location-based generative music application that transforms Zurich's hidden urban infrastructure into an immersive spatial audio experience. As users walk freely through District 1 (Altstadt), their smartphone generates real-time procedural soundscapes driven by five layers of unapparent systems: tram electrical network, water supply, sewage, electricity grid, and telecommunications.

All audio is generated through real-time procedural synthesis using WebAssembly-compiled Pure Data or Max/MSP patches: the application contains no samples or pre-rendered audio assets. The listener's physical movement through space is the compositional element: proximity to infrastructure elements, real-time tram positions, and the density of overlapping systems determine what is heard and how it is spatially positioned.

Core to the concept of what it addresses and how it is built, the app collects NO personal data. GPS coordinates are processed entirely on-device and never transmitted. There are no user accounts, no analytics, no tracking. In a landscape where data collection happens by default, this absence is a deliberate artistic statement, not just a technical decision. The project makes this visible through a score archive feature: the only data the app offers to share is the timestamped interaction between the listener and the procedural synthesis engine: parameter and control data that can regenerate the audio of a walk, but reveals nothing about where the person actually was.

---

## Concept Development Phase

This application covers the concept development and technical validation phase of the project: proving that five layers of municipal infrastructure geodata can be transformed into a coherent, legible, and artistically compelling spatial audio experience.

The concept phase delivers:

* Integration of three existing JavaScript engines (TramEngine, ProximityEngine, ListenerEngine: 498 lines of tested code) with the WebPd/WASM audio pipeline and Three.js spatial audio positioning
* GPS and compass integration via the Geolocation and DeviceOrientationEvent browser APIs, replacing the current route simulation with real device positioning
* Processing of four additional infrastructure datasets from Stadt Zürich's open data portal (WVZ water, ERZ sewage, ewz electricity, ewz telecom) using extraction scripts adapted from the validated tram data pipeline
* Placeholder Pure Data patches for all five infrastructure layers, proving that multi-layer procedural synthesis driven by real geodata works in the browser
* A working prototype on the 2.7km route (Stadelhofen → Bellevue → Paradeplatz → Rennweg → HB → Bürkliplatz) demonstrating all five layers running simultaneously
* Docker containerisation for a reproducible build environment (Pure Data → WebPd compilation → static assets)
* A proof-of-concept video demonstrating the experience

This phase validates the core artistic and technical concept. A subsequent application for Umsetzung und Präsentation would cover geographic expansion to full District 1 (postal code 8001), production sound design, GPS free-roam, PWA deployment, user testing, and public launch.

---

## Digital Technologies as Integral Artistic Component

The digital technologies in this project are not tools applied to a pre-existing artistic idea — they are the material from which the artwork is constituted. Without real-time municipal data, there is no composition. Without GPS positioning, there is no site-specificity. Without procedural synthesis, there is no infinite variation. The artwork could not exist in any other form.

Stadt Zürich's open data becomes the score: real-time tram positions from transport.opendata.ch drive generative music that changes with every passing vehicle. The five infrastructure geodatasets (VBZ, WVZ, ERZ, ewz) define the spatial and sonic landscape — the city's own data literally composes the piece. GPS positioning makes the listener's physical location the cursor through this composition, determining which sounds emerge and how they are spatially positioned around them. Procedural synthesis ensures that no two walks ever produce the same sonic experience, even on the same route — the work is performed anew each time.

The project also uses digital technology to empower the listener's awareness and control of their own data. In a landscape where apps silently harvest location and usage data, this application processes GPS entirely on-device and transmits nothing. The score archive feature makes this visible: the only data the listener can choose to share is the musical output of their interaction with the synthesis engine, not their location or identity. Digital technology here returns agency over personal data to the user, making the absence of surveillance an active, conscious experience rather than an invisible default.

The audio-first methodology keeps users' eyes free to observe the physical environment while their ears reveal hidden layers of urban infrastructure.

---

## Energy Consumption and Resource Efficiency

The project addresses energy consumption through its core technical architecture:

* Procedural synthesis generates all audio in real-time rather than streaming pre-rendered files, significantly reducing data transfer and server load
* WebAssembly compilation ensures CPU-efficient audio processing
* Spatial culling renders only nearby infrastructure, keeping the audio graph lean regardless of total dataset size
* Docker containerisation ensures consistent, efficient builds with no redundant processing

---

## Data Handling and Privacy Architecture

The project demonstrates responsible data handling across multiple dimensions. All infrastructure data comes from public Stadt Zürich open data programs (VBZ, WVZ, ERZ, ewz), celebrating the city's commitment to transparency.

User privacy is protected by design: GPS processing happens entirely on-device with no location tracking, there are no user accounts, no analytics, and no third-party data sharing. The architecture is fully compliant with FADP/GDPR privacy regulations.

The score archive feature turns this privacy-first approach into an active artistic statement. In a landscape where data collection is the default, this project collects nothing: and makes that visible by offering only music, not surveillance, as an opt-in shareable output.

---

## Connection to Stadt Zürich

The project is fundamentally rooted in Zurich's commitment to open data and digital transparency. It draws from five distinct municipal data sources across VBZ, WVZ, ERZ, and ewz, weaving them into a coherent artistic experience that celebrates the city's investment in comprehensive open data. District 1's Altstadt is where Zurich's invisible infrastructure is densest: where the city's historic character meets its contemporary technological sophistication.

---

## Current Development Status

The project is not starting from zero. The following components are built and tested:

* **TramEngine.js** (180 lines): fetches real-time tram positions from transport.opendata.ch, interpolates movement between 6 stop pairs, updates every 10 seconds
* **ProximityEngine.js** (125 lines): calculates distances between trams and infrastructure, triggers audio events when trams pass feeders (30m radius)
* **ListenerEngine.js** (193 lines): simulates walking along the prototype route (75 waypoints, 2.7km), calculates heading for spatial audio
* **VBZ tram geodata**: downloaded and processed (1,689 wire segments, 366 feeders, 258 poles, 75 route waypoints)
* **WebPd compilation pipeline**: validated with two test patches running simultaneously in the browser
* **Route processing pipeline**: extraction script with graph building, parallel track merging, A* pathfinding, and arc-length sampling

The concept development phase builds on this foundation.

---

## Budget (CHF 9,000)

| Item | Amount (CHF) |
|------|-------------|
| Artist fee — concept development, sound design prototyping, data processing and technical integration | 4,700 |
| Sozialversicherungsabgaben (AHV/IV/EO, ~6% of artist fee) | 300 |
| Development hardware — replacement MacBook Pro (current machine failing) | 2,500 |
| Hosting and development infrastructure (GCP, domain) | 500 |
| Documentation, proof-of-concept video, testing and iteration | 1,000 |
| **Total** | **9,000** |

---

## Timeline

**March 2026:** Spatial audio and engine integration, GPS positioning, basic tram layer patches, proof-of-concept demo

**April 2026:** Docker build environment, hosting setup. Water, sewage, electricity, and telecom data processing. Extraction scripts, ProximityEngine updates, placeholder patches for each layer

**May 2026:** Multi-layer integration and mixing. All five layers running simultaneously on prototype route. Proof-of-concept video

**June 2026:** Documentation, iteration, concept phase complete

**July 2026:** Commence Production stage

---

## Resources

**GitHub Repository:** https://github.com/Gombassa/invisible-infrastructures-zurich
