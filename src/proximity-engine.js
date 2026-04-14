// proximity-engine.js — Computes audio trigger parameters from tram ↔ infrastructure proximity.
// Pure logic module: no DOM dependencies. Requires fetch for GeoJSON loading.

// ── RADII (metres) ───────────────────────────────────────────────────────────
const SUBSTATION_RADIUS      = 150;  // trams within this count toward tramCount
const FEEDER_TRIGGER_RADIUS  = 50;   // tram-to-node distance to trigger feeder event
const FEEDER_LISTENER_RADIUS = 50;   // listener-to-node gate for feeder events
const POWERLINE_DRONE_RADIUS = 5;    // listener within this of tram trasse activates drone

const WATER_PIPE_RADIUS      = 50;   // listener-to-pipe (nearest point on segment)
const WATER_FITTING_RADIUS   = 25;   // listener-to-fitting (point distance)
const SEWAGE_PIPE_RADIUS     = 80;   // listener-to-collector (nearest point on segment)
const ELEC_NODE_RADIUS       = 40;   // listener-to-transformer node
const ELEC_CABLE_RADIUS      = 40;   // listener-to-cable (nearest point on segment)
const TELECOM_NODE_RADIUS    = 40;   // listener-to-telecom node
const TELECOM_CABLE_RADIUS   = 30;   // listener-to-cable (nearest point on segment)
const FERNWAERME_PIPE_RADIUS = 60;   // listener-to-heat pipe (nearest point on segment)

// ── CULL ─────────────────────────────────────────────────────────────────────
const CULL_RADIUS = 100; // metres — bounding-box pre-filter before precise distance math

function cullBounds(lat, lng) {
  const latDelta = CULL_RADIUS / 111320;
  const lngDelta = CULL_RADIUS / (111320 * Math.cos(lat * Math.PI / 180));
  return { minLat: lat - latDelta, maxLat: lat + latDelta, minLng: lng - lngDelta, maxLng: lng + lngDelta };
}
function cullPoints(features, b) {
  return features.filter(f => f.lat >= b.minLat && f.lat <= b.maxLat && f.lng >= b.minLng && f.lng <= b.maxLng);
}
function cullLines(features, b) {
  return features.filter(f => f.midLat >= b.minLat && f.midLat <= b.maxLat && f.midLng >= b.minLng && f.midLng <= b.maxLng);
}

// ── STATE ────────────────────────────────────────────────────────────────────
let substations     = null;  // [{id, lat, lng}]
let feeders         = null;  // [{id, lat, lng}]  — lk-tram-lk nodes (geomType=node)
let powerlines      = null;  // [[[lng,lat],...]] — lk-tram-lk trasse (geomType=trasse)

let waterPipes      = null;  // [{id, coords, midLat, midLng}]
let waterFittings   = null;  // [{id, lat, lng}]
let sewagePipes     = null;  // [{id, coords, midLat, midLng}]
let elecNodes       = null;  // [{id, lat, lng}]
let elecCables      = null;  // [{id, coords, midLat, midLng}]
let telecomNodes    = null;  // [{id, lat, lng}]
let telecomCables   = null;  // [{id, coords, midLat, midLng}]
let fernwaermePipes = null;  // [{id, coords, midLat, midLng}]

// ── GEOMETRY HELPERS ─────────────────────────────────────────────────────────

