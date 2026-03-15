**Hidden Infrastructures: Zürich: An Interactive Urban Sound Symphony**

## **Stadt Zürich Kulturförderung**

## **Digitale Künste: Umsetzung und Präsentation**

## **Applicant Information**

**Name:** Robin Pender  
 **Address:** Seestrasse 671, 8706 Meilen, Zurich, Switzerland  
 **Email:** robinpender23@gmail.com **Phone:** \+41 787 238603  
 **Project Duration:** March 2026 \- November 2026  
 **Requested Amount:** CHF 13,200

**Github Repo**: [https://github.com/Gombassa/invisible-infrastructures-zurich](https://github.com/Gombassa/invisible-infrastructures-zurich)

## **Project Description (EN)**

Hidden Infrastructures is a location-based generative music application that transforms Zurich's hidden urban infrastructure into an immersive spatial audio experience. As users walk freely through District 1 (Altstadt), their smartphone generates real-time procedural soundscapes driven by five layers of invisible systems beneath their feet: tram electrical network, water supply, sewage, electricity grid, and telecommunications.

The project sonifies Zurich's complete hidden infrastructure ecosystem within the historic city center, deriving from both real-time and static data sources via the city's open data programs:

* **Tram electrical:** 366 power feeders (VBZ static geodata) \+ real-time tram positions (transport.opendata.ch API)  
* **Water supply:** Distribution pipes, pumping stations (WVZ Leitungskataster static geodata)  
* **Sewage:** Main collectors, treatment facilities (ERZ Abwasser-Werkleitungsdaten static geodata)  
* **Electricity grid:** High-voltage substations, distribution transformers (ewz Werkleitungsdaten static geodata)  
* **Telecommunications:** Fiber optic nodes, data infrastructure (ewz Telecom static geodata)

Each infrastructure type generates its own sonic signature \- tram feeders crackle when drawing power, water systems pulse hydraulically, sewage churns in deep bass, electrical grids emit harmonic screams, fiber networks chirp with data streams. These are represented with multiple procedural audio layers that combine with a composed musical theme specific to District 1, creating a dynamic sonic portrait where infrastructure "performs" atop the district's musical foundation. All audio is generated through real-time procedural synthesis; the application contains no samples or pre-rendered audio assets.

The app collects zero personal data. GPS coordinates are processed entirely on-device and never transmitted. There are no user accounts, no analytics, no tracking. In a landscape where data collection happens by default, this absence is a deliberate artistic statement, not just a technical decision. The project makes this visible by offering the only thing it *can* share: users may optionally record the "score" of their walk \- the timestamped parameter and control data sent to the synthesis engine \- and contribute it to a public archive. The archive contains music, not surveillance. Scores can be replayed through the same patches to regenerate the audio of any walk, but they reveal nothing about where the person actually walked. Users may also download a recording of their walk's audio output in their choice of format.

The application uses WebAssembly-compiled Pure Data patches for procedural audio synthesis, Three.js for spatial audio positioning, Docker for reproducible builds and deployment, and Progressive Web App technology for accessibility. It works on any smartphone. The experience is optimized for listen-through or open-ear headphones (such as bone conduction) that allow users to remain aware of their physical surroundings while experiencing the augmented soundscape, though the work is designed to be inclusive of all audio presentation modes including traditional closed-back headphones and open speakers. Digital technologies are integral to the artistic concept: real-time open data drives generative composition, GPS positioning creates site-specificity, and Web Audio API enables sophisticated spatial audio without requiring specialized hardware.

The work sits at the intersection of sound art, data sonification, and urban psychogeography \- celebrating rather than critiquing the city's hidden systems. The audio-first methodology keeps users' eyes free to observe the physical environment while their ears reveal invisible layers of urban infrastructure.

**Target completion:** August 2026  
 **Public launch:** August/September 2026 (free-roam GPS exploration, District 1\)  
 **Post-launch expansion:** Districts 2-6 (2027-2030)

## **Projektbeschreibung (DE)**

Hidden Infrastructures ist eine standortbasierte, generative Musik-Anwendung, die Zürichs verborgene urbane Infrastruktur in ein immersives räumliches Audio-Erlebnis verwandelt. Während Benutzer frei durch den Kreis 1 (Altstadt) gehen, erzeugt ihr Smartphone Echtzeit-Soundscapes, die von fünf Schichten unsichtbarer Systeme unter ihren Füssen gesteuert werden: Tram-Stromnetz, Wasserversorgung, Abwasser, Elektrizitätsnetz und Telekommunikation.

Das Projekt sonifiziert Zürichs komplettes verstecktes Infrastruktur-Ökosystem innerhalb der historischen Altstadt und nutzt dabei sowohl Echtzeit- als auch statische Datenquellen aus den Open-Data-Programmen der Stadt:

* **Tram-Elektrik:** 366 Speisekabel (VBZ statische Geodaten) \+ Echtzeit-Trampositionen (transport.opendata.ch API)  
* **Wasserversorgung:** Verteilungsleitungen, Pumpstationen (WVZ Leitungskataster statische Geodaten)  
* **Abwasser:** Hauptsammler, Kläranlagen (ERZ Abwasser-Werkleitungsdaten statische Geodaten)  
* **Elektrizitätsnetz:** Hochspannungsumspannwerke, Verteiltransformatoren (ewz Werkleitungsdaten statische Geodaten)  
* **Telekommunikation:** Glasfaserknoten, Dateninfrastruktur (ewz Telecom statische Geodaten)

Jeder Infrastrukturtyp erzeugt seine eigene klangliche Signatur \- Tram-Speisekabel knistern beim Stromziehen, Wassersysteme pulsieren hydraulisch, Abwasser brodelt in tiefen Bässen, Elektrizitätsnetze emittieren harmonische Schreie, Glasfasernetze zwitschern mit Datenströmen. Diese prozeduralen Audio-Ebenen verbinden sich mit einem komponierten musikalischen Thema, das spezifisch für Kreis 1 ist, und schaffen ein dynamisches Klangporträt, in dem Infrastruktur auf der musikalischen Grundlage des Stadtteils "performt". Sämtliches Audio wird durch prozedurale Echtzeitsynthese erzeugt; die Anwendung enthält keine Samples oder vorgerenderten Audio-Assets.

Die App erhebt keinerlei persönliche Daten. GPS-Koordinaten werden ausschliesslich auf dem Gerät verarbeitet und nie übertragen. Es gibt keine Benutzerkonten, keine Analysen, kein Tracking. In einer Landschaft, in der Datenerhebung standardmässig stattfindet, ist dieses Fehlen eine bewusste künstlerische Aussage, nicht nur eine technische Entscheidung. Das Projekt macht dies sichtbar, indem es das Einzige anbietet, was es teilen *kann*: Benutzer können optional die "Partitur" ihres Spaziergangs aufzeichnen \- die zeitgestempelten Parameter- und Steuerdaten, die an die Synthese-Engine gesendet werden \- und sie einem öffentlichen Archiv beitragen. Das Archiv enthält Musik, keine Überwachung. Partituren können über dieselben Patches abgespielt werden, um das Audio eines Spaziergangs zu regenerieren, verraten aber nichts darüber, wo sich die Person tatsächlich befand. Benutzer können auch eine Aufnahme der Audioausgabe ihres Spaziergangs in einem Format ihrer Wahl herunterladen.

Die Anwendung verwendet WebAssembly-kompilierte Pure Data Patches für prozedurale Audiosynthese, Three.js für räumliche Audiopositionierung, Docker für reproduzierbare Builds und Deployment, und Progressive Web App-Technologie für Zugänglichkeit \- funktioniert auf jedem Smartphone. Das Erlebnis ist für Durchhör- oder Open-Ear-Kopfhörer (wie Knochenleitungs-Kopfhörer) optimiert, die es Benutzern ermöglichen, sich ihrer physischen Umgebung bewusst zu bleiben, während sie die erweiterte Klanglandschaft erleben, obwohl das Werk inklusiv für alle Audio-Präsentationsmodi gestaltet ist, einschließlich traditioneller geschlossener Kopfhörer und offener Lautsprecher. Digitale Technologien sind integraler Bestandteil des künstlerischen Konzepts: Echtzeit-Open-Data steuert generative Komposition, GPS-Positionierung schafft Ortsspezifität, und Web Audio API ermöglicht hochentwickeltes räumliches Audio ohne spezialisierte Hardware.

Das Werk liegt an der Schnittstelle von Klangkunst, Datensonifizierung und urbaner Psychogeographie \- es feiert statt kritisiert die verborgenen Systeme der Stadt. Die Audio-First-Methodik hält die Augen der Benutzer frei, um die physische Umgebung zu beobachten, während ihre Ohren unsichtbare Schichten städtischer Infrastruktur enthüllen.

**Fertigstellung:** August 2026  
 **Öffentlicher Start:** August/September 2026 (GPS-Freiroam-Erkundung, Kreis 1\)  
 **Erweiterung nach Start:** Kreise 2-6 (2027-2030)

## **Artist Biography**

Robin Pender is a sound designer, electro-acoustic composer, field recordist and multidisciplinary artist with over 20 years of professional experience spanning audio post-production, broadcast engineering, spatial audio, electro-acoustic composition, and interactive/generative music systems.

**Professional Background**

* L2 AV Break Fix Engineer, UBS Zurich (2023–present)  
* Event Technician and Regional Technical Lead EMEA, Google (2019–2020)  
* Senior Audio Post-Production Engineer, Qatar Television (2012–2019)  
* Senior Sound Specialist, Al Jazeera International (2008–2012)  
* Sound Supervisor, London College of Communication (2002–2008)

**Education**

* MSc Sound Design, Edinburgh Napier University (2018)  
* PGCE Learning and Teaching for Arts and Design, London College of Communication (2002)  
* HND Sonic Arts and Music Technology, London College of Printing (2000)

**Artistic Practice**

Robin's sound artworks explore the world and human relationships to the non-apparent. He is interested in location-based audio experiences and urban psychogeography and, in the context of this piece, sonification of data and systems. He is also interested in the creative application of agentic AI to enhance and support technical realisation of human creativity. Recent projects include "Teleporter Dome" (WebXR spatial audio installation), a series of field recordings of the annual Temple Burn at Black Rock City, and "Vapoosh\!" (a maths-based educational mobile and web-based game).

**Zurich Residency**

Residing in Zurich since 2020, creative works encompass composition, field recordings, sculpture, print-making, explorations of bioacoustic methodologies and delving into the Stadt Zürich open data infrastructure.

## **Creative Overview**

### **Critical Reflection on Resource Conservation, Digital Implementation & Data Ethics**

Making invisible urban infrastructure audible creates awareness of the complex systems that enable sustainable city life. From the tram network's electrical grid to the water flowing through kilometres of pipes, from sewage treatment to telecommunications networks, these hidden layers constitute the city's circulatory system. The work aims to celebrate rather than critique, revealing the technological sophistication required for urban sustainability while respecting the privacy of the citizens who move through these systems.

This project addresses resource consumption through efficient technical implementation, built into its digital architecture:

* Procedural synthesis generates all sounds in real-time rather than streaming large pre-rendered audio files, significantly reducing data transfer and server load. The application contains no samples or pre-rendered audio assets.  
* WebAssembly compilation ensures CPU-efficient audio processing.  
* Progressive Web App architecture enables offline functionality after initial load.  
* Docker containerisation provides reproducible builds and consistent deployment to Google Cloud Platform.

The project has been conceived from a data-privacy perspective from the onset and demonstrates responsible data handling across multiple dimensions:

* All infrastructure data comes from public Stadt Zürich open data programs (VBZ, WVZ, ERZ, EWZ), celebrating the city's commitment to transparency.  
* User privacy is protected by design  
  * GPS processing happens entirely on-device with no location tracking  
  * No user accounts  
  * No analytics  
  * No third-party data sharing  
* The architecture is fully compliant with FADP/GDPR privacy regulations.  
* In a landscape where data collection happens by default, this absence is a deliberate artistic statement. The project makes this visible through its score archive feature: the only data the app can share is the interaction between the listener and the procedural synthesis engine \- timestamped parameter and control data that can regenerate the audio of a walk, but reveals nothing about where the person actually was. The archive contains music, not surveillance.

### **Public Accessibility & Cultural Participation**

The piece is designed to be radically accessible, requiring nothing more than what most people already carry: a smartphone with GPS and a web browser, plus any standard headphones. While the experience is optimized for listen-through or open-ear headphones (bone conduction or open-back models) that maintain environmental awareness for safety, it works equally well with closed-back headphones or even open speakers. There's no app store account needed, no registration, no login:- just open a browser and start walking.

The interface can support multiple languages (German, English, French, Italian), though the audio itself is universal, creating an experience without language barriers. The audio-first approach makes the work naturally accessible to visually impaired users, while the self-paced nature means there's no time pressure:- walk at whatever speed feels comfortable. The Stadelhofen to Paradeplatz route follows flat, wheelchair-accessible terrain along Bahnhofstrasse.

For the general public, this transforms a mundane commute or tourist walk into an artistic experience:- free, outdoor, always available, revealing the hidden systems that make the city function. The art and technology community will find genuine technical innovation in the WebAssembly audio engine and real-time data sonification, with the open-source PWA architecture inviting study and adaptation. Urban planners and transport enthusiasts gain a tool that makes invisible infrastructure tangible, celebrating the sustainable public systems that power contemporary urban life.

### **Relationship to Contemporary Practice**

The project builds on established traditions in site-specific sound art while forging new ground in data-driven urban sonification. One inspiration was Christina Kubisch's pioneering Electrical Walks use electromagnetic headphones to passively detect ambient electrical fields, creating serendipitous sonic discoveries as participants wander cities. Janet Cardiff's acclaimed Audio Walks layer carefully crafted narratives over specific routes, transforming walks into intimate theatrical experiences. More recently, various AR and VR projects have emerged that visualize hidden urban infrastructure, making invisible systems visible through screen-based overlays.

This project distinguishes itself through active sonification rather than passive detection:- every sound is generated from real infrastructure data, not ambient electromagnetic radiation. Unlike Cardiff's fixed narratives, the experience is entirely generative and procedural, responding to real-time conditions that change with every walk. And in contrast to visual AR/VR approaches, the audio-first methodology keeps users' eyes free to observe their actual surroundings while their ears reveal invisible layers, avoiding the screen-fixation that visual AR often demands.

The work occupies a unique intersection:- location-based spatial audio driven by real-time municipal data, procedurally generated and infinitely variable, publicly accessible without technical barriers, celebrating urban infrastructure as living systems rather than static monuments.

### **Connection to Stadt Zürich**

This project is fundamentally rooted in Zurich's commitment to open data and digital transparency. The work draws from five distinct municipal data sources:- VBZ's tram infrastructure datasets, WVZ's Leitungskataster documenting 1,550 km of water distribution networks, ERZ's sewage infrastructure geodata, ewz's electricity and telecommunications infrastructure, and transport.opendata.ch's real-time tram positions. By weaving these datasets together into a coherent artistic experience, the project celebrates the city's investment in comprehensive open data across multiple departments while demonstrating the creative potential of municipal digital infrastructure.

The initially proposed walking route itself is quintessentially Zurich. Following the iconic Bahnhofstrasse through District 1's Altstadt, the walk from Stadelhofen to Paradeplatz captures the heart of the city's commercial and cultural center. This isn't arbitrary geography:- it's where Zurich's invisible infrastructure is densest, where the city's historic character meets its contemporary technological sophistication. The District 1 musical theme will reflect this character, with potential expansion to Districts 2 through 6 allowing the project to eventually encompass central Zurich's diverse neighborhoods.

The work aligns naturally with Stadt Zürich's cultural values: innovation in digital arts through WebAssembly audio and real-time data sonification, public accessibility through free outdoor browser-based access without barriers, cultural participation open to all regardless of technical knowledge or language, and celebration of the sustainable infrastructure:- tram networks, water systems, clean energy:- that makes contemporary urban life possible.

### **Potential Expansion & Long-Term Vision**

Following a successful District 1 launch, the project could expand incrementally to cover Zurich's central districts over subsequent years. Each district might feature the same five infrastructure layers (tram electrical, water, sewage, electricity, and telecommunications) but with its own distinct musical identity. Altstadt's procedural electronic theme could set the foundation, while Enge might explore water-influenced soundscapes reflecting its lakeside character. Wiedikon could bring domestic and comfortable tones suited to residential life, while Aussersihl's multicultural energy might call for diverse and dynamic composition. The Industriequartier could honor its mechanical heritage with rhythmic industrial textures, and Unterstrass might celebrate its green suburban character with park-inspired sounds.

This expansion could embrace a collaborative model where local sound artists contribute procedural elements and synthesis parameters derived from sonic memory workshops with residents. District cultural centers might serve as presentation partners, and the open-source framework could welcome algorithmic contributions from collaborators. This approach would transform the project from a solo artistic work into a collectively-built sonic portrait of Zurich.

Future funding might come from multiple sources: Stadt Zürich Digitale Künste continuation grants could form the foundation, with district-specific sponsorships from local businesses and cultural institutions adding targeted support. National-scale funding through Pro Helvetia and Migros Culture Percentage may support the broader vision, while academic partnerships with ZHdK and ETH could generate research outputs and institutional backing.

Partnership opportunities may extend beyond funding. VBZ could provide infrastructure access and data validation, ewz might offer public education value and sponsorship potential, WVZ and ERZ could bring educational outreach around water and environmental systems. District cultural centers may become natural presentation partners as the work expands geographically, while ZHdK and ETH collaborations could produce academic research outputs in urban sound studies and digital humanities.

The project's ongoing operational costs are deliberately minimal—approximately CHF 500 annually for GCP hosting and domain management—ensuring long-term sustainability without continuous grant dependency. The open-source code repository on GitHub, technical writeups for the sound art community, and potential submissions to international festivals (Ars Electronica, MUTEK, Transmediale, Sonar+D) could generate visibility for both the work itself and Stadt Zürich's pioneering open data infrastructure.

## **Technical Implementation**

### **Core Technologies**

**Audio Engine:**

* Pure Data patches compiled to WebAssembly via WebPd  
* Procedural synthesis for 5 infrastructure types (all audio generated in real-time, no samples or pre-rendered assets)  
* Real-time parameter modulation based on proximity and activity  
* District musical theme layer (composed, adaptive)

**Infrastructure Layers:**

1. **Tram electrical** \- Feeder crackle when trams draw power, electrical transients  
2. **Water supply** \- Hydraulic pulse, flow textures, pumping station rhythms  
3. **Sewage** \- Deep bass churn, underground rumble, treatment facility processes  
4. **Electricity grid** \- High-frequency harmonic screaming, transformer hum, voltage fluctuations  
5. **Telecommunications** \- Data chirps, fiber optic whispers, bandwidth pulses

**Spatial Audio:**

* Three.js PositionalAudio for 3D sound positioning  
* Device compass/GPS determines user orientation and movement direction  
* Infrastructure positions calculated relative to user's heading (no external trackers required)  
* Distance-based volume falloff per infrastructure element  
* Directional panning (left/right/front/back) via binaural processing  
* Multi-layer spatial mixing (5 infrastructure types \+ district theme)

**Data Integration:**

* **Tram:** VBZ open data (366 feeders) \+ transport.opendata.ch API (real-time positions)  
* **Water:** WVZ Leitungskataster (distribution pipes, pumping stations)  
* **Sewage:** ERZ Abwasser-Werkleitungsdaten (collectors, treatment facilities)  
* **Electricity:** ewz Werkleitungsdaten (substations, transformers)  
* **Telecom:** ewz Telecom infrastructure (fiber nodes, data hubs)  
* GPS-based proximity detection determines which infrastructure elements are audible based on user location

**Delivery:**

* Progressive Web App (PWA) \- browser-based, platform-agnostic  
* Works offline after initial load  
* No app store approval required  
* Accessible on any device with a modern web browser (smartphones, tablets, laptops)  
* Optimized for mobile GPS and touch interfaces  
* Docker containerisation for reproducible builds and deployment to Google Cloud Platform

### **Project Timeline**

**Phase 0 (March 2026):**

* Pre-funding MVP: spatial audio \+ engine integration, GPS positioning, basic patches, demo video

**Phase 1 (Late March–Early April 2026):**

* Docker build environment and GCP hosting  
* Tram layer refined to production quality  
* Initial user testing

**Phase 2 (April 2026):**

* Water, sewage, electricity, and telecom layers added to prototype route  
* Extraction scripts, ProximityEngine updates, placeholder patches for each  
* Multi-layer integration and mixing

**Phase 3 (May 2026):**

* Geographic expansion to full District 1 (postal code 8001\)  
* GPS free-roam replaces fixed route  
* Production sound design across all layers

**Phase 4 (June–August 2026):**

* UI design, PWA deployment (Service Worker, offline caching, Web App Manifest)  
* User testing, documentation, public launch

### **Data Protection & Privacy**

The application is built on a privacy-by-design architecture that requires zero personal data collection, ensuring full compliance with Swiss Federal Act on Data Protection (FADP) and GDPR. GPS coordinates are processed entirely on-device:- your location never leaves your phone, never gets transmitted to servers, never gets logged or tracked. All distance calculations happen locally in your browser. There are no user accounts, no registration, no login, no email collection. Usage is completely anonymous, with no cookies beyond what's essential for PWA functionality.

There's no analytics, no usage tracking, no behavioral profiling, no third-party services, no data monetization. All spatial audio calculations happen client-side, and infrastructure data is pre-loaded with the PWA so there are no real-time server queries about your position. The open-source codebase allows public audit of these privacy claims, with clear in-app explanations of data usage and credited open data sources.

The project's score archive feature turns this privacy-first approach into an active artistic statement. The only data the app offers to share is the timestamped interaction between the listener and the procedural synthesis engine \- parameter and control data that can regenerate the audio of any walk, but cannot reconstruct the user's physical path. Two different routes through District 1 could produce similar parameter streams if they pass the same density of infrastructure, making scores non-invertible to physical locations. The archive contains music, not surveillance.

This approach aligns with Stadt Zürich's commitment to responsible digital innovation, ensuring the artwork is accessible without compromising user privacy:- you experience the city's hidden infrastructure without becoming data yourself.

### **Artistic Merit of Digital Technologies**

Digital technologies aren't merely supportive of this work:- they're constitutive of the artistic concept itself. Real-time tram data becomes compositional material, with vehicle movements functioning as a constantly evolving "score" that drives generative music. GPS positioning creates site-specificity, where the listener's physical location in space determines which sounds emerge and how they're positioned. Procedural synthesis ensures infinite variation:- no two walks ever produce the same sonic experience, even on the same route. And the Web Audio API democratizes spatial audio, delivering sophisticated binaural positioning through standard headphones without requiring specialized hardware.

These aren't technological flourishes added to a traditional artwork:- they're the fundamental building blocks that make the experience possible.

### **Existing Prototype (Demonstrable)**

**Current Development Status (functional MVP):**

* TramEngine: Live API integration with transport.opendata.ch  
* ProximityEngine: 71 substations, 366 feeders mapped  
* ListenerEngine: 2682m route simulation (Stadelhofen → Bürkliplatz)  
* AudioEngine: WebAssembly synthesis (dual patches operational)

**Test Pages:**

* Tram position visualization (live updates every 10 seconds)  
* Proximity calculations (real-time distance to infrastructure)  
* Listener simulation (automated walking at 5 km/h)  
* Dual audio synthesis (feeder events \+ substation drones)

**Documentation:**

* Project documentation (technical architecture, sound design narrative, browser APIs, deployment phases)  
* Route analysis and photography

**GitHub Repository:** https://github.com/Gombassa/invisible-infrastructures-zurich

### **Risk Mitigation**

**Technical Risks:**

* Prototype already functional (core technical challenges solved)  
* API dependencies: transport.opendata.ch is stable public service  
* Offline capability: PWA architecture ensures robustness

**Artistic Risks:**

* User testing planned (July-August) to refine sonic experience  
* Iterative development allows continuous refinement

**Timeline Risks:**

* Aggressive 6-month timeline from March to August  
* Core engines already complete (integration and sound design remaining)  
* Buffer built into testing phase (June-July) for unexpected issues

## **Budget Breakdown**

**Infrastructure & Hosting (CHF 1,200)**

* Hosting (Google Cloud Platform): Existing GCP account. Static assets served via Cloud Storage \+ Cloud CDN or Cloud Run container. Estimated CHF 5-10/month at expected traffic levels (\~CHF 100/year)  
* Domain \+ SSL certificates: CHF 100/year  
* CDN/asset hosting (Cloudflare): CHF 300/year  
* Backup storage: CHF 200/year  
* Development/testing environments: CHF 500

**Development Hardware (CHF 2,500)**

* Replacement laptop (current machine failing): CHF 2,500

**Artistic Development (CHF 6,500)**

* Infrastructure layer sound design (5 layers): CHF 4,000  
  * Tram electrical (already built): CHF 0  
  * Water supply sonification: CHF 1,000  
  * Sewage/wastewater sonification: CHF 1,000  
  * Electricity grid sonification: CHF 1,000  
  * Telecommunications/fiber sonification: CHF 1,000  
* District 1 musical theme composition: CHF 1,500  
  * Procedurally-generated electronic theme reflecting district character  
* Integration & spatial audio mixing: CHF 1,000

**Testing & Iteration (CHF 1,500)**

* User testing sessions (15 participants): CHF 900  
* Technical optimization across 5 layers: CHF 600

**Public Presentation (CHF 1,500)**

* Launch event (venue, promotion): CHF 800  
* Documentation (video, photography): CHF 400  
* Promotional materials (website, social media): CHF 300

**TOTAL: CHF 13,200**

## **Supporting Materials**

**To Be Included with Application:**

1. Video demonstration (1-2 minutes) showing:

   * Live tram position tracking  
   * Proximity calculations updating  
   * Listener simulation walking route  
   * Audio synthesis responding to data  
2. Project documentation (PDF)

   * Project plan  
   * Technical architecture  
   * Sound design methodology  
3. Artist CV (PDF)

4. Budget detail spreadsheet

## **Declaration**

I confirm that:

* I am a professional artist residing in Zurich  
* This project has not received prior Stadt Zürich funding for the same purpose  
* The budget is realistic and justified  
* I will use the Stadt Zürich Kultur logo on all promotional materials  
* I will provide a final report within 3 months of project completion  
* I understand rejected applications cannot be resubmitted unless substantially changed

**Place, Date:** Zurich, \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Name:** Robin Declan Pender

**Signature:** \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

## **References**

### **Data Sources**

**Stadt Zürich Open Data Portal**

* Main portal: [https://data.stadt-zuerich.ch](https://data.stadt-zuerich.ch/)  
* VBZ Tram Infrastructure: [https://data.stadt-zuerich.ch](https://data.stadt-zuerich.ch/) (search: "VBZ Werkleitungen")  
* WVZ Leitungskataster (Water): [https://www.stadt-zuerich.ch/geodaten/download/WVZ\_Leitungskataster](https://www.stadt-zuerich.ch/geodaten/download/WVZ_Leitungskataster)  
* ERZ Abwasser-Werkleitungsdaten (Sewage): [https://www.stadt-zuerich.ch/geodaten/download/ERZ\_Abwasser\_Werkleitungsdaten](https://www.stadt-zuerich.ch/geodaten/download/ERZ_Abwasser_Werkleitungsdaten)  
* ewz Werkleitungsdaten (Electricity & Telecom): [https://www.stadt-zuerich.ch/geodaten/download/EWZ\_Werkleitungsdaten\_Elektrizitaet\_und\_Telekommunikation](https://www.stadt-zuerich.ch/geodaten/download/EWZ_Werkleitungsdaten_Elektrizitaet_und_Telekommunikation)

**Real-Time Data**

* transport.opendata.ch API: [https://transport.opendata.ch](https://transport.opendata.ch/)  
* Open Data Zurich API Dokumentation [https://opendatazurich.github.io/](https://opendatazurich.github.io/)  
* OpenData.swiss: [https://opendata.swiss/en/organization/stadt-zurich](https://opendata.swiss/en/organization/stadt-zurich)

### **Artistic References**

**Christina Kubisch**

* Electrical Walks project: [http://www.christinakubisch.de/en/works/electrical\_walks](http://www.christinakubisch.de/en/works/electrical_walks) Electromagnetic induction headphones for detecting ambient electrical fields

**Janet Cardiff**

* Audio Walks: [https://cardiffmiller.com](https://cardiffmiller.com/) Site-specific narrative audio experiences

### **Technical Documentation**

**WebPd (Pure Data to WebAssembly compiler)**

* Project: [https://github.com/sebpiq/WebPd](https://github.com/sebpiq/WebPd)  
* Documentation: [https://sebpiq.github.io/WebPd/](https://sebpiq.github.io/WebPd/)

**Web Audio API**

* MDN Documentation: [https://developer.mozilla.org/en-US/docs/Web/API/Web\_Audio\_API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)  
* Three.js PositionalAudio: [https://threejs.org/docs/\#api/en/audio/PositionalAudio](https://threejs.org/docs/#api/en/audio/PositionalAudio)

**Progressive Web Apps**

* PWA Standards: [https://web.dev/progressive-web-apps/](https://web.dev/progressive-web-apps/)

### **Stadt Zürich Cultural Programs**

**Digitale Künste Förderung**

* [Digital Arts: Idea generation and concept development](https://www.stadt-zuerich.ch/de/stadtleben/kultur/kultur-foerdern/uebersicht-foerdermassnahmen/digitale-kuenste-ideenfindung-und-konzeptentwicklung.html)  
* [Digital Arts: Implementation and Presentation](https://www.stadt-zuerich.ch/de/stadtleben/kultur/kultur-foerdern/uebersicht-foerdermassnahmen/digitale-kuenste-umsetzung-und-praesentation.html)  
* Application Profile [https://www.stadt-zuerich.ch/appl/kulturgesuche/de-CH/cases](https://www.stadt-zuerich.ch/appl/kulturgesuche/de-CH/cases)


