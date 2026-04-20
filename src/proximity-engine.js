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
const FERNWAERME_PIPE_RADIUS  = 30;   // listener-to-heat pipe (nearest point on segment)
const SEWAGE_JUNCTION_RADIUS  = 15;   // listener-to-sewage junction

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
let _prevCalcLat = null;  // listener position from previous calculate() call
let _prevCalcLng = null;

let substations     = null;  // [{id, lat, lng}]
let feeders         = null;  // [{id, lat, lng}]  — lk-tram-lk nodes (geomType=node)
let powerlines      = null;  // [[[lng,lat],...]] — lk-tram-lk trasse (geomType=trasse)

let waterPipes      = null;  // [{id, coords, midLat, midLng}]
let waterFittings   = null;  // [{id, lat, lng}]
let sewagePipes     = null;  // [{id, coords, midLat, midLng}]
let sewageJunctions = null;  // [{id, lat, lng}] — pre-computed pipe-endpoint clusters
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

// Bearing (0–360° from N) from listener to nearest point on nearest segment.
// Used to pan spatially-anchored sounds toward the pipe's direction.
function nearestSegmentBearing(listenerLng, listenerLat, coords) {
  const toRad = (d) => d * Math.PI / 180;
  const cosLat = Math.cos(toRad(listenerLat));
  let minDist = Infinity;
  let bestBearing = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const aLng = coords[i][0],     aLat = coords[i][1];
    const bLng = coords[i + 1][0], bLat = coords[i + 1][1];
    // Find parameter t of nearest point on segment
    const bx = (bLng - aLng) * cosLat;
    const by = bLat - aLat;
    const px = (listenerLng - aLng) * cosLat;
    const py = listenerLat - aLat;
    const segLenSq = bx * bx + by * by;
    const tParam = segLenSq === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / segLenSq));
    const nLng = aLng + tParam * (bLng - aLng);
    const nLat = aLat + tParam * (bLat - aLat);
    const dx = px - tParam * bx;
    const dy = py - tParam * by;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < minDist) {
      minDist = d;
      const dLng = (nLng - listenerLng) * cosLat;
      const dLat = nLat - listenerLat;
      bestBearing = (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
    }
  }
  return bestBearing;
}

// True if segments AB and CD cross (strictly — not at shared endpoints).
// Works in raw lng/lat: topological sign test is valid for short segments.
function segsCross(aLng, aLat, bLng, bLat, cLng, cLat, dLng, dLat) {
  const cross = (ox, oy, ax, ay, bx, by) =>
    (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
  const d1 = cross(cLng, cLat, dLng, dLat, aLng, aLat);
  const d2 = cross(cLng, cLat, dLng, dLat, bLng, bLat);
  const d3 = cross(aLng, aLat, bLng, bLat, cLng, cLat);
  const d4 = cross(aLng, aLat, bLng, bLat, dLng, dLat);
  return (d1 * d2 < 0) && (d3 * d4 < 0);
}

// Acute angle (0–90°) between movement vector (prev→listener) and the nearest
// segment of a LineString. 0 = perfectly parallel, 90 = perpendicular.
function nearestSegAngleDeg(listenerLng, listenerLat, prevLng, prevLat, coords) {
  const cosLat = Math.cos(listenerLat * Math.PI / 180);
  const mvx = (listenerLng - prevLng) * cosLat;
  const mvy = listenerLat - prevLat;
  const mvMag = Math.sqrt(mvx * mvx + mvy * mvy);
  if (mvMag < 1e-10) return 90;
  let minDist = Infinity;
  let bestAngle = 90;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = pointToSegmentDistance(
      listenerLng, listenerLat,
      coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1],
    );
    if (d < minDist) {
      minDist = d;
      const sx = (coords[i + 1][0] - coords[i][0]) * cosLat;
      const sy = coords[i + 1][1] - coords[i][1];
      const sMag = Math.sqrt(sx * sx + sy * sy);
      if (sMag < 1e-10) continue;
      const dot = Math.abs(mvx * sx + mvy * sy);
      let angle = Math.acos(Math.min(1, dot / (mvMag * sMag))) * 180 / Math.PI;
      if (angle > 90) angle = 180 - angle;
      bestAngle = angle;
    }
  }
  return bestAngle;
}

// Extend a proximityLines result array with crossing + alongside flags.
// canDetect = hasPrev && moveDist > MIN_MOVE_METRES; culledFeatures must align with results by index.
function extendLinesWithMovement(results, culledFeatures, canDetect, prevLng, prevLat, curLng, curLat) {
  const ALONGSIDE_RADIUS = 20;
  const ALONGSIDE_ANGLE  = 35;
  return results.map((result, i) => {
    const coords = culledFeatures[i].coords;
    let crossing  = false;
    let alongside = false;
    if (canDetect) {
      for (let s = 0; s < coords.length - 1 && !crossing; s++) {
        crossing = segsCross(prevLng, prevLat, curLng, curLat,
          coords[s][0], coords[s][1], coords[s + 1][0], coords[s + 1][1]);
      }
      if (!crossing && result.dist <= ALONGSIDE_RADIUS) {
        alongside = nearestSegAngleDeg(curLng, curLat, prevLng, prevLat, coords) < ALONGSIDE_ANGLE;
      }
    }
    return { ...result, crossing, alongside };
  });
}