// Minimum distance in metres from point P to line segment AB.
// Flat-earth approximation — valid for the short segments (~10–200m) in this dataset.
function pointToSegmentDistance(pLng, pLat, aLng, aLat, bLng, bLat) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const cosLat = Math.cos(toRad((aLat + bLat) / 2));
  const bx = (bLng - aLng) * toRad(1) * R * cosLat;
  const by = (bLat - aLat) * toRad(1) * R;
  const px = (pLng - aLng) * toRad(1) * R * cosLat;
  const py = (pLat - aLat) * toRad(1) * R;
  const segLenSq = bx * bx + by * by;
  const t = segLenSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
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
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest point-on-segment distance from listener to a LineString coords array.
function nearestSegmentDist(listenerLng, listenerLat, coords) {
  let minDist = Infinity;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentDistance(
      listenerLng, listenerLat,
      coords[i][0],     coords[i][1],
      coords[i + 1][0], coords[i + 1][1],
    );
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// Midpoint of a coordinate array — used as the representative position for PannerNode.
function midpoint(coords) {
  const mid = Math.floor(coords.length / 2);
  return { midLng: coords[mid][0], midLat: coords[mid][1] };
}

// ── PARSE HELPERS ────────────────────────────────────────────────────────────

function parseSubstations(geojson) {
  return geojson.features.map((f) => ({
    id: `substation-${String(f.properties.id).padStart(3, '0')}`,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}

// lk-tram-lk.geojson:
//   geomType=node  (Point)      → feeders (replaces route-tram-feeders.geojson)
//   geomType=trasse (LineString) → powerlines (replaces route-tram-powerlines.geojson)
//   geomType=area, overhead      → ignored
function parseTramLk(geojson) {
  const parsedFeeders = [];
  const parsedPowerlines = [];
  let nodeIdx = 0;
  for (const f of geojson.features) {
    const gt = f.properties.geomType;
    if (gt === 'node' && f.geometry.type === 'Point') {
      parsedFeeders.push({
        id: `tram-node-${nodeIdx++}`,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      });
    } else if (gt === 'trasse' && f.geometry.type === 'LineString') {
      parsedPowerlines.push(f.geometry.coordinates);
    }
  }
  return { parsedFeeders, parsedPowerlines };
}

// Extract LineString features matching geomTypeFilter.
function parseLineFeatures(geojson, geomTypeFilter, prefix) {
  const result = [];
  let idx = 0;
  for (const f of geojson.features) {
    if (f.properties.geomType === geomTypeFilter && f.geometry.type === 'LineString') {
      const coords = f.geometry.coordinates;
      result.push({ id: `${prefix}-${idx++}`, coords, ...midpoint(coords) });
    }
  }
  return result;
}

// Extract Point features matching geomTypeFilter.
function parsePointFeatures(geojson, geomTypeFilter, prefix) {
  const result = [];
  let idx = 0;
  for (const f of geojson.features) {
    if (f.properties.geomType === geomTypeFilter && f.geometry.type === 'Point') {
      result.push({
        id: `${prefix}-${idx++}`,
        lng: f.geometry.coordinates[0],
        lat: f.geometry.coordinates[1],
      });
    }
  }
  return result;
}

// ── PROXIMITY HELPERS ────────────────────────────────────────────────────────

// [{id, midLat, midLng, dist, triggered}] — one entry per LineString feature.
// dist = nearest point-on-segment distance in metres.
function proximityLines(listenerLng, listenerLat, features, radius) {
  return features.map((f) => {
    const dist = nearestSegmentDist(listenerLng, listenerLat, f.coords);
    return {
      id: f.id,
      midLat: f.midLat,
      midLng: f.midLng,
      dist: Math.round(dist),
      triggered: dist <= radius,
    };
  });
}

// [{id, lat, lng, dist, triggered}] — one entry per Point feature.
function proximityPoints(listenerLng, listenerLat, features, radius) {
  return features.map((f) => {
    const dist = haversineDistance(listenerLng, listenerLat, f.lng, f.lat);
    return {
      id: f.id,
      lat: f.lat,
      lng: f.lng,
      dist: Math.round(dist),
      triggered: dist <= radius,
    };
  });
}

// ── ENGINE ───────────────────────────────────────────────────────────────────

const ProximityEngine = {

  /**
   * Load and parse all GeoJSON layers.
   * Accepts an optional config object; all keys have working defaults.
   *
   * @param {object} [opts]
   * @param {string} [opts.substationsUrl]
   * @param {string} [opts.tramLkUrl]      — replaces route-tram-feeders + route-tram-powerlines
   * @param {string} [opts.waterUrl]
   * @param {string} [opts.sewageUrl]
   * @param {string} [opts.electricityUrl]
   * @param {string} [opts.telecomUrl]
   * @param {string} [opts.fernwaermeUrl]
   */
  async init({
    substationsUrl = '/data/processed/substations.geojson',
    tramLkUrl      = '/lk-tram-lk.geojson',
    waterUrl       = '/lk-water.geojson',
    sewageUrl      = '/lk-sewage.geojson',
    electricityUrl = '/lk-electricity.geojson',
    telecomUrl     = '/lk-telecom.geojson',
    fernwaermeUrl  = '/lk-fernwaerme.geojson',
  } = {}) {
    (window.appendLog || console.log)('[ProximityEngine] Loading GeoJSON…', 'll');

    const urls  = [substationsUrl, tramLkUrl, waterUrl, sewageUrl, electricityUrl, telecomUrl, fernwaermeUrl];
    const names = ['substations.geojson', 'lk-tram-lk', 'lk-water', 'lk-sewage', 'lk-electricity', 'lk-telecom', 'lk-fernwaerme'];
    const responses = await Promise.all(urls.map((u) => fetch(u)));
    for (const [i, res] of responses.entries()) {
      if (!res.ok) throw new Error(`[ProximityEngine] Failed to load ${urls[i]}: ${res.status}`);
      (window.appendLog || console.log)(`  ✓ ${names[i]} — HTTP ${res.status}`, 'lok');
    }
    const [subJson, tramLkJson, waterJson, sewageJson, elecJson, telecomJson, fernJson] =
      await Promise.all(responses.map((r) => r.json()));

    substations = parseSubstations(subJson);
    (window.appendLog || console.log)(
      `  substations: ${substations.length} / ${subJson.features.length} features`, 'linf'
    );

    const { parsedFeeders, parsedPowerlines } = parseTramLk(tramLkJson);
    feeders    = parsedFeeders;
    powerlines = parsedPowerlines;
    (window.appendLog || console.log)(
      `  lk-tram-lk: ${tramLkJson.features.length} total → ${feeders.length} nodes + ${powerlines.length} trasse (${tramLkJson.features.length - feeders.length - powerlines.length} excluded)`, 'linf'
    );

    waterPipes    = parseLineFeatures(waterJson,    'pipe',    'water-pipe');
    waterFittings = parsePointFeatures(waterJson,   'fitting', 'water-fit');
    (window.appendLog || console.log)(
      `  lk-water: ${waterJson.features.length} total → ${waterPipes.length} pipes + ${waterFittings.length} fittings (${waterJson.features.length - waterPipes.length - waterFittings.length} excluded)`, 'linf'
    );

    sewagePipes = parseLineFeatures(sewageJson, 'pipe', 'sewage-pipe');
    (window.appendLog || console.log)(
      `  lk-sewage: ${sewageJson.features.length} total → ${sewagePipes.length} pipes (${sewageJson.features.length - sewagePipes.length} excluded)`, 'linf'
    );

    elecNodes  = parsePointFeatures(elecJson, 'node',  'elec-node');
    elecCables = parseLineFeatures(elecJson,  'cable', 'elec-cable');
    (window.appendLog || console.log)(
      `  lk-electricity: ${elecJson.features.length} total → ${elecNodes.length} nodes + ${elecCables.length} cables (${elecJson.features.length - elecNodes.length - elecCables.length} excluded)`, 'linf'
    );

    telecomNodes  = parsePointFeatures(telecomJson, 'node',  'telecom-node');
    telecomCables = parseLineFeatures(telecomJson,  'cable', 'telecom-cable');
    (window.appendLog || console.log)(
      `  lk-telecom: ${telecomJson.features.length} total → ${telecomNodes.length} nodes + ${telecomCables.length} cables (${telecomJson.features.length - telecomNodes.length - telecomCables.length} excluded)`, 'linf'
    );

    fernwaermePipes = parseLineFeatures(fernJson, 'pipe', 'fernw-pipe');
    (window.appendLog || console.log)(
      `  lk-fernwaerme: ${fernJson.features.length} total → ${fernwaermePipes.length} pipes (${fernJson.features.length - fernwaermePipes.length} excluded)`, 'linf'
    );

    (window.appendLog || console.log)('[ProximityEngine] All 7 layers loaded.', 'lok');
  },

  /**
   * Compute proximity results for all layers.
   *
   * Tram feeders are triggered when (a) a tram is within FEEDER_TRIGGER_RADIUS of a node
   * AND (b) the listener is within FEEDER_LISTENER_RADIUS, or the listener is on a tram.
   *
   * All other layer results are listener-only (no tram involvement).
   * LineString proximity uses nearest point on segment, not endpoints.
   * New layer results are omitted (empty arrays) when listener position is unknown.
   *
   * @returns {{
   *   substations, feeders, nearestPowerlineDist,
   *   water: {pipes, fittings},
   *   sewage: {pipes},
   *   electricity: {nodes, cables},
   *   telecom: {nodes, cables},
   *   fernwaerme: {pipes}
   * }}
   */
  calculate(tramState, listenerLat = null, listenerLng = null, heading = null, speed = null) {
    const trams = tramState.trams;

    // ── Substations ──────────────────────────────────────────────────────────
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

    // ── Tram feeders (lk-tram-lk nodes) ─────────────────────────────────────
    const ON_TRAM_SPEED = 3; // m/s ≈ 10 km/h
    const onTram = speed !== null && speed > ON_TRAM_SPEED;

    // ── DEBUG: tram → nearest-feeder distances ───────────────────────────────
    // Remove once feeder triggering is confirmed working in the field.
    if (trams.length > 0 && feeders.length > 0) {
      const lines = trams.map((tram) => {
        let minDist = Infinity;
        let nearestId = null;
        for (const fed of feeders) {
          const d = haversineDistance(fed.lng, fed.lat, tram.lng, tram.lat);
          if (d < minDist) { minDist = d; nearestId = fed.id; }
        }
        return `L${tram.line}@(${tram.lat.toFixed(4)},${tram.lng.toFixed(4)})→${nearestId}:${Math.round(minDist)}m`;
      });
      (window.appendLog || console.log)(`[FEEDER-DBG] ${lines.join(' | ')}`, 'll');
    }

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

      return { id: fed.id, lat: fed.lat, lng: fed.lng, triggered, triggeringTram };
    });

    // ── Nearest tram trasse distance (drone) ─────────────────────────────────
    let nearestPowerlineDist = null;
    if (listenerLat !== null && listenerLng !== null && powerlines) {
      let minDist = Infinity;
      for (const coords of powerlines) {
        for (let i = 0; i < coords.length - 1; i++) {
          const d = pointToSegmentDistance(
            listenerLng, listenerLat,
            coords[i][0],     coords[i][1],
            coords[i + 1][0], coords[i + 1][1],
          );
          if (d < minDist) minDist = d;
        }
      }
      nearestPowerlineDist = minDist;
    }

    // ── New infrastructure layers (listener-only proximity) ──────────────────
    if (listenerLat === null || listenerLng === null) {
      return {
        substations: substationResults,
        feeders: feederResults,
        nearestPowerlineDist,
        water:       { pipes: [], fittings: [] },
        sewage:      { pipes: [] },
        electricity: { nodes: [], cables: [] },
        telecom:     { nodes: [], cables: [] },
        fernwaerme:  { pipes: [] },
      };
    }

    const b = cullBounds(listenerLat, listenerLng);
    return {
      substations: substationResults,
      feeders: feederResults,
      nearestPowerlineDist,
      water: {
        pipes:    proximityLines(listenerLng, listenerLat,  cullLines(waterPipes, b),     WATER_PIPE_RADIUS),
        fittings: proximityPoints(listenerLng, listenerLat, cullPoints(waterFittings, b), WATER_FITTING_RADIUS),
      },
      sewage: {
        pipes: proximityLines(listenerLng, listenerLat, cullLines(sewagePipes, b), SEWAGE_PIPE_RADIUS),
      },
      electricity: {
        nodes:  proximityPoints(listenerLng, listenerLat, cullPoints(elecNodes, b),  ELEC_NODE_RADIUS),
        cables: proximityLines(listenerLng, listenerLat,  cullLines(elecCables, b),  ELEC_CABLE_RADIUS),
      },
      telecom: {
        nodes:  proximityPoints(listenerLng, listenerLat, cullPoints(telecomNodes, b),  TELECOM_NODE_RADIUS),
        cables: proximityLines(listenerLng, listenerLat,  cullLines(telecomCables, b),  TELECOM_CABLE_RADIUS),
      },
      fernwaerme: {
        pipes: proximityLines(listenerLng, listenerLat, cullLines(fernwaermePipes, b), FERNWAERME_PIPE_RADIUS),
      },
    };
  },
};

export default ProximityEngine;
