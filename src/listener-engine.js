// listener-engine.js — Simulates a listener walking the route.
// Pure logic module: no DOM dependencies. Requires fetch for route data.

const DEFAULT_SPEED_MPS = 5000 / 3600; // 5 km/h
const TICK_MS = 1000; // update every second

const STOPS = [
  { name: "Stadelhofen", lat: 47.3663, lng: 8.5484 },
  { name: "Bellevue", lat: 47.36708, lng: 8.545112 },
  { name: "Paradeplatz", lat: 47.369721, lng: 8.538917 },
  { name: "Rennweg", lat: 47.373054, lng: 8.538456 },
  { name: "Bahnhofstrasse/HB", lat: 47.376211, lng: 8.539462 },
  { name: "Bürkliplatz", lat: 47.366528, lng: 8.540784 },
];

// --- Internal state ---
let waypoints = null; // [[lng, lat], ...]
let segDists = null; // cumulative distance at each waypoint
let totalDistance = 0;
let distanceTravelled = 0;
let speedMps = DEFAULT_SPEED_MPS;
let intervalId = null;
const listeners = [];

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

function buildCumulativeDistances(wps) {
  const dists = [0];
  for (let i = 1; i < wps.length; i++) {
    const prev = wps[i - 1];
    const cur = wps[i];
    dists.push(dists[i - 1] + haversineDistance(prev[0], prev[1], cur[0], cur[1]));
  }
  return dists;
}

function interpolatePosition(dist) {
  if (dist <= 0) return { lat: waypoints[0][1], lng: waypoints[0][0], segIdx: 0 };
  if (dist >= totalDistance) {
    const last = waypoints[waypoints.length - 1];
    return { lat: last[1], lng: last[0], segIdx: waypoints.length - 2 };
  }
  // Binary search for the segment
  let lo = 0;
  let hi = segDists.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (segDists[mid] <= dist) lo = mid;
    else hi = mid;
  }
  const segLen = segDists[lo + 1] - segDists[lo];
  const t = segLen > 0 ? (dist - segDists[lo]) / segLen : 0;
  const a = waypoints[lo];
  const b = waypoints[lo + 1];
  return {
    lat: a[1] + (b[1] - a[1]) * t,
    lng: a[0] + (b[0] - a[0]) * t,
    segIdx: lo,
  };
}

function computeHeading(segIdx) {
  const a = waypoints[segIdx];
  const b = waypoints[Math.min(segIdx + 1, waypoints.length - 1)];
  const dLng = b[0] - a[0];
  const dLat = b[1] - a[1];
  let deg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return Math.round(deg);
}

function nearestStop(lat, lng) {
  let best = null;
  let bestDist = Infinity;
  for (const stop of STOPS) {
    const d = haversineDistance(lng, lat, stop.lng, stop.lat);
    if (d < bestDist) {
      bestDist = d;
      best = stop.name;
    }
  }
  return best;
}

function buildState() {
  const pos = interpolatePosition(distanceTravelled);
  return {
    lat: pos.lat,
    lng: pos.lng,
    progress: totalDistance > 0 ? distanceTravelled / totalDistance : 0,
    distanceTravelled: Math.round(distanceTravelled),
    totalDistance: Math.round(totalDistance),
    speed: speedMps,
    heading: computeHeading(pos.segIdx),
    nearestStop: nearestStop(pos.lat, pos.lng),
    isWalking: intervalId !== null,
  };
}

function notify() {
  const state = buildState();
  for (const cb of listeners) cb(state);
}

function tick() {
  distanceTravelled += speedMps; // 1 second * speed
  if (distanceTravelled >= totalDistance) {
    distanceTravelled = 0; // loop
    console.log("[ListenerEngine] Route complete, looping to start");
  }
  notify();
}

const ListenerEngine = {
  /** Load route waypoints from JSON. */
  async init(url = "data/processed/route-waypoints.json") {
    console.log("[ListenerEngine] Loading route...");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`[ListenerEngine] Failed to load route: ${res.status}`);
    const data = await res.json();
    waypoints = data.waypoints;
    segDists = buildCumulativeDistances(waypoints);
    totalDistance = segDists[segDists.length - 1];
    distanceTravelled = 0;
    console.log(
      `[ListenerEngine] Loaded ${waypoints.length} waypoints, ${Math.round(totalDistance)} m`,
    );
  },

  /** Begin auto-walk. */
  start() {
    if (intervalId !== null) return;
    intervalId = setInterval(tick, TICK_MS);
    notify();
  },

  /** Pause walk. */
  stop() {
    if (intervalId === null) return;
    clearInterval(intervalId);
    intervalId = null;
    notify();
  },

  /** Return to start of route. */
  reset() {
    distanceTravelled = 0;
    notify();
  },

  /** Current state snapshot. */
  getState() {
    return buildState();
  },

  /** Scrub to a position (0–1). */
  setProgress(p) {
    distanceTravelled = Math.max(0, Math.min(1, p)) * totalDistance;
    notify();
  },

  /** Set walking speed in m/s. */
  setSpeed(mps) {
    speedMps = mps;
  },

  /** Register update callback (fires every second while walking). */
  onUpdate(cb) {
    listeners.push(cb);
  },

  /** Route waypoints as [[lng, lat], ...] (available after init). */
  get waypoints() {
    return waypoints;
  },

  /** Stop coordinate list. */
  get stops() {
    return STOPS;
  },
};

export default ListenerEngine;
