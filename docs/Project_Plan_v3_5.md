# **Hidden Infrastructures: Zürich**

## **Project Plan — 6 Infrastructure Layers, District 1**

**Document version:** v3.5.1 — July 2026
**Changes from v3.5:** Resolved the Timeline Reality Check's open cut-list — accept a launch slip into October rather than compress scope to hit September. Confirmed control surfaces are built for all 23 instruments but authoring-only by default (not a scope cut), and granularity holds at 23 (not consolidated). Pre-launch testing scope (15 vs. a smaller pilot) remains the one lever still open if October slips further.
**Changes from v3.4:** Dropped Max/MSP + RNBO as the production audio path; browser-native Web Audio instruments (with paired HTML control surfaces) are now the sole production toolchain — see `docs/Technical_Architecture_v5.md` for the architecture and `docs/Implementation_Plan.md` for the build plan. Removed the CHF 619 Max/MSP + RNBO licence line from the budget. Rebased the phase calendar from the stale May/June–August plan to a realistic timeline starting 27 July 2026, and added a plain assessment of what fits before the September 2026 launch target and what doesn't. Updated Technical Stack and Risk Mitigation sections to reflect the toolchain change.

---

## **Executive Summary**

Hidden Infrastructures is a Progressive Web App that makes Zurich's hidden infrastructure audible through spatial audio as you walk through District 1. Six layers of urban systems are sonified in real-time using procedurally generated audio driven by actual municipal geodata. All audio is generated through real-time procedural synthesis; the application contains no samples or pre-rendered audio assets.

The app collects zero personal data. GPS coordinates are processed entirely on-device and never transmitted. There are no user accounts, no analytics, no tracking. In a landscape where data collection happens by default, this absence is a deliberate artistic statement, not just a technical decision. The project makes this visible by offering the only thing it *can* share: users may optionally record the "score" of their walk — the timestamped parameter and control data sent to the synthesis engine — and contribute it to a public archive. The archive contains music, not surveillance. Scores can be replayed through the same instruments to regenerate the audio of any walk, but they reveal nothing about where the person actually was.

**The Experience:**

* Walk anywhere in District 1 (postal code 8001, Altstadt)
* Hear 6 layers of urban infrastructure as spatial soundscapes:
  * Tram electrical (600V DC overhead wires, feeders, poles)
  * Water supply (pipes, pumps, flow)
  * Sewage (treatment, drainage, underground)
  * Electricity grid (transformers, distribution, voltage)
  * Telecommunications (fiber, cellular, data)
  * District heating / Fernwärme (thermal distribution network)
* Plus: District 1 musical theme (procedural electronic ambient) — deferred to a later phase, see below
* Real-time events: trams passing, water flowing, data transmitting
* Download a recording of your walk or share your score to a public archive
* Infrastructure becomes visceral and tangible

**Development Strategy:**

* **Phase 0 (March):** Data pipeline and audio synthesis proven. Web Audio API integration with stub engines complete. ✅
* **Phase 1 (Late March–Early April):** Real engine integration, GPS free-roam, Docker build environment, tram layer audio pipeline field-validated. ✅
* **Phase 2 (April):** Add 5 infrastructure types on prototype route (water, sewage, electricity, telecom, Fernwärme). Web Audio placeholder synthesis for all 6 layers, field-validated. ✅
* **Phase 3 (August 2026):** Rebuild all 6 layers' audio as self-contained browser-native instruments with HTML control surfaces, replacing the single `audio-layers.js` module. Resolve the interface contract. PWA groundwork.
* **Phase 4 (September–October 2026):** PWA completion, testing, launch. See "Timeline Reality Check" below — full scope does not fit inside September; launch is expected to land in October instead, by decision rather than by shrinking scope.

The project focuses on District 1 (postal code 8001), where all six infrastructure datasets are publicly accessible through Stadt Zürich's open data portal (VBZ, WVZ, ERZ, ewz, SIA405 LKMap). The tram network has already validated the technical workflow from raw geodata through to spatial audio. Much of the infrastructure is physically visible — overhead wires, manhole covers, transformer boxes — which anchors the sonic experience to things the listener can actually see. Real-time tram data adds a live, dynamic layer that changes with every walk. The district is compact enough to build and test within the project timeline, but the architecture is designed to expand to Districts 2-6 in future.

