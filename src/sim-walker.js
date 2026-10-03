// sim-walker.js — randomised simulated walk (feature/simulated-walk), so the
// app can be exercised away from Zürich. Moves a synthetic listener along the
// street-like graph built offline by scripts/build-walk-graph.js from
// public/lk-water.geojson's pipe LineStrings (water mains follow streets) —
// see public/data/processed/walk-graph.json. Pure logic, no DOM dependencies,
// same convention as src/proximity-engine.js / src/tram-engine.js.
//
// API: start(onFix, onHeading), stop(), isRunning(). While running, emits one
// fix ({ lat, lng, speed, accuracy }) and one heading (degrees, [0,360)) per
// second via setInterval. No seeding option — every start() randomises fresh:
// a random start node, a random pace (drifting slowly within [1.1, 1.6] m/s),
// random turn choices at junctions (weighted toward continuing straight on),
// and a smooth random lateral offset either side of the pipe centreline
// (bounded to ±4m, standing in for a pavement/street-width offset).
//
// index.html is the only caller — it wires start()'s onFix/onHeading straight
// into the same handleFix()/handleHeading() the real GPS/compass use, so
// everything downstream (map marker, ProximityEngine, InstrumentLayers,
// overlays, mixer) is unchanged and doesn't know whether a fix is real or
// simulated.

const GRAPH_URL = '/data/processed/walk-graph.json';
const TICK_MS = 1000;

const PACE_MIN = 1.1, PACE_MAX = 1.6;     // m/s
const PACE_DRIFT_STEP = 0.03;             // m/s change per tick, random walk within [PACE_MIN, PACE_MAX]

const LATERAL_MAX_M = 4;                  // pavement offset bound, either side of the pipe centreline
const LATERAL_DRIFT_STEP = 0.3;           // m change per tick, random walk within [-LATERAL_MAX_M, LATERAL_MAX_M]

const STRAIGHT_WEIGHT = 0.6;              // probability mass given to the most-straight-on option at a junction
const UTURN_RARE_P = 0.02;                // chance of a deliberate U-turn at a junction that isn't a dead end

const HEADING_SMOOTH_T = 0.35;            // per-tick lerp factor toward the current edge's bearing

function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

function bearingDeg(lat1, lng1, lat2, lng2) {
  const phi1 = lat1 * Math.PI / 180, phi2 = lat2 * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

// Shortest-arc lerp between two headings (so e.g. 350deg -> 10deg takes the
// 20deg route through 360/0, not the 340deg route backwards).
function lerpAngleDeg(from, to, t) {
  const diff = ((to - from + 540) % 360) - 180;
  return (from + diff * t + 360) % 360;
}

// Flat-earth offset — fine at the few-metre scale this is used for (the
// lateral pavement offset), same approximation src/instruments/tram-spatial.js
// and others already use for small distances.
function offsetLatLng(lat, lng, bearingDegVal, distanceM) {
  const bearingRad = bearingDegVal * Math.PI / 180;
  const dNorth = distanceM * Math.cos(bearingRad);
  const dEast = distanceM * Math.sin(bearingRad);
  return {
    lat: lat + dNorth / 111320,
    lng: lng + dEast / (111320 * Math.cos(lat * Math.PI / 180)),
  };
}

let graph = null;      // { nodes: [[lat,lng],...], edges: [[a,b,lenM],...] }
let adjacency = null;  // Map<nodeIdx, Array<{ to, len, edgeIdx }>>
let timer = null;
let running = false;

// Per-run state
let pace = 0;
let lateralOffset = 0;
let curA = 0, curB = 0;   // current edge, travelling from curA toward curB
let curEdgeLen = 0;
let distAlong = 0;        // metres travelled from curA on the current edge
let heading = 0;

function buildAdjacency() {
  adjacency = new Map();
  for (let i = 0; i < graph.nodes.length; i++) adjacency.set(i, []);
  graph.edges.forEach(([a, b, len], edgeIdx) => {
    adjacency.get(a).push({ to: b, len, edgeIdx });
    adjacency.get(b).push({ to: a, len, edgeIdx });
  });
}

function pickWeightedByStraightness(candidates, hubIdx, cameFromIdx) {
  if (candidates.length === 1) return candidates[0];
  const [hubLat, hubLng] = graph.nodes[hubIdx];
  const [fromLat, fromLng] = graph.nodes[cameFromIdx];
  const inBearing = bearingDeg(fromLat, fromLng, hubLat, hubLng);

  const angles = candidates.map((c) => {
    const [toLat, toLng] = graph.nodes[c.to];
    const outBearing = bearingDeg(hubLat, hubLng, toLat, toLng);
    return Math.abs(((outBearing - inBearing + 540) % 360) - 180); // 0 = straight, 180 = reversal
  });
  let straightestIdx = 0;
  for (let i = 1; i < angles.length; i++) if (angles[i] < angles[straightestIdx]) straightestIdx = i;

  const rest = (1 - STRAIGHT_WEIGHT) / (candidates.length - 1);
  const weights = candidates.map((_, i) => (i === straightestIdx ? STRAIGHT_WEIGHT : rest));

  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < candidates.length; i++) {
    cum += weights[i];
    if (r <= cum) return candidates[i];
  }
  return candidates[candidates.length - 1]; // floating-point fallback
}

