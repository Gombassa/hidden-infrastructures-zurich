# Invisible Infrastructures: Zurich Tram Power Network
## Master Project Document

**Version:** 3.0 - TRAM NETWORK FOCUS  
**Date:** January 31, 2026  
**Project Lead:** Robin  
**Timeline:** 6-9 months  
**Status:** Phase 0 Complete ✅ - Ready for Phase 1

---

## Elevator Pitch

"Listen to Zurich's electric pulse: an immersive audio walk that makes the city's tram power network audible, revealing the 600-volt DC grid flowing above your head."

**Secondary Vision:** "A mobile audio experience that sonifies Zurich's invisible data streams—transforming electrical infrastructure, network traffic, and urban systems into spatial soundscapes that reveal the hidden life of the city." *(Phase 2+ expansion)*

---

## Document Structure

This master document contains four integrated sections:

1. **Data Availability Research Plan** - Investigating accessible data sources in Zurich
2. **Revised Project Brief** - Focused MVP scope and vision
3. **Technical Specification** - Implementation details and architecture
4. **Project Charter** - Timeline, milestones, and deliverables

---

# SECTION 1: DATA AVAILABILITY RESEARCH PLAN

## ✅ PHASE 0 COMPLETE - MAJOR BREAKTHROUGH!

**Status:** Phase 0 research completed on January 31, 2026  
**Outcome:** SUCCESSFUL - Complete infrastructure data acquired  
**Breakthrough:** VBZ Tram Infrastructure Dataset discovered

### Key Achievements:

1. **✅ Complete Infrastructure Data Obtained**
   - VBZ Infrastruktur OGD dataset (43 layers)
   - 1,689 overhead power line segments in route area
   - 258 support poles with GPS coordinates
   - 366 power feeders (trace to substations)

2. **✅ Official, Maintained Sources**
   - Verkehrsbetriebe Zürich (VBZ) - public transport authority
   - Weekly updates confirmed
   - Survey-grade accuracy
   - Open Government Data license

3. **✅ Perfect Route Coverage**
   - 75% of Zurich's tram power lines in route area
   - Dense, continuous coverage (no gaps)
   - Visible infrastructure (users can see wires)
   - Real-time tram position data available via API

4. **✅ Web-Ready Formats**
   - All data exported as GeoJSON
   - Coordinate system: WGS84 (EPSG:4326)
   - Ready for Three.js spatial audio
   - Files: route-tram-powerlines.geojson, route-tram-masts.geojson, route-tram-feeders.geojson

### Strategic Pivot:

**Original Scope:** City-wide electrical grid (substations, underground cables)  
**MVP Scope:** Tram power network (overhead wires, visible infrastructure)

**Why This Is Better:**
- ✅ Complete data access (no waiting for EWZ partnership)
- ✅ Visible infrastructure (users see what they hear)
- ✅ Real-time consumption events (trams drawing power)
- ✅ Iconic Zurich feature (trams are beloved)
- ✅ 600V DC system is dramatic and interesting
- ✅ Perfect density for continuous audio
- ✅ Can expand to full grid in Phase 2

**Decision:** PROCEED TO PHASE 1 immediately!

---

## Overview (Original Research Plan - Retained for Reference)

Before committing to technical architecture or project scope, we must identify what electrical grid and urban data is actually accessible in Zurich. This section provides a structured research framework to investigate data sources systematically.

**Research Timeline:** 2-4 weeks *(Completed in 1 day!)*  
**Primary Goal:** Identify minimum viable dataset for MVP route (Stadelhofen → Bahnhofstrasse 45) *(✅ ACHIEVED)*

---

## 1.1 Primary Data Sources to Investigate

### ✅ A. VBZ Infrastruktur OGD (BREAKTHROUGH DISCOVERY)

**Organization:** Verkehrsbetriebe Zürich (Zurich Public Transport)  
**Website:** https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd  
**Status:** ✅ DOWNLOADED AND PROCESSED

**What We Found:**
- **43 infrastructure layers** covering tram network
- **Electrical infrastructure** (overhead wires, feeders, poles, cables)
- **Stop infrastructure** (shelters, ticket machines, displays)
- **Track infrastructure** (rails, switches, sensors)

**Electrical Layers (Critical for Project):**
- `fahrleitungen_fahrdraht` - Overhead contact wire (2,246 total / 1,689 in route)
- `fahrleitungen_feeder` - Power feeders (527 total / 366 in route)
- `fahrleitungen_mast` - Support poles (308 total / 258 in route)
- `fahrleitungen_kabel` - Cables (671 segments)
- `fahrleitungen_tragwerk_punkt` - Support structures (2,784 points)
- `haltestellen_elektroschrank` - Electrical cabinets (8 points)

**Data Quality:**
- Update frequency: Weekly
- Coordinate system: Swiss LV95 (EPSG:2056)
- Exported to: WGS84 (EPSG:4326) for web use
- Accuracy: Survey-grade
- License: Open Government Data

**Route Coverage:**
- Stadelhofen → Bahnhofstrasse perfectly covered
- 1,689 overhead wire segments
- 258 support poles (~6m spacing)
- 366 power feeders (trace to substations)

**Exported Files:**
- `route-tram-powerlines.geojson` (1,689 features)
- `route-tram-masts.geojson` (258 features)
- `route-tram-feeders.geojson` (366 features)

**Real-Time Data Potential:**
- VBZ provides real-time tram positions via API
- Combine tram location + wire location = consumption event
- Dynamic audio when trams pass overhead

**Why This Is Perfect:**
- ✅ Immediate access (downloaded)
- ✅ Complete coverage of route
- ✅ Visible infrastructure (users see wires)
- ✅ Official, maintained source
- ✅ Real-time events possible
- ✅ Iconic Zurich feature
- ✅ 600V DC system (dramatic!)

**Status:** PRIMARY DATA SOURCE for MVP ✅

---

### B. Elektrizitätswerk der Stadt Zürich (EWZ) *(Optional for Phase 2)*

**Organization:** Municipal electricity utility for Zurich  
**Website:** https://www.ewz.ch

**What to Look For:**
- Open data portal or API access
- Real-time consumption data (aggregated by district/neighborhood)
- Substation locations and specifications
- Grid topology maps
- Smart meter data (anonymized/aggregated)
- Historical consumption patterns

**Search Terms:**
- "EWZ Open Data"
- "EWZ API"
- "EWZ Smart Grid"
- "EWZ Transparenz" (transparency)
- "Stromverbrauch Zürich" (electricity consumption Zurich)

**Contact Points:**
- General inquiry: info@ewz.ch
- Media/PR department (for data access requests)
- Innovation/Smart Grid department

**Likelihood of Access:**
- Public consumption statistics: HIGH
- Real-time granular data: MEDIUM (may require partnership)
- Infrastructure locations: MEDIUM-HIGH (may be on OpenStreetMap)

**Fallback Options:**
- Request historical data only (easier to obtain)
- Aggregate city-wide data instead of district-level
- Partner with research institution for data access

---

### B. Stadt Zürich Open Data Portal

**Organization:** City of Zurich open data initiative  
**Website:** https://data.stadt-zuerich.ch

**What to Look For:**
- Energy consumption datasets
- Infrastructure location data
- Environmental sensor data
- Smart city initiatives
- Transportation data (for context)

**Search Terms:**
- "Energie" (energy)
- "Strom" (electricity)
- "Infrastruktur"
- "Netzwerk"
- "Verbrauch" (consumption)

**Expected Findings:**
- Static datasets (annual reports, surveys)
- Geographic infrastructure data
- Historical consumption patterns
- Possibly real-time environmental sensors

**Data Format:**
- Likely CSV, JSON, or GeoJSON
- May require processing/cleaning
- Check update frequency

**Action Items:**
□ Browse entire portal catalog
□ Download sample datasets
□ Check API availability
□ Note data licenses (CC0, CC-BY, etc.)
□ Identify contact person for questions

---

### C. Swissgrid

**Organization:** National grid operator  
**Website:** https://www.swissgrid.ch

**What to Look For:**
- Real-time grid frequency (50 Hz variations)
- National-level consumption data
- Grid stability metrics
- Cross-border power flows

**Search Terms:**
- "Swissgrid transparency"
- "Grid frequency data"
- "Real-time data Switzerland"

**Likelihood of Access:** HIGH (grid frequency is usually public)

**API Potential:**
- Check for documented API
- Look for data download sections
- Identify refresh rate (second? minute? hour?)

**How This Helps:**
- Provides "heartbeat" of entire Swiss grid
- Can be sonified as fundamental drone tone
- Real-time data without local partnerships

---

### D. OpenStreetMap (OSM)

**Source:** Community-mapped infrastructure  
**Website:** https://www.openstreetmap.org

**What to Extract:**
- Substation locations (power=substation)
- High-voltage lines (power=line, voltage=*)
- Transformer locations (power=transformer)
- Building outlines with addresses

**Tools:**
- Overpass Turbo (overpass-turbo.eu) - OSM query tool
- QGIS - Desktop GIS for analysis
- OSM API - Direct data download

**Research Tasks:**
□ Query Zurich area for power infrastructure
□ Assess completeness along MVP route
□ Identify gaps that need field verification
□ Export GeoJSON for route substations

**Sample Overpass Query:**
```
[out:json];
area[name="Zürich"]->.a;
(
  node["power"="substation"](area.a);
  way["power"="substation"](area.a);
  node["power"="transformer"](area.a);
);
out center;
```

**Action Items:**
□ Run query and visualize results
□ Walk MVP route and verify 2-3 substations
□ Photograph locations for reference
□ Contribute missing data back to OSM

---

### E. Federal Office of Energy (BFE / OFEN)

**Organization:** Swiss federal energy authority  
**Website:** https://www.bfe.admin.ch

**What to Look For:**
- National energy statistics
- Renewable energy data
- Policy documents (context)
- Energy strategy reports

**Likelihood:** Medium-level aggregated data, useful for context

---

### F. Zurich University of Applied Sciences (ZHAW)

**Organization:** Local university with energy research programs  
**Website:** https://www.zhaw.ch

**Potential Collaboration:**
- Energy systems research groups
- Smart city projects
- Student partnerships
- Access to restricted datasets through research collaboration

**Search Terms:**
- "ZHAW energy research"
- "ZHAW smart grid"
- "ZHAW urban informatics"

**Action Items:**
□ Identify relevant research groups
□ Check for public datasets from past projects
□ Consider reaching out for collaboration
□ Explore thesis/dissertation archives

---

## 1.2 Secondary/Contextual Data Sources

These enhance the experience but aren't critical for MVP:

### G. Real-Time Public Transit (ZVV API)
- **Purpose:** Correlate grid consumption with transit activity
- **Access:** Likely available via GTFS or API
- **Website:** https://www.zvv.ch

### H. Weather Data (MeteoSwiss)
- **Purpose:** Context for consumption patterns (heating/cooling)
- **Access:** Public API available
- **Website:** https://www.meteoschweiz.admin.ch

### I. Building Registry
- **Purpose:** Building types along route (residential vs. commercial)
- **Access:** May be available through Stadt Zürich portal

---

## 1.3 Research Methodology