## **Current Development Status**

### **Core Engines**

Two JavaScript engine modules and an inline GPS listener form the core of the application. Together they create a real-time loop: the TramEngine tracks where trams are, the ProximityEngine determines which infrastructure is near the listener and which trams are near that infrastructure, and the GPS listener (inline in `index.html`) represents the user's live position.

**TramEngine.js** fetches real-time tram positions from transport.opendata.ch, interpolates movement between stop pairs, and updates every 10 seconds. Working and tested.

**ProximityEngine.js** calculates distances between the listener and all six infrastructure layers, and between trams and tram infrastructure. Nearest-point-on-segment distance for all LineString features, spatial culling, line-crossing/alongside detection, sewage junction clustering, Fernwärme bearing computation. Working and tested.

**GPS Listener** (inline in `index.html`) — `navigator.geolocation.watchPosition()` drives `realLat`/`realLng` directly.

### **Data Layer**

30 GeoShop tile orders (55297–55476) processed. All six infrastructure layers extracted and serving from `public/`. See `docs/phase2-data-layer.md` for the extraction pipeline and iteration log, and `docs/Technical_Architecture_v5.md` for the current per-layer feature counts and ProximityEngine radii — `phase2-data-layer.md`'s own feature-count table reflects an earlier 12-order snapshot and is stale against the current 30-order totals; flagged there rather than corrected, since that document's data content is otherwise out of scope for this revision.

**Real-time API:** transport.opendata.ch confirmed working.

### **Audio Synthesis Pipeline**

All six audio layers have been field-tested and confirmed working as Web Audio API procedural synthesis in `src/audio-layers.js`. This is no longer a placeholder awaiting a production toolchain — see the architecture decision below.

**Architecture decision (July 2026): Max/MSP + RNBO dropped.** Production sound design will not be authored in Max/MSP and exported via RNBO. Instead, each of the ~23 sonic behaviours across the six layers is being rebuilt as a self-contained Web Audio instrument module in JavaScript, each with a paired HTML control surface for hands-on sound design and MIDI-driven auditioning.

**Why now:** a CHF 9,000 Ideenfindung und Konzeptentwicklung funding application (ref 2026/KTR 24950) was refused in June 2026, making avoidance of non-essential spend a live constraint — see Budget below. But the deeper reason is that direct Web Audio synthesis was already this project's field-validated fallback in every prior risk-mitigation section; this pivot simply promotes the fallback to the primary path. Authoring and deployment now share one runtime, with no export step and no toolchain drift between what's designed and what ships. See `docs/Technical_Architecture_v5.md` for the full rationale, the instrument granularity decision, and the (currently open) interface-contract choice, and `docs/Implementation_Plan.md` for the build order.

The 19 Max for Live patches authored before this pivot are archived at `docs/archive/max/` (inventory + technical notes) and `max/` (per-layer specs + `circleoffifths.js`, which is plain JS and directly reusable). They remain the sonic specification the new instruments are built from — signal chains, envelope shapes, proximity mappings, and pool structures carry forward; the Max-specific object notes do not.

**Architectural decisions confirmed during Phase 1–2 (unchanged):**
- WebPd dropped: unreliable browser audio output on Windows/Chrome; Web Audio API direct synthesis is the validated development path
- Three.js dropped: not required for current synthesis architecture
- `ListenerEngine` simulation mode stripped; live GPS via `navigator.geolocation.watchPosition()` is the only listener tracking mode
- `pole-ping` sound layer dropped
- District ambient theme deferred to a later phase
- Vite used as the dev server; GeoJSON data files served via the `public/` directory
- Cloudflare Tunnel provides HTTPS on Android Chrome during field testing

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

Phase 1 shifts from proof-of-concept to a polished tram layer experience.

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
* Three.js — dropped entirely

---

### **Docker Architecture**

Docker provides a reproducible build and deployment environment. Node.js tooling and extraction scripts run inside the container regardless of host machine, so there is no configuration drift between development and production.

**Single Dockerfile, Multi-Stage Build:**

