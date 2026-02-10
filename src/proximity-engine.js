// proximity-engine.js — Computes audio trigger parameters from tram ↔ infrastructure proximity.
// Pure logic module: no DOM dependencies. Requires fetch for GeoJSON loading.

const SUBSTATION_RADIUS = 150; // metres — trams within this count toward tramCount
const FEEDER_TRIGGER_RADIUS = 30; // metres — tram triggers a feeder event

let substations = null; // [{ id, lat, lng }]
let feeders = null; // [{ id, lat, lng }]  (midpoint of LineString)

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
    substationsUrl = "data/processed/substations.geojson",
    feedersUrl = "data/raw/route-tram-feeders.geojson",
  ) {
    console.log("[ProximityEngine] Loading GeoJSON...");
    const [subRes, feedRes] = await Promise.all([
      fetch(substationsUrl),
      fetch(feedersUrl),
    ]);
    if (!subRes.ok) throw new Error(`[ProximityEngine] Failed to load substations: ${subRes.status}`);
    if (!feedRes.ok) throw new Error(`[ProximityEngine] Failed to load feeders: ${feedRes.status}`);

    const [subJson, feedJson] = await Promise.all([
      subRes.json(),
      feedRes.json(),
    ]);

    substations = parseSubstations(subJson);
    feeders = parseFeeders(feedJson);
    console.log(
      `[ProximityEngine] Loaded ${substations.length} substations, ${feeders.length} feeders`,
    );
  },

  /**
   * Given the current tram state from TramEngine.getState(),
   * compute audio parameters for every substation and feeder.
   */
  calculate(tramState) {
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

    const feederResults = feeders.map((fed) => {
      let triggered = false;
      let triggeringTram = null;
      let bestDist = Infinity;

      for (const tram of trams) {
        const d = haversineDistance(fed.lng, fed.lat, tram.lng, tram.lat);
        if (d < FEEDER_TRIGGER_RADIUS && d < bestDist) {
          triggered = true;
          triggeringTram = tram.line;
          bestDist = d;
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

    return {
      substations: substationResults,
      feeders: feederResults,
    };
  },
};

export default ProximityEngine;