// Pre-compute sewage pipe-endpoint clusters as junction points.
// A junction is where ≥2 pipe endpoints fall within THRESH metres of each other.
function computeSewageJunctions(pipes, thresh = 8) {
  const pts = [];
  for (const p of pipes) {
    const c = p.coords;
    pts.push([c[0][0], c[0][1]]);
    pts.push([c[c.length - 1][0], c[c.length - 1][1]]);
  }
  const latDelta = thresh / 111320;
  const merged   = new Uint8Array(pts.length);
  const junctions = [];
  for (let i = 0; i < pts.length; i++) {
    if (merged[i]) continue;
    const cluster = [i];
    for (let j = i + 1; j < pts.length; j++) {
      if (merged[j]) continue;
      if (Math.abs(pts[j][1] - pts[i][1]) > latDelta) continue;
      if (haversineDistance(pts[i][0], pts[i][1], pts[j][0], pts[j][1]) <= thresh) cluster.push(j);
    }
    cluster.forEach(k => (merged[k] = 1));
    if (cluster.length >= 2) {
      junctions.push({
        id:  `sj-${junctions.length}`,
        lng: cluster.reduce((s, k) => s + pts[k][0], 0) / cluster.length,
        lat: cluster.reduce((s, k) => s + pts[k][1], 0) / cluster.length,
      });
    }
  }
  return junctions;
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

    waterPipes    = parseLineFeatures(waterJson, 'pipe', 'water-pipe');
    // LKZ1322 = hydrants (above-ground, visible) — excluded from audio triggers
    const waterJsonNoHydrants = { ...waterJson, features: waterJson.features.filter(f => f.properties.layer !== 'LKZ1322-MSU-') };
    waterFittings = parsePointFeatures(waterJsonNoHydrants, 'fitting', 'water-fit');
    (window.appendLog || console.log)(
      `  lk-water: ${waterJson.features.length} total → ${waterPipes.length} pipes + ${waterFittings.length} fittings (${waterJson.features.length - waterPipes.length - waterFittings.length} excluded)`, 'linf'
    );

    sewagePipes     = parseLineFeatures(sewageJson, 'pipe', 'sewage-pipe');
    sewageJunctions = computeSewageJunctions(sewagePipes);
    (window.appendLog || console.log)(
      `  lk-sewage: ${sewageJson.features.length} total → ${sewagePipes.length} pipes + ${sewageJunctions.length} junctions (${sewageJson.features.length - sewagePipes.length} excluded)`, 'linf'
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

    // Extend water + sewage pipes with crossing/alongside using prev listener position
    const MIN_MOVE_METRES = 0.5;
    const hasPrev   = _prevCalcLat !== null;
    const moveDist  = hasPrev ? haversineDistance(_prevCalcLng, _prevCalcLat, listenerLng, listenerLat) : 0;
    const canDetect = hasPrev && moveDist > MIN_MOVE_METRES;

    const culledWaterPipes    = cullLines(waterPipes, b);
    const culledSewagePipes   = cullLines(sewagePipes, b);
    const culledElecCables    = cullLines(elecCables, b);
    const culledTelecomCables = cullLines(telecomCables, b);
    const culledFernPipes     = cullLines(fernwaermePipes, b);

    const waterPipeResults  = extendLinesWithMovement(
      proximityLines(listenerLng, listenerLat, culledWaterPipes,  WATER_PIPE_RADIUS),
      culledWaterPipes,  canDetect, _prevCalcLng, _prevCalcLat, listenerLng, listenerLat,
    );
    const sewagePipeResults = extendLinesWithMovement(
      proximityLines(listenerLng, listenerLat, culledSewagePipes, SEWAGE_PIPE_RADIUS),
      culledSewagePipes, canDetect, _prevCalcLng, _prevCalcLat, listenerLng, listenerLat,
    );
    const elecCableResults  = extendLinesWithMovement(
      proximityLines(listenerLng, listenerLat, culledElecCables,  ELEC_CABLE_RADIUS),
      culledElecCables,  canDetect, _prevCalcLng, _prevCalcLat, listenerLng, listenerLat,
    );
    const telecomCableResults = extendLinesWithMovement(
      proximityLines(listenerLng, listenerLat, culledTelecomCables, TELECOM_CABLE_RADIUS),
      culledTelecomCables, canDetect, _prevCalcLng, _prevCalcLat, listenerLng, listenerLat,
    );
    const fernPipeResults   = extendLinesWithMovement(
      proximityLines(listenerLng, listenerLat, culledFernPipes, FERNWAERME_PIPE_RADIUS),
      culledFernPipes, canDetect, _prevCalcLng, _prevCalcLat, listenerLng, listenerLat,
    ).map((result, i) => ({
      ...result,
      bearing: nearestSegmentBearing(listenerLng, listenerLat, culledFernPipes[i].coords),
    }));

    _prevCalcLat = listenerLat;
    _prevCalcLng = listenerLng;

    return {
      substations: substationResults,
      feeders: feederResults,
      nearestPowerlineDist,
      water: {
        pipes:    waterPipeResults,
        fittings: proximityPoints(listenerLng, listenerLat, cullPoints(waterFittings, b), WATER_FITTING_RADIUS),
      },
      sewage: {
        pipes:     sewagePipeResults,
        junctions: proximityPoints(listenerLng, listenerLat, cullPoints(sewageJunctions, b), SEWAGE_JUNCTION_RADIUS),
      },
      electricity: {
        nodes:  proximityPoints(listenerLng, listenerLat, cullPoints(elecNodes, b), ELEC_NODE_RADIUS),
        cables: elecCableResults,
      },
      telecom: {
        nodes:  proximityPoints(listenerLng, listenerLat, cullPoints(telecomNodes, b),  TELECOM_NODE_RADIUS),
        cables: telecomCableResults,
      },
      fernwaerme: {
        pipes: fernPipeResults,
      },
    };
  },
};

export default ProximityEngine;