* **Stage 1 (build):** Node.js image. Runs Vite build and extraction scripts, producing the full set of static assets (HTML, JS, GeoJSON).
* **Stage 2 (serve):** Nginx image. Copies compiled assets from Stage 1, serves over HTTPS with COEP/COOP headers preserved in `nginx.conf`. This is what deploys to GCP.

**Development Workflow:**

* Edit source files in VS Code on the host machine
* Dev server via `npx vite --host`; Cloudflare Tunnel provides HTTPS for Android Chrome field testing (documented in `STARTUP.md`)
* Serve the Docker build locally for testing (`docker run -p 8080:80`)

**Production Deployment:**

* Push to `main` — Cloud Run redeploys automatically via `cloudbuild.yaml`

---

### **Phase 2: Infrastructure Expansion (April, Complete)**

Phase 2 added the remaining five infrastructure types (water, sewage, electricity, telecom, Fernwärme) as Web Audio placeholder synthesis, field-validated end to end. Detailed step-by-step history for this phase — including the audio synthesis specifics per layer and the multi-layer integration work — is preserved in `docs/archive/Project_Plan_v3_4.md` (§Phase 2) rather than repeated here, since it is now historical record rather than forward-looking plan.

**Milestone 2 (delivered):** End of April — all 6 infrastructure types working, line-event detection, shared density reverb. ✅

---

### **Phase 3: Instrument Architecture (August 2026)**

Phase 3 replaces the single `src/audio-layers.js` module with ~23 self-contained instrument modules (one per sonic behaviour) plus HTML control surfaces, per `docs/Technical_Architecture_v5.md` and `docs/Implementation_Plan.md`. This is the direct successor to what was previously planned as "Max/MSP patch authoring + RNBO export" — same sonic goals, different toolchain.

**Step 1: Interface Contract**

* [ ] Build one instrument under each (or a fast subset) of the three candidate contracts in `docs/Technical_Architecture_v5.md`
* [ ] Decide the contract before building the remaining ~22 instruments
* **Deliverable:** Chosen interface contract, validated against at least one pool-type instrument (not just a simple one-shot)

**Step 2: Instrument Build-out**

* [ ] Build remaining instruments grouped by layer, per the order and reasoning in `docs/Implementation_Plan.md`
* [ ] HTML control surface per instrument, authoring-only by default (see Timeline Reality Check and `docs/Implementation_Plan.md`, Decision Points item 2)
* [ ] Resolve pool-exhaustion behaviour (silent drop vs. nearest-wins swap) explicitly for each pool instrument
* [ ] Mapping-curve audit pass on all layers except tram crackle (already validated)
* **Deliverable:** All 6 layers running on the new instrument architecture, `audio-layers.js` retired

**Step 3: Reintegration**

* [ ] Wire instruments into the existing GPS/TramEngine/ProximityEngine data flow — no change to that flow is anticipated
* [ ] Field-validate the rebuilt layers against the current field-tested baseline (no regression)
* **Deliverable:** Feature parity with the current field-tested experience, on the new architecture

**Milestone 3:** All 6 layers rebuilt as instruments, interface contract resolved and applied consistently.

---

### **Phase 4: PWA, Testing & Launch (September–October 2026)**

**Week 1: Progressive Web App**

* [ ] Service Worker for offline capability
* [ ] Web App Manifest (installable)
* [ ] Cache geodata and instrument code on first load
* **Deliverable:** PWA works offline

**Week 2–3: User Testing**

* [ ] Recruit and schedule testers, walk District 1, collect structured feedback
* [ ] Fix critical bugs, refine mix based on real-world use
* **Deliverable:** Beta-tested experience — see Timeline Reality Check for participant-count trade-off

**Week 4: Documentation & Polish**

* [ ] User guide, technical documentation, demo video, press kit materials
* **Deliverable:** Launch-ready materials

**Week 5: Public Launch**

* [ ] Deploy to production URL, smoke-test (GPS, audio, PWA install, offline mode, cross-device)
* [ ] Announce on social media, local groups
* **Deliverable:** Public release

---

### **Timeline Reality Check**

Today is 27 July 2026. The public launch target was September 2026. Between now and launch sits the Stadt Zürich Digitale Künste — Umsetzung und Präsentation funding application, due 1 September (out of scope for this document, but it will consume real working days in the first third of Phase 3).

