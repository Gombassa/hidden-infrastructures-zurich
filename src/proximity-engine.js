// proximity-engine.js — Computes audio trigger parameters from tram ↔ infrastructure proximity.
// Pure logic module: no DOM dependencies. Requires fetch for GeoJSON loading.

const SUBSTATION_RADIUS = 150;        // metres — trams within this count toward tramCount
const FEEDER_TRIGGER_RADIUS = 50;     // metres — tram must be within this of a feeder to trigger
const FEEDER_LISTENER_RADIUS = 50;    // metres — listener must be within this of a feeder to hear it
const POWERLINE_DRONE_RADIUS = 5;     // metres — listener within this of any powerline segment activates drone

let substations = null; // [{ id, lat, lng }]
let feeders = null;     // [{ id, lat, lng }]  (midpoint of LineString)
let powerlines = null;  // [[[lng, lat], ...]] — raw coordinate arrays for each LineString

// Returns the minimum distance in metres from point P to the line segment AB.
// All inputs are [lng, lat] in degrees; uses a flat-earth approximation valid
// for the short segments (~10–200m) found in the powerlines dataset.
function pointToSegmentDistance(pLng, pLat, aLng, aLat, bLng, bLat) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  // Convert to local metres relative to A
  const cosLat = Math.cos(toRad((aLat + bLat) / 2));
  const ax = 0, ay = 0;
  const bx = (bLng - aLng) * toRad(1) * R * cosLat;
  const by = (bLat - aLat) * toRad(1) * R;
  const px = (pLng - aLng) * toRad(1) * R * cosLat;
  const py = (pLat - aLat) * toRad(1) * R;

  const segLenSq = bx * bx + by * by;
  let t = segLenSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
  const dx = px - t * bx;
  const dy = py - t * by;
  return Math.sqrt(dx * dx + dy * dy);
}

function haversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseSubstations(geojson) {
  return geojson.features.map((f) => ({
    id: `substation-${String(f.properties.id).padStart(3, "0")}`,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}

function parseFeeders(geojson) {
  return geojson.features.map((f) => {
    const coords = f.geometry.coordinates;
    const mid = Math.floor(coords.length / 2);
    return {
      id: `feeder-${String(f.properties.objectid).padStart(3, "0")}`,
      lng: coords[mid][0],
      lat: coords[mid][1],
    };
  });
}

const ProximityEngine = {
  /**
   * Load and parse both GeoJSON files.
   * Paths are relative to the serving root.
   */
  async init(
    substationsUrl = "/data/processed/substations.geojson",
    feedersUrl = "/data/raw/route-tram-feeders.geojson",
    powerlinesUrl = "/data/raw/route-tram-powerlines.geojson",
  ) {
    (window.appendLog || console.log)("[ProximityEngine] Loading GeoJSON...", 'll');
    const [subRes, feedRes, plRes] = await Promise.all([
      fetch(substationsUrl),
      fetch(feedersUrl),
      fetch(powerlinesUrl),
    ]);
    if (!subRes.ok) throw new Error(`[ProximityEngine] Failed to load substations: ${subRes.status}`);
    if (!feedRes.ok) throw new Error(`[ProximityEngine] Failed to load feeders: ${feedRes.status}`);
    if (!plRes.ok)   throw new Error(`[ProximityEngine] Failed to load powerlines: ${plRes.status}`);

    const [subJson, feedJson, plJson] = await Promise.all([
      subRes.json(),
      feedRes.json(),
      plRes.json(),
    ]);

    substations = parseSubstations(subJson);
    feeders = parseFeeders(feedJson);
    powerlines = plJson.features.map((f) => f.geometry.coordinates);
    (window.appendLog || console.log)(`[ProximityEngine] Loaded ${substations.length} substations, ${feeders.length} feeders, ${powerlines.length} powerline segments`, 'll');
  },

  /**
   * Given the current tram state from TramEngine.getState() and the listener
   * position, compute audio parameters for every substation and feeder.
   * A feeder is triggered only when BOTH conditions are met:
   *   (a) a tram is within FEEDER_TRIGGER_RADIUS (50m) of the feeder
   *   (b) the listener is within FEEDER_LISTENER_RADIUS (50m) of the feeder
   * Also computes nearestPowerlineDist: minimum point-to-segment distance from
   * the listener to any powerline segment. Drone activates when < POWERLINE_DRONE_RADIUS (5m).
   * @param {object} tramState
   * @param {number} [listenerLat]
   * @param {number} [listenerLng]
   */
  calculate(tramState, listenerLat = null, listenerLng = null, heading = null, speed = null) {
    const trams = tramState.trams;

    const substationResults = substations.map((sub) => {
      let nearestDist = Infinity;
      let count = 0;

      for (const tram of trams) {
        const d = haversineDistance(sub.lng, sub.lat, tram.lng, tram.lat);
        if (d < SUBSTATION_RADIUS) count++;
        if (d < nearestDist) nearestDist = d;
      }

      return {
        id: sub.id,
        lat: sub.lat,
        lng: sub.lng,
        tramCount: count,
        nearestTramDist: trams.length > 0 ? Math.round(nearestDist) : null,
      };
    });

    const ON_TRAM_SPEED = 3; // m/s — ~10 km/h
    const onTram = speed !== null && speed > ON_TRAM_SPEED;

    const feederResults = feeders.map((fed) => {
      let triggered = false;
      let triggeringTram = null;
      let bestDist = Infinity;

      // Condition (b): listener must be within FEEDER_LISTENER_RADIUS (50m) of this feeder.
      // Bypassed when onTram — tram-to-feeder proximity alone is sufficient.
      const listenerNear = onTram
        || listenerLat === null || listenerLng === null
        || haversineDistance(fed.lng, fed.lat, listenerLng, listenerLat) < FEEDER_LISTENER_RADIUS;

      if (listenerNear) {
        for (const tram of trams) {
          const d = haversineDistance(fed.lng, fed.lat, tram.lng, tram.lat);
          if (d < FEEDER_TRIGGER_RADIUS && d < bestDist) {
            triggered = true;
            triggeringTram = tram.line;
            bestDist = d;
          }
        }
      }

      return {
        id: fed.id,
        lat: fed.lat,
        lng: fed.lng,
        triggered,
        triggeringTram,
      };
    });

    // Nearest powerline segment distance from listener
    let nearestPowerlineDist = null;
    if (listenerLat !== null && listenerLng !== null && powerlines) {
      let minDist = Infinity;
      for (const coords of powerlines) {
        for (let i = 0; i < coords.length - 1; i++) {
          const d = pointToSegmentDistance(
            listenerLng, listenerLat,
            coords[i][0], coords[i][1],
            coords[i + 1][0], coords[i + 1][1],
          );
          if (d < minDist) minDist = d;
        }
      }
      nearestPowerlineDist = minDist;
    }

    return {
      substations: substationResults,
      feeders: feederResults,
      nearestPowerlineDist,
    };
  },
};

export default ProximityEngine;