### Week 1: Desktop Research
**Tasks:**
- [ ] Browse all primary data sources listed above
- [ ] Create spreadsheet of available datasets
- [ ] Download sample data files
- [ ] Test any available APIs
- [ ] Document data formats, update frequencies, licenses

**Deliverable:** Data Inventory Spreadsheet

### Week 2: Field Verification
**Tasks:**
- [ ] Walk MVP route (Stadelhofen → Bahnhofstrasse 45)
- [ ] Photograph infrastructure (substations, transformers, utility boxes)
- [ ] Note GPS coordinates
- [ ] Identify acoustic landmarks
- [ ] Map route in QGIS with OSM data overlay

**Deliverable:** Annotated route map with infrastructure locations

### Week 3: Contact & Inquiry
**Tasks:**
- [ ] Draft data access request email (template below)
- [ ] Contact EWZ innovation department
- [ ] Contact Stadt Zürich open data team
- [ ] Inquire about ZHAW collaborations
- [ ] Follow up on any API documentation

**Deliverable:** Contact log with responses

### Week 4: Analysis & Decision
**Tasks:**
- [ ] Compile findings into summary document
- [ ] Assess data availability: FULL / PARTIAL / INSUFFICIENT
- [ ] Identify gaps and propose solutions
- [ ] Make GO / NO-GO / PIVOT decision
- [ ] Update project scope based on findings

**Deliverable:** Data Availability Report (feeds into Section 2)

---

## 1.4 Email Template: Data Access Request

**Subject:** Request for Open Data Access - Artistic/Research Project on Urban Infrastructure

**Body:**

```
Guten Tag / Dear [Contact Name],

My name is Robin, and I am an audio engineer and sound designer based in 
Zurich, working on an artistic research project called "Invisible 
Infrastructures." The project aims to create an immersive audio experience 
that makes urban infrastructure—particularly electrical grids—audible and 
perceptible to the public through spatial sound design.

I am reaching out to inquire about the possibility of accessing electricity 
consumption and infrastructure data for the Zurich area, specifically for a 
walking route from Stadelhofen to Bahnhofstrasse.

Specifically, I am interested in:
- Substation locations and general specifications
- Aggregated/anonymized consumption data (neighborhood or district level)
- Real-time or near-real-time data feeds (if available)
- Grid topology information

The project is non-commercial and aims to increase public engagement with 
and understanding of urban infrastructure systems. All data would be used 
solely for artistic sonification and would comply with privacy and data 
protection regulations.

I would be happy to discuss the project in more detail and explore whether 
there might be opportunities for collaboration or data partnership.

Thank you for considering this request. I look forward to your response.

Best regards,
Robin
[Contact information]
[Project website/portfolio if available]
```

**German Version:**

```
Guten Tag [Contact Name],

Mein Name ist Robin, und ich bin Audio-Ingenieur und Sound-Designer in 
Zürich. Ich arbeite an einem künstlerischen Forschungsprojekt namens 
"Invisible Infrastructures", das städtische Infrastruktur—insbesondere 
Stromnetze—durch räumliches Sounddesign hörbar und erlebbar macht.

Ich möchte anfragen, ob es möglich wäre, Zugang zu Stromverbrauchs- und 
Infrastrukturdaten für den Raum Zürich zu erhalten, speziell für eine 
Gehroute von Stadelhofen zur Bahnhofstrasse.

Konkret interessiere ich mich für:
- Standorte von Umspannwerken und allgemeine Spezifikationen
- Aggregierte/anonymisierte Verbrauchsdaten (Quartier- oder Bezirksebene)
- Echtzeit- oder nahezu Echtzeit-Datenfeeds (falls verfügbar)
- Informationen zur Netztopologie

Das Projekt ist nicht-kommerziell und zielt darauf ab, das öffentliche 
Bewusstsein für städtische Infrastruktursysteme zu fördern. Alle Daten 
würden ausschliesslich für künstlerische Sonifikation verwendet und würden 
Datenschutzbestimmungen einhalten.

Ich würde mich freuen, das Projekt ausführlicher zu besprechen und mögliche 
Kooperationen zu erkunden.

Vielen Dank für Ihre Berücksichtigung. Ich freue mich auf Ihre Antwort.

Mit freundlichen Grüssen,
Robin
[Kontaktinformationen]
[Projekt-Website/Portfolio falls vorhanden]
```

---

## 1.5 Data Assessment Criteria

Once data sources are identified, evaluate each using this framework:

### Accessibility
- **Open:** Freely available, no registration required
- **Registration:** Requires API key or account
- **Partnership:** Requires formal agreement or collaboration
- **Restricted:** Not publicly available

### Format
- **Structured:** JSON, CSV, GeoJSON (easy to parse)
- **Semi-structured:** XML, KML (moderate difficulty)
- **Unstructured:** PDF, images (requires extraction)

### Update Frequency
- **Real-time:** Seconds/minutes (ideal for sonification)
- **Near-real-time:** Hours (acceptable)
- **Daily/Weekly:** Good for patterns, less dynamic
- **Static:** Historical only (fallback option)

### Spatial Resolution
- **Point-level:** Individual substations (best)
- **District-level:** Neighborhoods (good)
- **City-level:** Aggregate only (acceptable for MVP)

### Temporal Coverage
- **Current:** Live data available
- **Historical:** Past patterns available
- **Forecast:** Predictive models (bonus)

---

## 1.6 Minimum Viable Dataset (MVD)

For the MVP to proceed, we need AT MINIMUM:

**Critical (Must-Have):**
1. ✓ 3-5 substation locations along route (OSM + field verification)
2. ✓ City-wide or district-level consumption data (hourly or better)
3. ✓ Grid frequency data (Swissgrid - real-time)

**Important (Should-Have):**
4. Infrastructure specifications (voltage levels, capacity)
5. Historical consumption patterns (for realistic simulation)
6. Building-level context data (residential vs. commercial)

**Nice-to-Have:**
7. Real-time granular consumption data
8. Network topology details
9. Renewable energy contribution percentages

**Fallback Strategy:**
If real data is insufficient, we can:
- Use historical patterns to create realistic simulations
- Generate procedural data based on building types and time-of-day
- Focus on making infrastructure *locations* accurate while data is stylized
- Partner with university research group for sensor deployment

---

## 1.7 Research Deliverables Checklist

By end of Data Research Phase, you should have:

- [ ] **Data Inventory Spreadsheet:** All sources, formats, access levels
- [ ] **Route Map:** Annotated with infrastructure locations (GeoJSON)
- [ ] **Sample Datasets:** Downloaded and analyzed
- [ ] **API Documentation:** For any available real-time sources
- [ ] **Contact Log:** Organizations contacted and their responses
- [ ] **Photo Documentation:** Field verification of route infrastructure
- [ ] **Data Availability Report:** Summary of findings and recommendations
- [ ] **GO/NO-GO Decision:** Based on available data

**This section feeds directly into Section 2 (Revised Project Brief), allowing scope adjustments based on actual data availability.**

---

# SECTION 2: REVISED PROJECT BRIEF

## 2.1 Project Overview

### Title
**Invisible Infrastructures: Zurich Tram Power Network**

### Tagline
"Listen to the city's electric pulse"

### Elevator Pitch
"An immersive audio walk that makes Zurich's tram power network audible, revealing the 600-volt DC grid flowing above your head through spatial sound design."

### Phase 1 Scope (MVP) - TRAM NETWORK FOCUS

A Progressive Web App (PWA) that creates a 15-20 minute immersive audio walk along a specific Zurich route, sonifying the **tram electrical infrastructure** using complete, official VBZ data.

**Route:** Stadelhofen Bahnhof → Bahnhofstrasse 45  
**Distance:** ~1.5km  
**Duration:** 15-20 min walking  
**Infrastructure Type:** Tram power network (overhead wires, feeders, poles)  
**Platform:** Progressive Web App (mobile browser)  
**Target Launch:** 6-9 months from January 2026

**Key Infrastructure:**
- 1,689 overhead power line segments (visible to users!)
- 258 support poles (~6m spacing for rhythmic markers)
- 366 power feeders (trace to substations)
- Real-time tram positions (consumption events)

**Why Tram Network:**
- ✅ Complete official data (VBZ Infrastruktur OGD)
- ✅ Visible infrastructure (users see what they hear)
- ✅ 600V DC system (dramatic and interesting)
- ✅ Real-time consumption events (trams passing)
- ✅ Iconic Zurich feature (trams are beloved)
- ✅ Perfect density for continuous audio
- ✅ Expandable to full grid in Phase 2

---

## 2.2 Core Concept

### The Invisible Made Audible: Tram Power Network

Cities are sustained by complex infrastructures that remain largely imperceptible to inhabitants. Zurich's tram network runs on a **600-volt DC electrical system** flowing through overhead wires—visible yet unheard, constant yet unnoticed.

**Invisible Infrastructures** makes the tram power network *audible* through spatial audio synthesis, creating an experiential layer over the physical city. As users walk through Zurich, they hear:

- **The Overhead Wire Hum:** Continuous electrical drone positioned at actual wire locations above
- **Power Feeder Flow:** Directional whoosh of electricity flowing from substations to wires
- **Support Pole Pings:** Rhythmic chimes marking the geometric structure
- **Tram Consumption Events:** Power surges when trams draw electricity overhead
- **Network Pulse:** The living rhythm of urban mobility and energy

The result is a hybrid soundscape—part data sonification, part acoustic ecology, part urban composition—that invites participants to develop a new sensory relationship with the electrical infrastructure that powers their city.

### Why The Tram Network?

**Visible Infrastructure:**
- Users can SEE the overhead wires while hearing them
- Trams passing create synchronized audio/visual events
- Makes abstract electricity concrete and tangible

**Complete Data:**
- 1,689 wire segments with exact GPS coordinates
- 258 support poles (~6 meters apart)
- 366 power feeders showing energy flow
- Official VBZ data, updated weekly

**Dynamic & Real-Time:**
- Tram positions available via live API
- Consumption events when trams pass
- Creates narrative: "that tram just drew power from *that* wire"

**Iconic Zurich:**
- Trams are beloved urban feature
- 600V DC system is dramatic
- Geometric beauty of overhead wire network
- Connects mobility, energy, and urban design

---

## 2.3 Artistic & Conceptual Goals

### Primary Intentions

1. **Perceptual Expansion**  
   Enable hearing of typically inaudible processes; develop sensory intimacy with infrastructure

2. **Critical Awareness**  
   Reveal dependencies, energy flows, and systemic patterns; encourage reflection on consumption

3. **Beauty in Function**  
   Find inherent musicality in operational systems; celebrate engineering elegance

4. **Psychogeography**  
   Transform urban walking into an act of deep listening and attentive observation

5. **Public Engagement**  
   Make infrastructure legible and engaging to non-experts; democratize technical knowledge

### Aesthetic Principles

- **Fidelity to Data:** Sounds derive from actual measurements, not arbitrary mappings
- **Spatial Accuracy:** Audio positioned at real infrastructure locations using GPS/compass
- **Temporal Coherence:** Real-time or historically accurate data patterns
- **Sonic Clarity:** Complex data rendered as legible, beautiful sound
- **Contextual Sensitivity:** Experience adapts to time of day, weather, user pace

---

## 2.4 User Experience Design