**Decision: accept a launch slip into October rather than cutting scope to force September.** At full scope — interface-contract decision, 23 instruments each with its own authoring-only HTML control surface, PWA work, a 15-person testing round, and documentation — this does not fit before the end of September for a solo developer. Rough accounting: 1 week for the interface-contract decision (now also covering the pool-exhaustion policy — see `docs/Implementation_Plan.md`), 4–5 weeks to build and control-surface 22 remaining instruments (with reduced velocity around the 1 September deadline), 1 week PWA, 2–3 weeks for testing (scheduling and running 15 walks takes real calendar time, not just working hours), 1 week documentation, plus launch week. That totals to roughly 10–12 weeks from today — landing in early-to-mid October.

This was weighed against cutting scope to hit September instead — reducing control-surface count, shrinking the pre-launch testing pool, or consolidating instrument granularity — and October was chosen over those cuts. Instrument granularity stays at 23 (see `docs/Implementation_Plan.md`, Decision Points) and control surfaces still get built for all 23 as an authoring tool (just not shipped to production by default, which removes production-hardening time from the estimate without removing the surfaces themselves). Pre-launch testing scope (15 vs. a smaller pilot) remains open and is the one lever still available if October slips further — see Phase 4, Week 2–3 below.

**Development continues regardless of funding outcome** — this was true before the pivot and remains true now; the toolchain narrowing described in this revision is not contingent on the pending application either.

This section will need revisiting once the interface-contract decision (Phase 3, Step 1) is made and its actual build time is known — the estimate above is necessarily approximate before that.

---

### **Walk Recording & Score Archive**

**Timeline:** Candidate for post-launch, unchanged from v3.4.

**Conceptual framing:** Data collection happens all the time by default. Every app on a user's phone is silently harvesting location data, usage patterns, and device fingerprints — this is so normalised that most people don't think about it. Hidden Infrastructures collects nothing: no GPS logs, no user accounts, no analytics, no tracking. By explicitly offering the option to record and share something — and making that something purely musical — the project draws attention to what it is *not* doing. The only data that can leave the device is the interaction between the listener and the synthesis engine. The archive feature turns the project's privacy-by-design principle from a passive technical decision into an active artistic statement.

**Local Audio Download**

Users can record the audio output of their walk and download it to their device via the MediaRecorder API connected to a MediaStreamDestination node. The recording happens entirely client-side and never touches a server.

**Score Archive (Web)**

Rather than storing audio, the archive captures the "score" of each walk — the timestamped stream of parameter and control data sent to the instruments during the experience. This includes proximity values, trigger events, layer mix levels, and synthesis parameter changes, all timestamped relative to walk start. No GPS coordinates, no compass headings, no device information — nothing that could reconstruct the user's physical path.

**Privacy compliance:** The score data is infrastructure-interaction data, not location data. Two different routes through District 1 could produce similar parameter streams if they pass the same density of infrastructure, making scores non-invertible to physical paths.

**Technical requirements:**

* MediaRecorder API + MediaStreamDestination node (local download)
* Parameter logging at the instrument interface boundary (score capture) — how this hooks in depends on which interface-contract option is chosen; see `docs/Technical_Architecture_v5.md`
* Simple server endpoint or static file store for score submission (archive)
* Score playback page that loads instruments and feeds them the archived parameter stream

---

## **Technical Stack**

### **Frontend**

* **HTML/CSS/JavaScript** — PWA foundation, and now the sole audio-instrument authoring environment
* **Vite** — dev server and build tooling
* **Web Audio API** — synthesis (production path, not a placeholder), spatial positioning (PannerNode HRTF, StereoPanner), distance attenuation, mixing
* **Geolocation API** — GPS position
* **DeviceOrientation API** — compass heading

### **Backend**

* **Google Cloud Platform** — existing GCP account, containerised deployment via Cloud Run
* **Cloud Firestore** — cache tram data (free tier) — not yet implemented
* **Cloud Functions** — API aggregation (free tier) — not yet implemented

### **Data Sources**

* **VBZ Infrastruktur OGD** — tram infrastructure geodata
* **transport.opendata.ch** — live tram positions
* **GeoShop (Stadt Zürich)** — DXF tile deliveries for all 6 infrastructure layers (30 orders processed)

### **Extraction Scripts**

