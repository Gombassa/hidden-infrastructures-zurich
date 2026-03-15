# Core Engine Module Introductions

## TramEngine (`src/tram-engine.js`)

TramEngine polls transport.opendata.ch every 10 seconds for tram departure times, then interpolates positions between stops using linear progression at 15 km/h average speed. Built as a singleton with observer pattern, it handles API failures gracefully by retaining last known positions. Seven stop pairs cover the prototype route through District 1: Stadelhofen → Bellevue → Paradeplatz → Rennweg → Bahnhofstrasse/HB → Bürkliplatz → Opernhaus → Stockerstrasse.

## ProximityEngine (`src/proximity-engine.js`)

ProximityEngine calculates distances between trams, infrastructure elements, and the user using haversine math. It implements a dual threshold system: substations count trams within 150m (for drone intensity), while feeders use a two-condition trigger — a feeder fires only when both a tram is within 30m of the feeder AND the listener is within 80m of the feeder. The prototype loads 71 substation candidates and 366 tram feeders on the 2.7km route.

## ListenerEngine (`src/listener-engine.js`)

ListenerEngine simulates a walker moving along the 75-waypoint route at 5 km/h, using binary search for position lookup and calculating compass heading (0-360°) for spatial audio. The MVP runs in simulation mode; production will swap this for device GPS and compass to enable free-roam exploration across District 1.

---

## Data Layer Validation

The prototype focuses on tram infrastructure data since it's the only layer requiring real-time API integration. 366 VBZ tram feeders and 71 substation candidates have been downloaded and processed on the prototype route, confirming that the transport.opendata.ch API works reliably. From this raw data, 75 route waypoints were extracted using a custom script (`extract-route-waypoints.js`) that follows the actual tram network topology rather than crow-flies distances. The script builds a graph from LineString segments, snaps parallel tracks within 5m, then uses A* pathfinding to stitch a walking route through the real overhead wire geometry.

The other four infrastructure types — water supply (WVZ Leitungskataster), sewage (ERZ Abwasser), electricity grid (ewz), and telecommunications (ewz) — are all identified and accessible through Stadt Zürich's open data portal, but extraction is pending until the funded development phase when the scope expands from the 2.7km prototype to full District 1 coverage.

---

## Integration Test Pages

Each engine was built with its own test page to validate functionality before integration:

* **`prototypes/02-tram-engine/tram-engine-test.html`** — Live dashboard showing tram positions updating every 10 seconds alongside proximity calculations to infrastructure elements
* **`prototypes/04-listener/listener-test.html`** — Interactive Leaflet map displaying the simulated walker moving along the route with real-time position and heading updates
* **`prototypes/01-audio-sketches/index.html`** — Phase 1 pipeline integration test: all three engines wired together with Web Audio API synthesis and a live Leaflet map showing listener position, feeder states, and tram positions by line

All three engines functioned independently on the prototype route data and have been integrated into a unified application demonstrating the complete data-to-audio pipeline.

---

## Documentation & Planning

A comprehensive project overview document brings together the full development narrative, including the technical architecture, route analysis and photography from the prototype walk, and identification of infrastructure data sources for all 5 layers. This documentation establishes the complete scope and validates the feasibility of the funded development work.