### The Journey: Stadelhofen → Bahnhofstrasse 45

**Act 1: Awakening (Stadelhofen, 0-5 min)**

User arrives at Stadelhofen station—a major tram hub where multiple overhead wire systems converge.

**Experience:**
- App intro screen: "Look up. The wires above carry 600 volts. Now listen."
- Initial soundscape: dense hum of converging overhead lines
- Multiple tram lines create polyrhythmic audio events
- User looks up, sees wires, hears them for first time
- Power feeders trace back toward nearby substation (deep drone)
- User begins walking toward Bellevue

**Audio Character:**
- Dense, layered wire hum (multiple tram lines)
- Rhythmic pole pings (close spacing at station)
- Frequent tram events (high traffic area)
- Directional feeder flows converging

**Visual Correlation:**
- User sees overhead wires above
- Trams passing = visible consumption
- Support poles every 6 meters
- *"I never noticed all these wires before!"*

---

**Act 2: The Corridor (Bellevue, 5-10 min)**

User walks through commercial district along continuous wire path.

**Experience:**
- Overhead wire forms continuous sonic corridor
- Support poles create rhythmic structure (chime every 6m)
- Trams pass at ~2-3 minute intervals
- Power feeders branch off to parallel streets
- Lake breeze might affect wire height/tension (subtle audio shift)

**Audio Character:**
- Steady wire hum (single continuous line)
- Regular pole rhythm (walking tempo)
- Periodic tram events (power surges)
- Occasional feeder branches (spatial divergence)

**Visual Correlation:**
- Consistent overhead wire visible
- Geometric beauty of support structure
- Trams as moving audio events
- *"The whole system is visible, I just never listened"*

---

**Act 3: Convergence (Paradeplatz, 10-15 min)**

User reaches Zurich's financial center where multiple tram lines intersect.

**Experience:**
- Maximum wire density (4+ lines converging)
- Polyphonic wire hum (different frequencies per line)
- Frequent tram events (busy intersection)
- Power feeders from multiple directions
- Climactic audio moment: all systems audible simultaneously

**Audio Character:**
- Complex, harmonic wire chorus
- Overlapping tram events
- Dense pole rhythm (multiple lines)
- Directional feeder flows from all sides

**Visual Correlation:**
- Overhead wire spaghetti (spectacular!)
- Trams crossing from all directions
- Historic Paradeplatz + modern infrastructure contrast
- *"This is the electric heart of the city"*

---

**Act 4: Resolution (Bahnhofstrasse 45, 15-20 min)**

User completes walk at destination, reflecting on the experience.

**Experience:**
- Gradual simplification (fewer tram lines)
- Bahnhofstrasse's pedestrian shopping street (still electrified)
- Final tram event as conclusion
- Journey summary displayed
- Option to save audio recording / share experience

**Audio Character:**
- Return to simpler wire hum
- Spaced pole rhythm
- Final tram passage as denouement
- Gentle fade or composed ending

**Visual Correlation:**
- Bahnhofstrasse: pedestrian + trams only
- Wires more noticeable without car traffic
- Clean geometric lines overhead
- *"I'll never walk under tram wires the same way again"*


---

### Interaction Design

**Primary Mode:** Passive listening while walking (phone in pocket)  

**Secondary Interactions:**
- Look up: See wires while hearing them
- Tap pole markers: Get infrastructure details (voltage, installation date)
- Adjust audio layers: Wire hum / feeders / poles / trams (mix control)
- Tram tracker: See approaching trams on map
- Save journey: Export generated audio composition

**UI Principles:**
- Minimal on-screen elements (focus on audio + looking up)
- Audio-first design (works with phone in pocket)
- Visual prompts: "Look up now" when significant wire convergence
- Glanceable info: Wire voltage, current tram count

**Accessibility:**
- Audio descriptions for visual elements
- Haptic feedback option (vibrate at poles)
- High-contrast visual mode

---

## 2.5 Sonification Strategy

### Tram Power Network → Sound Mapping

#### Audio Layer 1: Overhead Wire Hum

**Data Source:** `fahrleitungen_fahrdraht` (1,689 line segments)  
**Physical Reality:** 600V DC flowing through copper wire  

**Sonic Element:** Continuous electrical drone  
**Mapping:**
- **Base frequency:** 600 Hz (represents 600V symbolically)
- **Harmonic richness:** Varies with wire height (hoehewarm/hoehekalt)
  - Cold height (winter, tight wire) = fewer harmonics, brighter
  - Warm height (summer, sagging wire) = more harmonics, warmer
- **Amplitude:** Distance-based (inverse square law)
- **Spatial position:** Exact wire geometry (3D positioned overhead)

**Synthesis Technique:** WebPd oscillator bank with dynamic harmonics  
**Character:** Persistent, hypnotic, ever-present hum

---

#### Audio Layer 2: Power Feeder Flow

**Data Source:** `fahrleitungen_feeder` (366 line segments)  
**Physical Reality:** Power flowing from substations to overhead wires

**Sonic Element:** Directional whoosh/flow sound  
**Mapping:**
- **Direction:** From substation toward overhead wire (follow line geometry)
- **Intensity:** Modeled load (varies by time of day, tram density)
- **Texture:** Granular synthesis suggesting electron flow
- **Spatial movement:** Sound travels along feeder path

**Synthesis Technique:** Granular synthesis + doppler shift  
**Character:** Directional, flowing, suggests movement of energy

---

#### Audio Layer 3: Support Pole Pings

**Data Source:** `fahrleitungen_mast` (258 points)  
**Physical Reality:** Metal poles supporting overhead wire system

**Sonic Element:** Brief metallic ping/chime  
**Mapping:**
- **Trigger:** Proximity (activated when within 10m)
- **Pitch:** Varies with pole height (`hoehemasto` attribute)
  - Taller poles = lower pitch
  - Shorter poles = higher pitch
- **Timbre:** Pole type (`masttyp` attribute)
  - Steel = bright, ringing
  - Concrete = dull, thud
- **Rhythm:** Natural spacing (~6m apart) creates walking tempo

**Synthesis Technique:** FM synthesis bell tones  
**Character:** Rhythmic, geometric, marks the structure

---

#### Audio Layer 4: Tram Consumption Events (Real-Time)

**Data Source:** VBZ Real-Time Tram Position API + wire locations  
**Physical Reality:** Tram pantograph drawing power from overhead wire

**Sonic Element:** Power surge / electrical crackle  
**Mapping:**
- **Trigger:** When tram position intersects with wire segment
- **Intensity:** Tram speed (faster = sharper attack)
- **Duration:** Length of tram (~30m = ~0.5 sec at walking speed)
- **Spatial position:** Follows tram along wire path
- **Doppler effect:** As tram approaches and passes

**Synthesis Technique:** Noise bursts + pitch envelope + spatial panning  
**Character:** Dynamic, event-driven, creates narrative moments

---

#### Audio Layer 5: Substation Drone (Optional)

**Data Source:** Trace feeder endpoints (infer substation locations)  
**Physical Reality:** Transformer stations converting AC to 600V DC

**Sonic Element:** Deep, fundamental bass drone  
**Mapping:**
- **Frequency:** 50 Hz (Swiss grid fundamental)
- **Amplitude:** Distance-based (audible from 100m+)
- **Modulation:** Low-frequency rumble (transformer vibration)
- **Directionality:** Strongest at substation location

**Synthesis Technique:** Low-pass filtered sawtooth oscillator  
**Character:** Grounding, foundational, anchors the system

---

### Synthesis Approach Summary

**Pure Data Patches (WebPd):**

1. **wire-drone.pd**
   - Oscillator bank (600 Hz + harmonics)
   - Height modulation input
   - Distance attenuation
   - Continuous, always active

2. **feeder-flow.pd**
   - Granular synthesizer
   - Directional panning
   - Intensity control (time of day)
   - Activates when feeders nearby

3. **pole-ping.pd**
   - FM bell synthesizer
   - Pitch input (pole height)
   - Timbre select (pole type)
   - Triggered by proximity

4. **tram-surge.pd**
   - Noise generator + envelope
   - Doppler effect processor
   - Speed modulation
   - Triggered by tram API

5. **substation-drone.pd** *(optional)*
   - 50 Hz oscillator
   - Low-pass filter
   - Distance-based amplitude
   - Optional layer for depth

**Spatial Audio (Three.js):**
- All audio sources positioned in 3D space
- User = listener (camera)
- GPS → 3D coordinates conversion
- Compass → listener orientation
- Distance-based attenuation
- Overhead positioning for wires (Y-axis elevation)

---

### Audio Mixing Strategy

**Default Mix:**
- Wire hum: 70% (dominant, persistent)
- Feeders: 40% (mid-level, directional context)
- Poles: 60% (clear, rhythmic markers)
- Trams: 100% (foreground events, full impact)
- Substation: 30% (subtle, grounding bass)

**User Adjustable:**
- Individual layer volume controls
- "Minimal" mode (trams + poles only)
- "Full" mode (all layers)
- "Ambient" mode (wires + feeders only)

---

## 2.5 Technical Approach (Overview)

*Full details in Section 3: Technical Specification*

### Architecture Summary

**Frontend:**
- Progressive Web App (HTML/CSS/JavaScript)
- Three.js for 3D spatial audio positioning
- Tone.js for procedural synthesis
- Web Audio API for spatialization
- Geolocation API + DeviceOrientation for positioning

**Backend:**
- Firebase (hosting, database, functions)
- Data processing and caching
- API aggregation layer

**Audio Engine:**
- WebPd (Pure Data patches compiled to JavaScript)
- Procedural synthesis based on data parameters
- Hybrid approach: synthesis + processed field recordings

### Data Flow

1. User opens PWA on mobile device
2. App requests location permission
3. **Loads VBZ infrastructure GeoJSON** (wires, poles, feeders)
4. Audio engine initializes Pure Data patches (5 layers)
5. **Fetches real-time tram positions** (VBZ API)
6. GPS position updates trigger spatial audio rendering
7. Compass heading adjusts binaural positioning
8. **Tram proximity triggers consumption events**
9. Data changes modulate synthesis parameters in real-time

---

## 2.6 Data Sources (Confirmed)

### Primary: VBZ Infrastruktur OGD ✅

**Source:** https://data.stadt-zuerich.ch/dataset/geo_vbz_infrastruktur_ogd  
**Status:** Downloaded and processed  
**Format:** GeoJSON (WGS84)

**Datasets:**
1. **route-tram-powerlines.geojson** (1,689 features)
   - Overhead contact wire segments
   - Height data (warm/cold)
   - Installation dates
   
2. **route-tram-masts.geojson** (258 features)
   - Support pole locations
   - Pole type and height
   - GPS coordinates
   
3. **route-tram-feeders.geojson** (366 features)
   - Power feeder lines
   - Connections to substations
   - Installation dates

### Secondary: VBZ Real-Time API (To Research)

**Purpose:** Live tram positions for consumption events  
**Status:** To be investigated in Week 3  
**Expected:** GTFS real-time or custom VBZ API

### Contextual: Building Data ✅

**Source:** Amtliche Vermessungsdaten 2024  
**File:** route-buildings.geojson (1,873 features)  
**Use:** Base map layer, urban context

---

## 2.7 Success Criteria (MVP)