* `scripts/extract-lk-geojson.js` — batch DXF extractor for all GeoShop layers; multi-tile deduplication, LV95→WGS84 via proj4, layer routing by regex
* `scripts/import-new-tiles.js` — automated tile ingestion: scans `data/raw/GeoShop` for new `order_*` dirs, diffs against `data/processed/.processed-orders.json`, runs extractor for new tiles, updates manifest
* `scripts/extract-route-waypoints.js` — route waypoint extraction from VBZ powerline geometry

### **Audio Production**

* **Web Audio API** — direct synthesis, authored and deployed in the same runtime (see `docs/Technical_Architecture_v5.md`, "Audio Instrument Architecture")
* **HTML control surfaces** — per-instrument (or per the reduced set), for hands-on sound design and MIDI-driven auditioning
* ~~Max/MSP~~ / ~~RNBO~~ — dropped July 2026; retained only as archived sonic specification at `max/` and `docs/archive/max/`

---

## **Critical Path**

**Phase 0 (March):** Web Audio API synthesis + engine stub integration, Mercator projection, haversine proximity calculations, feeder triggers. Data pipeline proven end to end. ✅

**Phase 1 (Late March – Early April):** Real engine integration, GPS, spatial audio via PannerNode, Docker build environment, GCP hosting, tram layer to production quality. ✅

**Phase 2 (April):** Geodata for all 6 layers extracted and filtered ✅. ProximityEngine integration complete ✅. Web Audio API synthesis for all 6 layers complete ✅. Line-crossing/alongside detection for all 5 LineString layers ✅. Shared density reverb bus ✅. 30 GeoShop tile orders processed ✅. Deployed to Cloud Run ✅.

**Phase 3 (August 2026):** Interface contract decided. ~23 instruments + HTML control surfaces built, replacing `audio-layers.js`. Feature parity with the current field-tested baseline confirmed.

**Phase 4 (September–October 2026):** PWA (Service Worker, offline caching, Web App Manifest), user testing, documentation, public launch. See Timeline Reality Check above — launch is expected in October, accepted rather than compressed to hit September.

Development continues regardless of funding outcome.

---

## **Risk Mitigation**

### **Technical Risks**

**GPS accuracy in urban canyons**

* **Mitigation:** ProximityEngine trigger radii are already wide enough (25–80m depending on layer type) to tolerate GPS drift of 10-30m typical in urban canyons. Compass heading from `DeviceOrientationEvent` may be distorted by steel buildings, but spatial audio panning tolerates several degrees of error without audible impact.
* **Fallback:** The experience degrades softly — wider GPS scatter means slightly less precise spatial positioning, but infrastructure sounds still respond to proximity. No hard failure mode.

**Battery drain**

* **Mitigation:** GPS updates via `watchPosition()` with `maximumAge` set to limit fix frequency. Spatial culling already reduces the Web Audio graph size to features within the culling radius.
* **Fallback:** Reduce culling radius, increase GPS interval, or suspend non-essential layers. Specific thresholds to be determined through real-device testing.

**Instrument architecture risk (replaces the retired "RNBO patch performance" risk)**

* **Challenge:** Rebuilding ~23 behaviours as self-contained instruments under a not-yet-chosen interface contract, within a tight timeline (see Timeline Reality Check), carries real risk of scope overrun or of a contract choice that doesn't hold up once most instruments are built.
* **Mitigation:** Phase 3 Step 1 deliberately builds one instrument under each candidate contract, including at least one pool-type instrument, before committing — the costliest mistake (choosing wrong, then discovering it 15 instruments in) is front-loaded into a single small phase.
* **Fallback:** If a chosen contract proves wrong partway through, the current `audio-layers.js` behaviour functions remain a working reference implementation throughout the rebuild — nothing is deleted until its replacement is field-validated, so there is no point at which the app has no working audio.

**Docker/deployment complexity**

* **Mitigation:** Single Dockerfile with multi-stage build, same image in dev and production. The app is ultimately static files (HTML, JS, GeoJSON), so Docker adds convenience but not dependency.
* **Fallback:** Deploy static files directly to a GCP Cloud Storage bucket behind a load balancer. No containerisation required.

### **Sound Design Risks**

**Sonic clarity with dense infrastructure**