function arriveAtNode(hub, cameFrom) {
  const options = adjacency.get(hub);
  let candidates = options.filter((o) => o.to !== cameFrom);
  let isUTurn = false;

  if (candidates.length === 0) {
    // Dead end (degree 1) — the only option is back the way we came.
    candidates = options;
    isUTurn = true;
  } else if (Math.random() < UTURN_RARE_P) {
    const back = options.filter((o) => o.to === cameFrom);
    if (back.length > 0) { candidates = back; isUTurn = true; }
  }

  const chosen = isUTurn ? candidates[0] : pickWeightedByStraightness(candidates, hub, cameFrom);
  curA = hub;
  curB = chosen.to;
  curEdgeLen = chosen.len;
  distAlong = 0;
}

function advance(distanceM) {
  let remaining = distanceM;
  let guard = 0;
  while (remaining > 0) {
    if (++guard > 10000) break; // defensive — should never trip on a real graph
    const spaceLeft = curEdgeLen - distAlong;
    if (remaining < spaceLeft) {
      distAlong += remaining;
      remaining = 0;
    } else {
      remaining -= spaceLeft;
      arriveAtNode(curB, curA);
    }
  }
}

function initRandomRun() {
  pace = PACE_MIN + Math.random() * (PACE_MAX - PACE_MIN);
  lateralOffset = (Math.random() * 2 - 1) * LATERAL_MAX_M * 0.5; // start somewhere inside the bound, not pinned to it

  const startNode = Math.floor(Math.random() * graph.nodes.length);
  const options = adjacency.get(startNode);
  const first = options[Math.floor(Math.random() * options.length)];
  curA = startNode;
  curB = first.to;
  curEdgeLen = first.len;
  distAlong = 0;

  const [latA, lngA] = graph.nodes[curA];
  const [latB, lngB] = graph.nodes[curB];
  heading = bearingDeg(latA, lngA, latB, lngB);
}

function currentFixAndHeading() {
  const [latA, lngA] = graph.nodes[curA];
  const [latB, lngB] = graph.nodes[curB];
  const t = curEdgeLen > 0 ? distAlong / curEdgeLen : 0;
  const centreLat = latA + (latB - latA) * t;
  const centreLng = lngA + (lngB - lngA) * t;
  const edgeBearing = bearingDeg(latA, lngA, latB, lngB);

  heading = lerpAngleDeg(heading, edgeBearing, HEADING_SMOOTH_T);

  const perp = (edgeBearing + 90) % 360;
  const { lat, lng } = offsetLatLng(centreLat, centreLng, perp, lateralOffset);
  return { lat, lng, heading };
}

function tick(onFix, onHeading) {
  pace = clamp(pace + (Math.random() * 2 - 1) * PACE_DRIFT_STEP, PACE_MIN, PACE_MAX);
  advance(pace * (TICK_MS / 1000));

  lateralOffset = clamp(lateralOffset + (Math.random() * 2 - 1) * LATERAL_DRIFT_STEP, -LATERAL_MAX_M, LATERAL_MAX_M);

  const { lat, lng, heading: h } = currentFixAndHeading();
  onFix({ lat, lng, speed: pace, accuracy: 5 });
  onHeading(h);
}

function start(onFix, onHeading) {
  if (running) return;
  running = true;
  fetch(GRAPH_URL)
    .then((r) => r.json())
    .then((g) => {
      if (!running) return; // stop() was called before the fetch resolved
      graph = g;
      buildAdjacency();
      initRandomRun();
      tick(onFix, onHeading); // first fix immediately, not after a full second's delay
      timer = setInterval(() => tick(onFix, onHeading), TICK_MS);
    })
    .catch((err) => {
      running = false;
      console.error('[SimWalker] failed to load walk graph:', err);
    });
}

function stop() {
  running = false;
  if (timer !== null) { clearInterval(timer); timer = null; }
  graph = null;
  adjacency = null;
}

function isRunning() {
  return running;
}

export default { start, stop, isRunning };