### Technical Success

- [ ] PWA loads and runs on iOS and Android mobile browsers
- [ ] GPS positioning accurate within 5-10 meters
- [ ] Audio spatialization responds correctly to device orientation
- [ ] **1,689 wire segments spatially positioned correctly**
- [ ] **258 pole triggers activate at correct locations**
- [ ] **Real-time tram position data integrated**
- [ ] Synthesis engine runs without audio dropouts
- [ ] App handles poor network conditions gracefully
- [ ] **Overhead wire audio correlates with visible infrastructure**

### Experiential Success

- [ ] 10+ beta testers complete the route
- [ ] **Users report "seeing" the wires differently (new awareness)**
- [ ] **"Aha moment": users look up and notice wire network**
- [ ] **Tram passage creates synchronized audio/visual event**
- [ ] Audio experience feels coherent and intentional (not random)
- [ ] Journey has clear beginning, middle, end
- [ ] At least 70% of users would recommend to others
- [ ] **Post-walk reflection: "I'll never ignore tram wires again"**

### Artistic Success

- [ ] Sonification is legible (users understand what they're hearing)
- [ ] **Visible infrastructure makes audio meaningful**
- [ ] Experience balances data fidelity with aesthetic beauty
- [ ] Creates new perception of urban space
- [ ] **600V DC system becomes visceral and tangible**
- [ ] **Trams as rhythmic punctuation in urban soundscape**
- [ ] Documented with high-quality field recordings + photos
- [ ] **Users understand relationship: electricity → wire → tram → mobility**

- [ ] Sonification is legible (users understand what they're hearing)
- [ ] Experience balances data fidelity with aesthetic beauty
- [ ] Creates new perception of urban space
- [ ] Documented with high-quality field recordings + photos

---

## 2.8 Future Phases (Post-MVP)

### Phase 2: Full Electrical Grid (3-6 months)
**After tram network proven:**
- Add city-wide electrical substations (if EWZ partnership secured)
- Layer underground distribution cables
- Integrate building-level consumption data
- Show relationship: substation → feeders → wires → trams → buildings
- Maintain tram network as visible anchor layer

### Phase 3: Additional Tram Routes
- Expand to multiple tram lines across Zurich
- Different route experiences (central vs. suburban)
- User-generated walks
- Compare electrical signatures of different routes
- Track network as complete system

### Phase 4: Other Infrastructure Types
- Water systems (parallel to tram tracks)
- Telecommunications (fiber along tram routes)
- Integrated urban systems view
- Layered, toggleable experiences
- Tram as entry point to broader infrastructure

### Phase 5: Multi-City Tram Networks
- Basel tram system
- Geneva tram system
- Bern tram system
- Compare different electrical architectures
- Swiss-wide tram infrastructure portrait

### Phase 6: Community & Education
- VBZ partnership (educational tool)
- School programs (how trams work)
- Public installations at tram stops
- Integration with VBZ apps
- Infrastructure literacy tool

---

## 2.9 Broader Vision (Context)

### Original Vision: Multi-Infrastructure Sonification

The original "Invisible Infrastructures" concept envisioned sonifying ALL urban systems:
- Electrical grids (all scales)
- Water systems (supply + wastewater)
- Telecommunications (cellular, fiber, WiFi)
- Transportation (all modes)
- Economic flows (transactions, deliveries)
- Environmental sensors (air quality, noise, EMF)

### Strategic Pivot: Tram Network First

**Why start with tram network:**
- ✅ Complete data available immediately
- ✅ Visible infrastructure (users can see it)
- ✅ Single, coherent system (600V DC)
- ✅ Real-time events (trams as consumption)
- ✅ Beloved Zurich icon (cultural resonance)
- ✅ Proves concept for broader vision

**The tram network IS infrastructure sonification**—just the most accessible, visible, dramatic part. It's not a compromise; it's a strategic entry point.

### Path to Full Vision

**Tram MVP (Phase 1)** proves:
1. Spatial audio with GPS works
2. Users engage with infrastructure sonification
3. Visible infrastructure creates "aha moments"
4. Real-time data creates compelling events
5. Technical architecture is sound

**Success enables:**
- EWZ partnership (impressed by tram version)
- Funding for expansion (proven concept)
- User base for broader features
- Media attention for fuller vision
- Platform for all infrastructure types

**The tram network is the foundation, not the limitation.**

---

# SECTION 3: TECHNICAL SPECIFICATION

## 3.1 Technology Stack

### Development Environment

**Code Editor:** VS Code (local)  
**AI Assistant:** Claude Code (integrated)  
**Version Control:** Git + GitHub  
**Project Management:** GitHub Projects or Notion

### Frontend Technologies

**Core:**
- HTML5 (semantic, accessible markup)
- CSS3 (responsive design, mobile-first)
- JavaScript (ES6+, modular)

**Libraries:**
- **Three.js** (r155+) - 3D graphics and spatial audio positioning
- **Tone.js** (14.8+) - Audio synthesis framework
- **WebPd** - Pure Data patches compiled to JavaScript
- **Leaflet** or **Mapbox GL JS** - Map display (optional for UI)

**Audio:**
- Web Audio API (native browser support)
- WebPd for procedural synthesis
- Binaural panning using HRTF (Head-Related Transfer Function)

**Device APIs:**
- Geolocation API - GPS positioning
- DeviceOrientation API - Compass/gyroscope
- Service Workers - Offline capability (PWA)

### Backend Technologies

**Platform:** Firebase (Google)

**Services:**
- **Firebase Hosting** - PWA deployment
- **Cloud Firestore** - NoSQL database for caching grid data
- **Cloud Functions** - Serverless data processing
- **Firebase Authentication** (optional for Phase 2+)

**Alternative (if needed):**
- Google Cloud Platform directly
- Netlify/Vercel for hosting
- Supabase for database

### Audio Production Tools

**Synthesis Design:**
- Pure Data (Pd-vanilla or Purr Data) - Desktop patch development
- WebPd compiler - Convert patches to JavaScript

**Field Recording:**
- Portable recorder (Sound Devices, Zoom, or phone)
- Editing in Reaper or Audacity

**Processing:**
- FFmpeg for audio file conversion
- Spatial audio testing in browser dev tools

---

## 3.2 System Architecture

### High-Level Overview

```
User Device (Mobile Browser)
    ↓
Progressive Web App
    ↓
┌─────────────────────────────────────────┐
│  Frontend (Client-Side)                 │
│  - UI Layer (HTML/CSS/JS)               │
│  - 3D Audio Engine (Three.js + Tone.js) │
│  - WebPd Synthesis Patches              │
│  - Geolocation Handler                  │
│  - Data Visualization (optional)        │
└─────────────────────────────────────────┘
    ↓                           ↓
[Device Sensors]        [Network Requests]
- GPS                          ↓
- Compass              ┌───────────────────┐
- Accelerometer        │  Backend (Cloud)  │
                       │  - Firebase        │
                       │  - Cloud Functions │
                       │  - Firestore DB    │
                       └───────────────────┘
                                ↓
                       ┌───────────────────┐
                       │  External APIs    │
                       │  - EWZ Data       │
                       │  - Swissgrid      │
                       │  - Stadt ZH       │
                       └───────────────────┘
```

### Data Flow

1. **Initialization:**
   - User opens PWA URL in mobile browser
   - Service worker caches app assets (offline capability)
   - App requests location permissions
   - Loads route data (substation locations, metadata)

2. **Real-Time Operation:**
   - GPS updates every 1-5 seconds
   - App calculates user position relative to infrastructure points
   - Backend fetches latest grid data (or serves cached)
   - Audio engine receives data parameters
   - WebPd patches generate/modulate audio
   - Web Audio API spatializes sound based on GPS + compass
   - User hears positioned audio through headphones

3. **Data Updates:**
   - Grid frequency: Updated every 1-5 minutes (Swissgrid)
   - Consumption data: Updated every 15-60 minutes (if available)
   - Infrastructure locations: Static (updated manually when verified)

---

## 3.3 Frontend Architecture

### File Structure

```
/invisible-infrastructures-zurich/
├── index.html                 # Main app entry point
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker (offline)
├── /css/
│   ├── main.css               # Core styles
│   └── responsive.css         # Mobile-specific
├── /js/
│   ├── app.js                 # Main application logic
│   ├── audio-engine.js        # Audio synthesis controller
│   ├── geolocation.js         # GPS and positioning
│   ├── data-handler.js        # API calls and data processing
│   ├── ui.js                  # User interface interactions
│   └── /lib/                  # Third-party libraries
│       ├── three.min.js
│       ├── tone.min.js
│       └── webpd.min.js
├── /audio/
│   ├── /pd-patches/           # Pure Data source files
│   │   ├── grid-drone.pd
│   │   ├── consumption-pulse.pd
│   │   └── flow-generator.pd
│   └── /samples/              # Field recordings (if used)
├── /data/
│   ├── route.geojson          # MVP route geometry
│   ├── substations.geojson    # Infrastructure locations
│   └── config.json            # App configuration
└── /assets/
    ├── /images/               # Icons, UI graphics
    └── /fonts/                # Web fonts (if needed)
```

### Core Modules

#### 1. app.js (Main Controller)

**Responsibilities:**
- Initialize all modules
- Coordinate between geolocation, audio, and UI
- Handle app lifecycle (start, pause, resume)
- Error handling and logging

**Key Functions:**
```javascript
init()              // Initialize app on load
startExperience()   // Begin audio walk
pauseExperience()   // Pause audio (phone call, etc.)
resumeExperience()  // Resume from pause
endExperience()     // Complete journey, show summary
```

#### 2. audio-engine.js (Audio Synthesis)

**Responsibilities:**
- Initialize Tone.js and WebPd
- Load Pure Data patches
- Map data to synthesis parameters
- Handle spatial audio positioning
- Manage audio context state

**Key Functions:**
```javascript
initAudioEngine()           // Set up audio context
loadPdPatches()             // Load compiled WebPd patches
updateSynthParameters(data) // Map data to audio params
setListenerPosition(gps)    // Update spatial audio listener
addAudioSource(location)    // Create positioned audio source
```

**WebPd Integration:**
```javascript
// Example: Loading and controlling a PD patch
const gridDrone = Pd.loadPatch(pdPatchString);
gridDrone.start();
gridDrone.send('frequency', [50.1]); // Send freq data to patch
gridDrone.send('harmonics', [8]);    // Control harmonic richness
```

#### 3. geolocation.js (Positioning)

**Responsibilities:**
- Request and manage GPS permissions
- Track user position with appropriate accuracy
- Calculate distance to infrastructure points
- Handle compass heading for spatial audio
- Fallback for poor GPS conditions

**Key Functions:**
```javascript
requestPermissions()         // Ask for location access
startTracking()              // Begin GPS updates
getCurrentPosition()         // Get single position reading
calculateDistance(lat1, lon1, lat2, lon2) // Haversine formula
getCompassHeading()          // DeviceOrientation API
```

**GPS Configuration:**
```javascript
const geoOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};
navigator.geolocation.watchPosition(
  successCallback,
  errorCallback,
  geoOptions
);
```

#### 4. data-handler.js (API & Data)

**Responsibilities:**
- Fetch grid data from backend/APIs
- Cache data locally (IndexedDB or localStorage)
- Handle offline scenarios
- Parse and normalize data formats
- Rate limit API calls

**Key Functions:**
```javascript
fetchGridData(location)      // Get consumption data for area
fetchGridFrequency()         // Get real-time 50Hz data
cacheData(key, value)        // Store locally
getCachedData(key)           // Retrieve from cache
interpolateData(time)        // Fill gaps in temporal data
```

**Example API Call:**
```javascript
async function fetchGridFrequency() {
  try {
    const response = await fetch(
      'https://api.swissgrid.ch/frequency',
      { cache: 'no-store' }
    );
    const data = await response.json();
    return data.frequency; // e.g., 50.02 Hz
  } catch (error) {
    console.error('Grid frequency fetch failed:', error);
    return 50.0; // Fallback to nominal
  }
}
```

#### 5. ui.js (User Interface)

**Responsibilities:**
- Render UI elements
- Handle user interactions (tap, swipe)
- Display journey progress
- Show data visualizations (optional)
- Accessibility considerations

**Key Functions:**
```javascript
showIntro()                  // Onboarding screen
updateProgressBar(percent)   // Journey completion
displaySubstationInfo(id)    // Tap to see details
showSummary(journeyData)     // End of walk summary
```

---

## 3.4 Audio Synthesis Architecture

### Pure Data Patch Design

We'll create 3 primary PD patches, each handling a specific sonic layer:

#### Patch 1: grid-drone.pd

**Purpose:** Low-frequency fundamental tone representing grid frequency

**Inputs:**
- `frequency` (float): 49.9 - 50.1 Hz (grid freq variations)
- `amplitude` (float): 0.0 - 1.0 (volume level)
- `harmonics` (int): 0 - 12 (harmonic richness based on consumption)

**Synthesis:**
- Oscillator bank at fundamental + harmonics
- Subtle LFO for "breathing" quality
- Low-pass filter to keep it sub/low-frequency

**Output:** Mono audio (spatially positioned by Three.js)

**PD Objects Used:**
- `[osc~]` - Sine oscillators
- `[*~]` - Amplitude control
- `[hip~ 20]` - High-pass at 20Hz (remove DC offset)
- `[dac~]` - Audio output

---

#### Patch 2: consumption-pulse.pd

**Purpose:** Rhythmic, pulsing layer reflecting consumption patterns

**Inputs:**
- `tempo` (float): 40 - 180 BPM (based on consumption rate)
- `intensity` (float): 0.0 - 1.0 (pulse amplitude)
- `timbre` (int): 0 - 4 (different synthesis modes)

**Synthesis:**
- Triggered envelopes (ADSR)
- FM synthesis for harmonic richness
- Tempo synced to data changes

**Output:** Mono audio

**PD Objects Used:**
- `[metro]` - Timing/tempo
- `[vline~]` - Envelope generator
- `[osc~]` - Oscillators for FM
- `[*~]` - Modulation

---

#### Patch 3: flow-generator.pd

**Purpose:** Granular texture suggesting power "flowing" through network

**Inputs:**
- `density` (float): 10 - 200 grains/sec
- `pitch` (float): 0.5 - 2.0 (playback rate)
- `spatialization` (float): -1.0 to 1.0 (stereo position)

**Synthesis:**
- Granular synthesis using wavetable or field recording
- Random variations in grain parameters
- Doppler-like pitch shifts for directional flow

**Output:** Stereo audio (before spatial processing)

**PD Objects Used:**
- `[phasor~]` - Grain triggers
- `[tabread4~]` - Sample playback
- `[random]` - Parameter variation
- `[pan~]` - Stereo positioning

---

### WebPd Compilation

**Process:**
1. Design and test patches in desktop Pure Data
2. Ensure only vanilla PD objects used (WebPd compatibility)
3. Use WebPd compiler to convert .pd → .js
4. Load compiled patches in web app

**Command (example):**
```bash
pd2js grid-drone.pd > grid-drone-patch.js
```

**In-Browser Loading:**
```javascript
import gridDronePatch from './audio/pd-patches/grid-drone-patch.js';
const patch = Pd.loadPatch(gridDronePatch);
```

---

### Spatial Audio Implementation

**Approach:** Three.js Audio for 3D positioning

**Setup:**
```javascript
import * as THREE from 'three';

// Create audio listener (user's ears)
const listener = new THREE.AudioListener();
camera.add(listener);

// Create positioned audio source (substation)
const sound = new THREE.PositionalAudio(listener);
const audioLoader = new THREE.AudioLoader();

// Load audio buffer from WebPd output
audioLoader.load('path/to/audio', function(buffer) {
  sound.setBuffer(buffer);
  sound.setRefDistance(20);        // Audible within 20m
  sound.setRolloffFactor(2);       // Distance attenuation
  sound.setLoop(true);
  sound.play();
});

// Position in 3D space based on GPS
const substationPosition = new THREE.Vector3(x, y, 0);
sound.position.copy(substationPosition);
scene.add(sound);
```

**GPS → 3D Coordinate Conversion:**
```javascript
function latLonToXY(lat, lon, originLat, originLon) {
  const latMeters = (lat - originLat) * 111320;  // ~111km per degree
  const lonMeters = (lon - originLon) * 111320 * Math.cos(originLat * Math.PI / 180);
  return { x: lonMeters, y: latMeters };
}
```

**Listener Orientation (Compass):**
```javascript
window.addEventListener('deviceorientation', (event) => {
  const alpha = event.alpha; // Compass heading (0-360)
  listener.rotation.y = THREE.MathUtils.degToRad(alpha);
});
```

---

## 3.5 Backend Architecture (Firebase)

### Cloud Functions

#### Function 1: fetchGridData

**Trigger:** HTTPS request from frontend  
**Purpose:** Aggregate and serve grid data for requested area

**Inputs:**
- `lat`, `lon` (user position)
- `radius` (meters, default 500)

**Process:**
1. Query external APIs (EWZ, Swissgrid)
2. Filter data to requested geographic area
3. Normalize and format
4. Cache in Firestore
5. Return JSON

**Code Sketch:**
```javascript
exports.fetchGridData = functions.https.onRequest(async (req, res) => {
  const { lat, lon, radius } = req.query;
  
  // Check cache first
  const cached = await checkCache(lat, lon);
  if (cached && !isStale(cached.timestamp)) {
    return res.json(cached.data);
  }
  
  // Fetch from external APIs
  const gridFreq = await fetchSwissgridFrequency();
  const consumption = await fetchEWZConsumption(lat, lon, radius);
  
  const data = {
    timestamp: Date.now(),
    frequency: gridFreq,
    consumption: consumption,
    location: { lat, lon }
  };
  
  // Cache result
  await cacheData(lat, lon, data);
  
  res.json(data);
});
```

---

#### Function 2: processSubstationData

**Trigger:** Scheduled (Cloud Scheduler) - daily  
**Purpose:** Update static infrastructure data from OSM

**Process:**
1. Query Overpass API for Zurich substations
2. Parse GeoJSON response
3. Update Firestore database
4. Log changes

---

### Firestore Database Schema

**Collection:** `infrastructure`

**Document Structure:**
```json
{
  "id": "substation_001",
  "type": "substation",
  "location": {
    "lat": 47.3667,
    "lon": 8.5500
  },
  "properties": {
    "voltage": "110kV",
    "operator": "EWZ",
    "verified": true,
    "lastUpdated": "2026-01-15T10:30:00Z"
  }
}
```

**Collection:** `grid_data_cache`

**Document Structure:**
```json
{
  "timestamp": 1705395600000,
  "location": {
    "lat": 47.3667,
    "lon": 8.5500,
    "radius": 500
  },
  "frequency": 50.02,
  "consumption": {
    "current": 12500,
    "unit": "kW",
    "trend": "increasing"
  },
  "ttl": 900000  // Cache for 15 minutes
}
```

---

## 3.6 Progressive Web App (PWA) Configuration

### manifest.json

```json
{
  "name": "Invisible Infrastructures: Zurich",
  "short_name": "InfraSound ZH",
  "description": "Listen to Zurich's electrical grid",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#1a1a1a",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/assets/images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/assets/images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "permissions": [
    "geolocation"
  ]
}
```

### Service Worker (sw.js)

**Purpose:** Enable offline functionality, cache assets

**Caching Strategy:**
- Cache app shell (HTML, CSS, JS) on install
- Network-first for data requests
- Cache-first for static assets (images, audio samples)

**Code Sketch:**
```javascript
const CACHE_NAME = 'infra-sound-v1';
const urlsToCache = [
  '/',
  '/css/main.css',
  '/js/app.js',
  '/js/audio-engine.js',
  // ... other assets
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

---

## 3.7 Data Processing & Sonification Logic

### Mapping Functions

**Grid Frequency → Audio Frequency**
```javascript
function mapGridFrequency(gridHz) {
  // Map 49.9-50.1 Hz to 49.9-50.1 Hz (1:1)
  // Small variations are perceptible as wavering
  return gridHz;
}
```

**Consumption → Harmonics**
```javascript
function mapConsumptionToHarmonics(kwh, maxKwh) {
  // 0 kWh = 1 harmonic (pure sine)
  // maxKwh = 12 harmonics (rich timbre)
  const normalized = kwh / maxKwh;
  return Math.floor(normalized * 12) + 1;
}
```

**Distance → Volume**
```javascript
function mapDistanceToVolume(distanceMeters, maxDistance = 200) {
  // Inverse square law approximation
  if (distanceMeters > maxDistance) return 0;
  const normalized = 1 - (distanceMeters / maxDistance);
  return Math.pow(normalized, 2); // Exponential falloff
}
```

**Time of Day → Timbre**
```javascript
function mapTimeToTimbre(hour) {
  // 0-6: Night (dark, filtered)
  // 6-12: Morning (bright, rising)
  // 12-18: Afternoon (full, warm)
  // 18-24: Evening (descending, mellow)
  
  const timbres = {
    night: { brightness: 0.2, warmth: 0.8 },
    morning: { brightness: 0.9, warmth: 0.5 },
    afternoon: { brightness: 0.7, warmth: 0.7 },
    evening: { brightness: 0.4, warmth: 0.9 }
  };
  
  if (hour < 6) return timbres.night;
  if (hour < 12) return timbres.morning;
  if (hour < 18) return timbres.afternoon;
  return timbres.evening;
}
```

---

## 3.8 Development Workflow

### Phase 1: Setup (Week 1)

**Tasks:**
- [ ] Initialize Git repository
- [ ] Set up VS Code with Claude Code
- [ ] Create basic HTML/CSS/JS structure
- [ ] Install Three.js, Tone.js via CDN or npm
- [ ] Set up Firebase project
- [ ] Configure hosting and Firestore

**Deliverables:**
- Project scaffolding
- "Hello World" PWA deployed to Firebase Hosting

---

### Phase 2: Audio Prototyping (Weeks 2-3)

**Tasks:**
- [ ] Design Pure Data patches in desktop PD
- [ ] Test patches with mock data
- [ ] Compile patches with WebPd
- [ ] Integrate WebPd into web app
- [ ] Test audio playback in browser
- [ ] Implement basic spatial audio (Three.js)

**Deliverables:**
- Working PD patches
- Browser-based audio synthesis functional

---

### Phase 3: Geolocation & Mapping (Week 4)

**Tasks:**
- [ ] Implement GPS tracking
- [ ] Request/handle location permissions
- [ ] Create route data file (GeoJSON)
- [ ] Test GPS accuracy on MVP route
- [ ] Implement distance calculations
- [ ] Add compass heading integration

**Deliverables:**
- GPS tracking functional
- Distance-based audio triggering working

---

### Phase 4: Data Integration (Weeks 5-6)

**Tasks:**
- [ ] Implement backend Cloud Functions
- [ ] Connect to external APIs (based on Section 1 findings)
- [ ] Set up Firestore caching
- [ ] Test data flow: API → Backend → Frontend
- [ ] Handle offline/error scenarios
- [ ] Map data to synthesis parameters

**Deliverables:**
- Live or cached grid data flowing to audio engine
- Sonification responding to real data

---

### Phase 5: UI & Polish (Weeks 7-8)

**Tasks:**
- [ ] Design and implement UI screens
- [ ] Create intro/tutorial flow
- [ ] Add progress indicators
- [ ] Implement journey summary
- [ ] Accessibility testing (screen readers, contrast)
- [ ] Performance optimization

**Deliverables:**
- Complete user experience flow
- Polished, responsive interface

---

### Phase 6: Testing & Refinement (Weeks 9-10)

**Tasks:**
- [ ] Beta testing with 5-10 users
- [ ] Collect feedback
- [ ] Fix bugs and edge cases
- [ ] Optimize battery usage
- [ ] Test on multiple devices (iOS, Android)
- [ ] Refine audio mix and spatialization

**Deliverables:**
- Bug-free, tested app
- User feedback incorporated

---

### Phase 7: Documentation & Launch (Weeks 11-12)

**Tasks:**
- [ ] Write user guide
- [ ] Create project documentation
- [ ] Record demo video
- [ ] Prepare launch materials (website, press kit)
- [ ] Public release
- [ ] Monitor usage and gather data

**Deliverables:**
- Public launch
- Documentation complete
- Monitoring and analytics in place

---

## 3.9 Technical Challenges & Solutions

### Challenge 1: GPS Accuracy

**Problem:** Urban GPS accuracy can be 5-50 meters off  
**Solutions:**
- Use wider trigger zones (50m radius) for substations
- Smooth GPS readings (Kalman filter or moving average)
- Rely on compass for directional audio (more accurate)
- Test extensively on route and adjust

---

### Challenge 2: Battery Drain

**Problem:** Continuous GPS + audio processing = battery drain  
**Solutions:**
- Lower GPS update frequency (every 5 seconds vs. 1 second)
- Use device motion API sparingly
- Optimize Web Audio graph (fewer nodes)
- Provide battery usage warning
- Pause experience during phone calls automatically

---

### Challenge 3: Audio Latency

**Problem:** Delay between GPS position change and audio update  
**Solutions:**
- Minimize Web Audio processing chain
- Pre-load audio buffers
- Use efficient spatial audio algorithms
- Test on older devices (not just latest iPhone)

---

### Challenge 4: Data Availability

**Problem:** Real-time grid data may be unavailable or restricted  
**Solutions:**
- Use historical patterns to create realistic simulations
- Blend real-time aggregate data with procedural detail
- Focus on making *locations* accurate even if data is stylized
- Clearly communicate to users what's real vs. simulated

---

### Challenge 5: Cross-Browser Compatibility

**Problem:** Web Audio/WebGL inconsistencies between browsers  
**Solutions:**
- Test on Safari (iOS), Chrome (Android), Firefox
- Use feature detection, not browser detection
- Provide fallback experiences (2D audio if spatial fails)
- Progressive enhancement approach

---

## 3.10 Tools & Resources

### Essential Learning Resources

**Three.js:**
- Official docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Tutorial: https://threejs-journey.com/ (Bruno Simon)

**Tone.js:**
- Official docs: https://tonejs.github.io/
- Interactive examples: https://tonejs.github.io/examples/

**WebPd:**
- GitHub repo: https://github.com/sebpiq/WebPd
- Compilation guide: https://github.com/sebpiq/WebPd/wiki

**Firebase:**
- Getting started: https://firebase.google.com/docs/web/setup
- Cloud Functions: https://firebase.google.com/docs/functions

**Spatial Audio:**
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- Three.js Audio: https://threejs.org/docs/#api/en/audio/Audio

**PWA:**
- Google PWA Guide: https://web.dev/progressive-web-apps/
- Service Workers: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---

### Development Tools

**Testing:**
- Chrome DevTools (Device Mode for mobile simulation)
- Firefox Developer Edition
- BrowserStack (cross-device testing)

**Debugging:**
- Web Audio Inspector (Chrome extension)
- GPS emulation in browser dev tools

**Performance:**
- Lighthouse (built into Chrome DevTools)
- WebPageTest.org

---

# SECTION 4: PROJECT CHARTER

## 4.1 Project Definition

### Project Name
**Invisible Infrastructures: Zurich Electrical Grid MVP**

### Project Vision
Create a publicly accessible Progressive Web App that transforms Zurich's electrical infrastructure into an immersive spatial audio experience, fostering deeper engagement with urban systems through psychogeographic exploration.

### Project Mission
Deliver a functional, beautiful, and technically sound MVP that demonstrates the viability of infrastructure sonification as an art form, educational tool, and catalyst for critical urban awareness.

### Project Objectives

**Primary Objectives:**
1. Launch a working PWA for the Stadelhofen → Bahnhofstrasse route by Month 12
2. Achieve 100+ user journeys in first 3 months post-launch
3. Document process for replication in other cities
4. Generate interest from cultural institutions or funding bodies

**Secondary Objectives:**
5. Present at 1-2 conferences (NIME, ICAD, CHI)
6. Publish technical documentation as open source
7. Establish partnerships with at least 1 data provider
8. Create foundation for expanded infrastructure types (Phase 2+)

---

## 4.2 Scope Definition

### In Scope (MVP / Phase 1)

**Geographic:**
- Single route: Stadelhofen Bahnhof → Bahnhofstrasse 45 (~1.5km)
- Zurich only

**Infrastructure:**
- Electrical grid only (substations, consumption, grid frequency)
- 3-8 substations along route

**Technical:**
- Progressive Web App (mobile browser)
- GPS + compass-based spatial audio
- Procedural synthesis (WebPd) + optional field recordings
- Firebase backend for data caching
- Offline capability (basic)

**Features:**
- Intro/tutorial flow
- Real-time or near-real-time audio walk
- Journey summary at completion
- Optional: tap for infrastructure details
- Optional: historical timeline scrubber (if time permits)

**Deliverables:**
- Deployed PWA (public URL)
- Source code repository (GitHub)
- User documentation
- Technical documentation
- Demo video (3-5 min)
- Blog post / project page

---

### Out of Scope (Deferred to Future Phases)

**NOT in MVP:**
- Multiple routes or cities
- Other infrastructure types (water, telecom, transport, etc.)
- User-generated content
- Social/multiplayer features
- Native mobile apps (iOS/Android)
- AR visual overlays (AR audio only via spatialization)
- Historical comparison modes
- Speculative futures scenarios
- Integration with utility company live dashboards
- Gamification or achievement systems

**Explicitly Excluded:**
- Commercial partnerships (initially)
- Revenue generation (free access for MVP)
- Large-scale marketing campaigns

---

## 4.3 Timeline & Milestones

### Overall Timeline: 6-12 Months

**Preferred Target:** 9 months (feasible with part-time effort)

### Phase Breakdown

#### **Phase 0: Data Research (Months 1-2)**
*See Section 1 for details*

**Milestones:**
- [ ] **M0.1:** Data inventory complete (Week 4)
- [ ] **M0.2:** Route mapped with verified infrastructure (Week 6)
- [ ] **M0.3:** Data access confirmed or fallback strategy defined (Week 8)
- [ ] **GO/NO-GO Decision:** End of Month 2

**Key Deliverables:**
- Data Availability Report
- Annotated route map (GeoJSON)
- Sample datasets downloaded

**Risk:** Insufficient data access → Triggers fallback strategy or project pivot

---

#### **Phase 1: Foundation (Months 2-3)**
*Technical setup and prototyping*

**Milestones:**
- [ ] **M1.1:** Development environment configured (Week 9)
- [ ] **M1.2:** "Hello World" PWA deployed (Week 10)
- [ ] **M1.3:** GPS tracking functional (Week 11)
- [ ] **M1.4:** Basic audio synthesis working (Week 12)

**Key Deliverables:**
- Git repository initialized
- Firebase project configured
- Simple spatial audio test

**Dependencies:**
- Completion of Phase 0
- Access to dev tools (VS Code, Firebase account)

---

#### **Phase 2: Audio Prototyping (Months 3-4)**
*Pure Data patch design and WebPd integration*

**Milestones:**
- [ ] **M2.1:** 3 PD patches designed and tested (Week 14)
- [ ] **M2.2:** WebPd compiled patches integrated (Week 15)
- [ ] **M2.3:** Spatial audio with Three.js working (Week 16)

**Key Deliverables:**
- Pure Data patches (grid-drone, consumption-pulse, flow-generator)
- Browser-based synthesis functional
- Audio positioned based on mock GPS data

**Dependencies:**
- Pure Data fluency (use existing skills)
- WebPd compiler functional

---

#### **Phase 3: Core Integration (Months 4-6)**
*Connect all systems: GPS, data, audio*

**Milestones:**
- [ ] **M3.1:** Backend data fetching working (Week 18)
- [ ] **M3.2:** Data mapped to synthesis parameters (Week 20)
- [ ] **M3.3:** Full audio experience playable on route (Week 24)

**Key Deliverables:**
- Cloud Functions deployed
- Real or simulated data flowing to audio engine
- Complete audio walk functional (rough version)

**Dependencies:**
- Data access secured (Phase 0)
- Audio engine complete (Phase 2)

**Critical Path Item:** This is the longest phase and core integration point

---

#### **Phase 4: User Experience & Polish (Months 6-7)**
*UI, onboarding, refinement*

**Milestones:**
- [ ] **M4.1:** UI designed and implemented (Week 26)
- [ ] **M4.2:** Intro/tutorial flow complete (Week 27)
- [ ] **M4.3:** Journey summary functional (Week 28)

**Key Deliverables:**
- Polished interface (mobile-optimized)
- User onboarding flow
- Journey stats and summary screen

**Dependencies:**
- Core experience working (Phase 3)

---

#### **Phase 5: Testing & Refinement (Months 7-8)**
*Beta testing, bug fixes, optimization*

**Milestones:**
- [ ] **M5.1:** Alpha version ready for self-testing (Week 30)
- [ ] **M5.2:** Beta testing with 5-10 users (Week 32)
- [ ] **M5.3:** All critical bugs resolved (Week 34)

**Key Deliverables:**
- Bug-free experience
- Performance optimized (battery, latency)
- User feedback incorporated

**Dependencies:**
- Completed UX (Phase 4)
- Willing beta testers recruited

**Testing Plan:**
- Week 30: Solo testing on route (multiple times, different conditions)
- Week 31: Invite 2-3 close contacts to test
- Week 32: Broader beta group (5-10 people)
- Week 33-34: Fix issues, iterate

---

#### **Phase 6: Documentation & Launch (Months 9)**
*Prepare for public release*

**Milestones:**
- [ ] **M6.1:** Documentation complete (Week 36)
- [ ] **M6.2:** Demo video produced (Week 37)
- [ ] **M6.3:** Public launch (Week 38)

**Key Deliverables:**
- User guide (how to experience)
- Technical documentation (for developers)
- 3-5 minute demo video
- Project website or dedicated page
- Press kit (if seeking media coverage)
- GitHub repository public

**Launch Activities:**
- Announce on social media (LinkedIn, Twitter, Mastodon)
- Post to relevant communities (NIME, CHI, creative tech)
- Share with local Zurich arts/tech groups
- Contact Anthropic (Claude use case!)
- Submit to conferences (if timing aligns)

---

### Gantt Chart (Simplified)

```
Month  | 1  | 2  | 3  | 4  | 5  | 6  | 7  | 8  | 9  |
-------|----|----|----|----|----|----|----|----|----| 
Phase 0: Data Research    |████████|
Phase 1: Foundation                |████████|
Phase 2: Audio Prototyping              |████████|
Phase 3: Core Integration                    |████████████████|
Phase 4: UX & Polish                                  |████████|
Phase 5: Testing                                           |████████|
Phase 6: Launch                                                 |████|
```

**Note:** Phases overlap slightly; some tasks can run in parallel (e.g., UI design while backend is being built).

---

## 4.4 Resources & Budget

### Human Resources

**Robin (Project Lead & Solo Developer):**
- Role: Everything (concept, development, testing, documentation)
- Time commitment: Variable (estimate 10-20 hours/week)
- Skills: Audio engineering, sound design, web development (beginner), spatial audio
- Skills to develop: Three.js, WebPd integration, Firebase, PWA deployment

**Advisors/Supporters (Optional):**
- UX/UI feedback from friends or colleagues
- Beta testers (5-10 volunteers)
- Technical mentorship (if needed, via online communities)

---

### Financial Budget

**Assumption:** Minimal budget, free-tier maximization

**Cloud Services (Firebase):**
- Hosting: FREE (10 GB storage, 360 MB/day bandwidth)
- Firestore: FREE (1 GB storage, 50K reads/day, 20K writes/day)
- Cloud Functions: FREE (2M invocations/month)
- **Cost:** CHF 0/month (within free tier)
- **Note:** If usage exceeds free tier post-launch, scale or monetize

**Domain Name (Optional):**
- Custom domain (e.g., invisibleinfrastructures.ch)
- **Cost:** ~CHF 15-25/year
- **Not required:** Can use Firebase default URL for MVP

**Development Tools:**
- VS Code: FREE
- Claude Code: FREE (via existing subscription)
- Pure Data: FREE (open source)
- Three.js, Tone.js, WebPd: FREE (open source)
- Git/GitHub: FREE
- **Cost:** CHF 0

**Audio Equipment:**
- Already owned: Recorder, headphones
- Field recording (optional): Time only
- **Cost:** CHF 0

**Testing:**
- Personal devices (phone, tablet)
- BrowserStack (cross-device testing): FREE tier (1 parallel session)
- **Cost:** CHF 0

**Contingency:**
- Unexpected API costs if data services charge
- Potential Firebase overage if very popular
- **Buffer:** CHF 50-100

**Total Estimated Budget: CHF 0-100 (essentially zero)**

---

### Time Budget

**Total Estimated Hours:** 180-360 hours over 9 months

**Breakdown by Phase:**
- Phase 0 (Data Research): 20-30 hours
- Phase 1 (Foundation): 20-30 hours
- Phase 2 (Audio Prototyping): 30-50 hours
- Phase 3 (Core Integration): 50-80 hours
- Phase 4 (UX & Polish): 30-50 hours
- Phase 5 (Testing): 20-40 hours
- Phase 6 (Documentation & Launch): 20-40 hours

**Weekly Commitment:**
- Months 1-2: 5-10 hours/week (research, planning)
- Months 3-6: 10-20 hours/week (core development)
- Months 7-9: 10-15 hours/week (testing, polish, launch)

**Flexible Schedule:**
- Robin's current work schedule allows evening/weekend time
- No hard deadline pressure (self-directed project)
- Can extend to 12 months if life circumstances require

---

## 4.5 Stakeholders

### Primary Stakeholder
**Robin (Project Lead)**
- Interest: Creative fulfillment, portfolio piece, learning new skills
- Expectation: Functional MVP that demonstrates technical and artistic vision
- Decision-making authority: Full (sole creator)

### Secondary Stakeholders

**Beta Testers:**
- Interest: Unique experience, early access
- Expectation: Interesting, functional audio walk
- Feedback: Critical for iteration

**Data Providers (EWZ, Stadt Zürich, Swissgrid):**
- Interest: Public engagement with infrastructure
- Expectation: Responsible data use, proper attribution
- Relationship: Cooperative (if partnerships established)

**Open Source Community:**
- Interest: Novel use of WebPd, spatial audio, PWA tech
- Expectation: Well-documented code, reusable components
- Contribution: GitHub stars, forks, contributions

**Cultural Institutions (Future):**
- Interest: Innovative public engagement, urban arts
- Expectation: Polished, documented project
- Relationship: Potential funders/exhibitors for Phase 2+

**Academic Community:**
- Interest: Research contributions (sonification, HCI, urban studies)
- Expectation: Publishable methodology, reproducible results
- Relationship: Potential collaborators, conference presentations

---

## 4.6 Success Criteria

### Technical Success Indicators

**Must-Have (Critical):**
- [ ] PWA loads and runs on iOS Safari and Android Chrome
- [ ] GPS accuracy within 10 meters on MVP route
- [ ] Audio spatialization responds to compass heading
- [ ] No audio dropouts or glitches during normal use
- [ ] App handles offline conditions gracefully (cached route data)
- [ ] Battery usage acceptable (<20% over 20 min walk)

**Should-Have (Important):**
- [ ] Audio latency <100ms from position change to sound update
- [ ] Smooth transitions between infrastructure zones
- [ ] Data updates visible/audible to user
- [ ] UI responsive and accessible (WCAG 2.1 AA)

**Nice-to-Have (Bonus):**
- [ ] Works on lower-end Android devices (3+ years old)
- [ ] Performs well on slow 3G connections
- [ ] Advanced spatial audio (HRTF, realistic distance cues)

---

### User Experience Success Indicators

**Quantitative:**
- [ ] 100+ completed journeys in first 3 months post-launch
- [ ] 70%+ completion rate (users finish route, don't abandon)
- [ ] Average session duration 15-25 minutes
- [ ] <5% bounce rate (users who open and immediately close)

**Qualitative:**
- [ ] 70%+ of beta testers would recommend to a friend
- [ ] Users report "noticing something new" about the city
- [ ] Positive feedback on audio quality and spatialization
- [ ] Intuitive onboarding (users don't get confused)

**Feedback Metrics:**
- Collect via in-app survey at journey end
- Track via Firebase Analytics (anonymous usage data)
- Direct testimonials from beta testers

---

### Artistic Success Indicators

**Conceptual:**
- [ ] Experience is legible (users understand they're hearing grid data)
- [ ] Audio balances data fidelity with aesthetic beauty
- [ ] Users develop new perception of infrastructure
- [ ] Experience feels intentional, not random or arbitrary

**Documentation:**
- [ ] High-quality demo video (3-5 min)
- [ ] Field recordings and photos from route
- [ ] Written artist statement articulates vision
- [ ] At least one "wow" moment per journey (climactic scene, surprise)

**Recognition:**
- [ ] Accepted to 1+ conferences or festivals
- [ ] Featured in online publication (tech, art, urbanism)
- [ ] Positive reception in creative tech communities

---

### Project Success Indicators

**Completion:**
- [ ] MVP launched by Month 9 (or Month 12 at latest)
- [ ] All major features functional
- [ ] No critical bugs in production
- [ ] Public GitHub repository with documentation

**Learning:**
- [ ] Robin gains proficiency in Three.js, WebPd, Firebase
- [ ] Technical challenges documented (useful for future projects)
- [ ] Lessons learned inform Phase 2+ planning

**Impact:**
- [ ] Serves as portfolio piece for future opportunities (BBC, Cambridge roles)
- [ ] Generates interest from cultural institutions or funding bodies
- [ ] Opens doors for collaborations or commissions
- [ ] Provides foundation for broader "Invisible Infrastructures" project

**Sustainability:**
- [ ] Open source code enables others to adapt for their cities
- [ ] Modular design allows adding infrastructure types (Phase 2+)
- [ ] Data partnerships (if established) remain active
- [ ] Project can operate within free-tier costs indefinitely

---

## 4.7 Risk Assessment & Mitigation

### High-Priority Risks

#### Risk 1: Insufficient Data Access

**Description:** Unable to obtain real-time or granular electrical grid data  
**Likelihood:** MEDIUM  
**Impact:** HIGH (core concept depends on data)

**Mitigation Strategies:**
1. **Fallback to historical data:** Use past consumption patterns to create realistic simulations
2. **Blended approach:** Combine aggregate real-time data with procedural details
3. **Focus on location accuracy:** Even if data is stylized, infrastructure positions are correct
4. **Partner with university:** Collaborate with research group for sensor deployment
5. **Transparency:** Clearly communicate to users what's real vs. simulated

**Contingency Plan:** If no usable data by end of Month 2, pivot to "stylized interpretation" framing rather than "real-time sonification"

---

#### Risk 2: Technical Complexity Exceeds Skill Level

**Description:** Three.js, WebPd, or spatial audio prove too difficult given beginner status  
**Likelihood:** MEDIUM  
**Impact:** HIGH (could delay or derail project)

**Mitigation Strategies:**
1. **Incremental learning:** Follow structured tutorials, don't rush
2. **Use Claude Code extensively:** Leverage AI assistance for unfamiliar code
3. **Simplify scope:** If struggling, reduce features (e.g., 2D audio instead of 3D)
4. **Community support:** Ask for help in Three.js forums, Stack Overflow
5. **Allow extra time:** Extend timeline to 12 months if needed

**Contingency Plan:** If stuck on WebPd, fall back to Tone.js-only synthesis (still procedural, easier to control)

---

#### Risk 3: GPS Inaccuracy in Urban Environment

**Description:** GPS drift or multipath interference makes location tracking unreliable  
**Likelihood:** HIGH (common issue in cities)  
**Impact:** MEDIUM (degrades experience but not critical)

**Mitigation Strategies:**
1. **Wider trigger zones:** 50m radius instead of 20m for substations
2. **Smooth GPS readings:** Apply Kalman filter or moving average
3. **Compass-based directional audio:** More accurate than GPS for orientation
4. **Manual calibration:** Allow user to "snap" to route if GPS is very bad
5. **Test extensively:** Identify problem spots and add workarounds

**Contingency Plan:** Add manual location input as fallback (user indicates "I'm at Bellevue" on map)

---

### Medium-Priority Risks

#### Risk 4: Battery Drain

**Description:** Continuous GPS + audio processing drains battery too quickly  
**Likelihood:** MEDIUM  
**Impact:** MEDIUM (users may not complete journey)

**Mitigation:** Lower GPS update frequency, optimize Web Audio, warn users upfront

---

#### Risk 5: Timeline Slippage

**Description:** Development takes longer than anticipated, delaying launch  
**Likelihood:** MEDIUM-HIGH (common in software projects)  
**Impact:** LOW (no hard deadline, self-directed)

**Mitigation:** Build in buffer (9 months preferred, 12 months max), prioritize ruthlessly, cut features if needed

---

#### Risk 6: Low User Engagement Post-Launch

**Description:** Few people try the experience after launch  
**Likelihood:** MEDIUM  
**Impact:** LOW (still valuable as portfolio piece and learning)

**Mitigation:** Strategic launch (share in relevant communities), demo video to attract interest, local Zurich promotion

---

### Low-Priority Risks

#### Risk 7: Browser Compatibility Issues

**Mitigation:** Progressive enhancement, feature detection, test early and often

#### Risk 8: Firebase Free Tier Exceeded

**Mitigation:** Monitor usage, optimize queries, accept cost if very popular (success problem)

#### Risk 9: Data Provider Objects to Use

**Mitigation:** Ensure proper attribution, get permission upfront, have Terms of Use

---

## 4.8 Communication & Documentation Plan

### Internal Communication

**Progress Tracking:**
- GitHub Projects board (Kanban: To Do, In Progress, Done)
- Weekly review (15 min self-check every Sunday)
- Monthly milestone assessment

**Decision Logging:**
- Commit messages document technical choices
- README.md tracks major decisions
- Development journal (optional: markdown file)

---

### External Communication

**Beta Testing:**
- In-app feedback form
- Email: invisibleinfrastructures@[domain]
- Scheduled check-ins with testers (Week 32)

**Public Launch:**
- Project website or landing page
- Social media posts (LinkedIn, Twitter)
- Blog post explaining project
- Demo video (YouTube, Vimeo)

**Open Source:**
- GitHub repository with clear README
- CONTRIBUTING.md for potential collaborators
- LICENSE (choose open license, e.g., MIT or GPL)

---

### Documentation Requirements

**User-Facing:**
- [ ] Quick start guide (how to experience)
- [ ] FAQ (common questions)
- [ ] About page (project background)
- [ ] Credits and acknowledgments

**Developer-Facing:**
- [ ] README.md (overview, setup instructions)
- [ ] ARCHITECTURE.md (system design)
- [ ] API.md (backend endpoints)
- [ ] SONIFICATION.md (data-to-audio mappings)
- [ ] Code comments (inline documentation)

**Research/Academic:**
- [ ] Technical paper (if submitting to conference)
- [ ] Artist statement
- [ ] Process documentation (sketches, iterations)

---

## 4.9 Quality Assurance Plan

### Code Quality

**Standards:**
- ESLint for JavaScript linting
- Prettier for code formatting
- Semantic HTML5
- Accessible CSS (WCAG 2.1)

**Version Control:**
- Git with clear commit messages
- Branching strategy: `main` (stable), `develop` (work in progress), feature branches
- Tag releases (v1.0.0, etc.)

---

### Testing Strategy

**Unit Testing:**
- Test data processing functions (mapping, normalization)
- Test geolocation utilities (distance calculations)
- Not critical for MVP but good practice

**Integration Testing:**
- Test full data flow: API → Backend → Frontend → Audio
- Manual testing on route (multiple times)

**User Testing:**
- Alpha: Solo testing (self, Week 30)
- Beta: 5-10 users (Week 32)
- Post-launch: Monitor analytics and feedback

**Device Testing:**
- iOS Safari (iPhone, iPad)
- Android Chrome (multiple devices if possible)
- Different screen sizes, OS versions

**Performance Testing:**
- Lighthouse audits (score >80 for performance, accessibility, PWA)
- Battery usage monitoring
- Network throttling tests (slow 3G)

---

### Bug Tracking

**System:** GitHub Issues

**Priority Levels:**
- **P0 (Critical):** Blocks core functionality, fix immediately
- **P1 (High):** Major impact, fix before launch
- **P2 (Medium):** Moderate impact, fix if time permits
- **P3 (Low):** Nice-to-have, defer to post-launch or Phase 2

**Bug Template:**
```
**Description:** What's broken?
**Steps to Reproduce:** How to trigger the bug
**Expected Behavior:** What should happen
**Actual Behavior:** What actually happens
**Environment:** Device, browser, OS version
**Priority:** P0/P1/P2/P3
```

---

## 4.10 Launch Checklist

### Pre-Launch (Week 37-38)

**Technical:**
- [ ] All P0 and P1 bugs resolved
- [ ] Performance optimized (Lighthouse >80)
- [ ] PWA installable (manifest, service worker working)
- [ ] Analytics configured (Firebase or similar)
- [ ] Error logging set up (Sentry or Firebase Crashlytics)
- [ ] Backup of all data and code

**Content:**
- [ ] Demo video published
- [ ] Project page live
- [ ] User guide accessible
- [ ] Terms of Use / Privacy Policy (if collecting data)

**Legal/Ethical:**
- [ ] Data usage permissions confirmed
- [ ] Proper attribution for all data sources
- [ ] Open source license selected and applied
- [ ] Accessibility statement

**Marketing:**
- [ ] Launch announcement drafted
- [ ] Social media graphics prepared
- [ ] Email list (if applicable) ready
- [ ] Press kit (for media outreach)

---

### Launch Day

**Sequence:**
1. Final smoke test on production URL
2. Publish GitHub repository (make public)
3. Post to social media
4. Email personal network
5. Submit to relevant communities (Reddit, Hacker News, NIME forums)
6. Monitor analytics and server logs

---

### Post-Launch (Week 39-40)

**Immediate:**
- [ ] Monitor for critical bugs (daily for first week)
- [ ] Respond to user feedback promptly
- [ ] Collect usage analytics

**Short-Term (Month 10):**
- [ ] Analyze user data (completion rates, session durations)
- [ ] Gather testimonials
- [ ] Create case study or blog post
- [ ] Submit to conferences (deadlines permitting)

**Long-Term (Month 11-12):**
- [ ] Plan Phase 2 based on learnings
- [ ] Explore funding opportunities
- [ ] Present at meetups or talks (if invited)
- [ ] Maintain project (address bugs, update docs)

---

## 4.11 Lessons Learned & Reflection

### Post-Project Review (Month 12)

**Questions to Answer:**

**What went well?**
- Which technical choices were correct?
- What aspects of the experience resonated most with users?
- What surprised you positively?

**What could be improved?**
- Which challenges could have been anticipated?
- Where did scope creep occur?
- What would you do differently next time?

**Technical Learnings:**
- New skills acquired (Three.js, WebPd, etc.)
- Most useful resources or tools
- Code patterns to reuse in future projects

**User Insights:**
- What did users love?
- What confused them?
- Unexpected use cases or behaviors

**Personal Growth:**
- Time management and self-direction
- Balancing ambition with pragmatism
- Working with AI assistance (Claude Code)

**Next Steps:**
- Should Phase 2 proceed?
- What funding avenues look promising?
- Collaborations to pursue?

---

## 4.12 Appendices

### Appendix A: Glossary

**AR (Augmented Reality):** Overlaying digital content onto physical world  
**PWA (Progressive Web App):** Web app that functions like native app  
**WebPd:** JavaScript library for running Pure Data patches in browser  
**Spatial Audio:** Audio that appears to come from specific 3D locations  
**Binaural Audio:** Stereo technique simulating 3D sound for headphones  
**Sonification:** Representing data through sound  
**Psychogeography:** Study of how geography affects emotions and behavior  
**GPS (Global Positioning System):** Satellite-based location tracking  
**API (Application Programming Interface):** Way for software to communicate  
**HRTF (Head-Related Transfer Function):** Acoustic filtering for spatial audio  
**OSM (OpenStreetMap):** Community-created map database  
**GeoJSON:** Format for encoding geographic data  
**Firebase:** Google's cloud platform for web/mobile apps  
**Cloud Functions:** Serverless code execution  
**Three.js:** JavaScript library for 3D graphics  
**Tone.js:** Web audio framework for music/synthesis  
**Service Worker:** Script enabling offline web apps  

---

### Appendix B: Contact Information

**Project Lead:**  
Robin  
Email: [to be added]  
GitHub: [username]  
Location: Zurich, Switzerland

**Project URLs:**  
Repository: https://github.com/[username]/invisible-infrastructures-zurich  
Live App: https://[project-name].web.app  
Website: [to be created]

---

### Appendix C: References & Resources

**Academic Papers:**
- Hermann, T., Hunt, A., & Neuhoff, J. G. (Eds.). (2011). *The Sonification Handbook.* Logos Verlag Berlin.
- Kramer, G., et al. (1999). "Sonification report: Status of the field and research agenda." *ICAD*.

**Artistic References:**
- Teri Rueb - GPS-based sound installations
- Janet Cardiff - Audio walks
- Ryoji Ikeda - Data sonification
- Christina Kubisch - Electrical Walks (electromagnetic field listening)

**Technical Resources:**
- Web Audio API Specification: https://www.w3.org/TR/webaudio/
- Three.js Documentation: https://threejs.org/docs/
- Pure Data Documentation: http://puredata.info/docs

**Urban Infrastructure:**
- Graham, S., & Marvin, S. (2001). *Splintering Urbanism.* Routledge.
- Star, S. L. (1999). "The Ethnography of Infrastructure." *American Behavioral Scientist*.

---

### Appendix D: Version History

**Version 2.0 (Current)** - January 2026  
- Master project document created
- Integrated 4 sections: Data Research, Brief, Tech Spec, Charter
- Focused on Zurich electrical grid MVP
- 6-12 month timeline defined

**Version 1.0** - December 2025  
- Original expanded concept document
- Broad multi-infrastructure vision
- Multiple cities and scenarios

---

## Conclusion

This master project document provides a comprehensive roadmap for developing **Invisible Infrastructures: Zurich Electrical Grid MVP** from initial data research through public launch and beyond. By focusing exclusively on electrical infrastructure in a single route, the project becomes achievable within a 6-12 month timeline with minimal budget.

The four integrated sections work together:
1. **Data Research Plan** ensures realistic scope based on actual data availability
2. **Revised Project Brief** articulates artistic vision while maintaining focus
3. **Technical Specification** provides clear implementation guidance for a beginner
4. **Project Charter** defines timeline, resources, risks, and success criteria

**Next Immediate Actions:**
1. Begin Phase 0: Data Research (use Section 1 as guide)
2. Walk the MVP route and photograph infrastructure
3. Contact EWZ and Stadt Zürich open data teams
4. Create data inventory spreadsheet
5. Return to this document regularly for guidance

**Remember:**
- This is a learning project—mistakes are expected and valuable
- Scope can be adjusted based on data findings
- Timeline is flexible (no hard deadline)
- Quality over speed—better to launch later with a polished experience
- Document everything—the process is as important as the product

**You have the skills, tools, and roadmap. Time to make the invisible audible.**

---

*Document Status: Living Document - Update as project evolves*  
*Last Updated: January 29, 2026*  
*Next Review: End of Phase 0 (Month 2)*