* **Challenge:** Dense multi-layer zones (e.g. Bahnhofstrasse) risk sonic mud rather than legible layers.
* **Mitigation:** Frequency separation by design — each layer occupies a distinct part of the spectrum (sewage in the bass, electricity in the mids, telecom in the highs). Spatial separation reinforces this via Web Audio API PannerNode/StereoPanner. Per-layer mix controls give the user agency. User testing validates legibility.

**District theme composition**

* **Challenge:** Deferred to a later phase — not part of the current build. Noted here only to confirm it remains out of scope for Phase 3/4.

---

## **Success Criteria**

### **Technical**

* \[ \] PWA loads on iOS Safari and Android Chrome
* \[ \] GPS accuracy within 10m in District 1
* \[ \] Audio responds to compass heading within 100ms
* \[ \] No audio dropouts during 30-min walk
* \[ \] Works offline after initial cache
* \[ \] All 6 infrastructure layers render simultaneously
* \[ \] Interface contract holds across all pool-type and one-shot instruments without a redesign mid-build

### **Experiential**

* \[ \] Testing participants complete experience (count per Timeline Reality Check)
* \[ \] 70%+ would recommend to others
* \[ \] Users report "seeing infrastructure differently"
* \[ \] Clear sonic differentiation between 6 infrastructure types

### **Artistic**

* \[ \] Sonification is legible (users understand 6 layers)
* \[ \] Balances data fidelity with aesthetic beauty
* \[ \] Creates new perception of urban infrastructure
* \[ \] Celebrates (not critiques) hidden systems
* \[ \] Each infrastructure type has distinct sonic character

### **Launch**

* \[ \] 100+ completed journeys in first 3 months
* \[ \] 70%+ completion rate
* \[ \] Positive media coverage (1+ Zurich publication)
* \[ \] GitHub repo public with documentation

---

## **Budget**

**Total: CHF 12,200** (Stadt Zürich Digitale Künste application)

### **Infrastructure & Hosting (CHF 1,200)**

* Hosting (Google Cloud Platform): Existing GCP account. Estimated CHF 5-10/month at expected traffic levels (~CHF 100/year)
* Domain + SSL certificates: CHF 100/year
* CDN/asset hosting (Cloudflare): CHF 300/year
* Backup storage: CHF 200/year
* Development/testing environments: CHF 500

### **Development Hardware (CHF 2,500)**

* Replacement laptop (current machine failing): CHF 2,500

### **Artistic Development (CHF 5,500)**

* Infrastructure layer sound design (6 layers): CHF 4,000
  * Tram electrical (synthesis complete): CHF 0
  * Water supply sonification: CHF 1,000
  * Sewage/wastewater sonification: CHF 1,000
  * Electricity grid sonification: CHF 1,000
  * Telecommunications/fiber sonification: CHF 1,000
  * Fernwärme / district heating sonification (sparse network — included within budget envelope): CHF 0
* District 1 musical theme composition: CHF 1,500
  * Procedurally-generated electronic theme reflecting district character

### **Testing & Iteration (CHF 1,500)**

* User testing sessions: CHF 900
* Technical optimisation across 6 layers: CHF 600

### **Public Presentation (CHF 1,500)**

* Launch event (venue, promotion): CHF 1,000
* Documentation (video, photography): CHF 400
* Promotional materials (website, social media): CHF 300

**Post-launch annual costs:** ~CHF 500 (GCP hosting + domain)

**Note:** the Audio software licences line (Max/MSP CHF 354 + RNBO CHF 265 = CHF 619) present in v3.4's budget is removed entirely, not reallocated — the Artistic Development subtotal drops from CHF 6,119 to CHF 5,500 and the grand total from CHF 12,819 to CHF 12,200 accordingly. No other budget figures have been altered. Separately: `docs/archive/Technical_Architecture_v4.md`'s footer cited this application's total as CHF 13,200, which never matched this document's CHF 12,819 even before this revision — a pre-existing contradiction between the two documents, flagged here rather than resolved, since which figure is authoritative wasn't established in this task.

---

**Document Version:** 3.5.1
**Last Updated:** July 2026
**Next Review:** End of Phase 3, Step 1 (interface contract and pool-exhaustion policy decided) — the Timeline Reality Check above should be revisited then with an actual build-time data point.
