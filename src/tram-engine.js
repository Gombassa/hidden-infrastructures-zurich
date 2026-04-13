// tram-engine.js — Tram position engine extracted from tram-simulation-live.html
// Pure logic module: no DOM or Leaflet dependencies.

const TRAM_SPEED_MPS = 15000 / 3600; // ~15 km/h average
const UPDATE_INTERVAL = 10000; // 10 seconds (default)
let updateInterval = UPDATE_INTERVAL;

// ── WAYPOINT PATH ─────────────────────────────────────────────────────────────
// Loaded at start() time from /data/processed/route-waypoints.json.
// [[lng, lat], ...] — 75 uniformly-spaced waypoints tracing the walk route.
// Null until loaded; segments without coverage fall back to crow-fly lerp.
let waypoints = null;

// Stop name → index into the waypoints array.
//
// RENNWEG NOTE: The nearest-waypoint audit (2026-04-10) found wp[53] as the
// globally-nearest waypoint to Rennweg (lat 47.373054). wp[53] sits on the
// *southbound* return leg of the U-shaped path (HB→Bürkliplatz). The northbound
// pass through Rennweg is at wp[41] (lat 47.373202, ~21m off). Using wp[53] for
// the Paradeplatz→Rennweg segment would route the interpolated tram through the
// HB apex, adding ~560m of spurious path. wp[41] is used here instead.
//
// HB NOTE: wp[47] (lat 47.375005) is the northernmost waypoint, ~140m short of
// the actual Bahnhofstrasse/HB stop. The source powerline GeoJSON ends before the
// terminus. Known limitation — extend when source geometry is updated.
const STOP_WP_INDEX = {
  'Stadelhofen':       0,
  'Bellevue':          8,
  'Paradeplatz':       30,
  'Rennweg':           41,   // northbound pass — see note above
  'Bahnhofstrasse/HB': 47,   // ~140m short of terminus — see note above
  'Bürkliplatz':       74,
};

// Compute arc-length of waypoint sub-path from index a to index b (inclusive).
// Handles both forward (a < b) and reverse (a > b) traversal.
function waypointSubpathLength(a, b) {
  if (!waypoints || a === b) return 0;
  const step = a < b ? 1 : -1;
  let dist = 0;
  for (let i = a; step > 0 ? i < b : i > b; i += step) {
    const p = waypoints[i], q = waypoints[i + step];
    dist += haversineDistance(p[0], p[1], q[0], q[1]);
  }
  return dist;
}

// Interpolate a position along the waypoint sub-path from index a to index b.
// progress ∈ [0, 1]. Returns { lat, lng }.
function interpolateOnPath(a, b, progress) {
  const step = a < b ? 1 : -1;

  // Collect the indices for this sub-path
  const idxs = [];
  for (let i = a; step > 0 ? i <= b : i >= b; i += step) idxs.push(i);

  // Cumulative arc-length along sub-path
  const cum = [0];
  for (let i = 1; i < idxs.length; i++) {
    const p = waypoints[idxs[i - 1]], q = waypoints[idxs[i]];
    cum.push(cum[i - 1] + haversineDistance(p[0], p[1], q[0], q[1]));
  }
  const totalLen = cum[cum.length - 1];

  if (totalLen === 0 || idxs.length === 1) {
    const pt = waypoints[idxs[0]];
    return { lat: pt[1], lng: pt[0] };
  }

  const target = Math.max(0, Math.min(1, progress)) * totalLen;
  let seg = 0;
  while (seg < cum.length - 2 && cum[seg + 1] < target) seg++;

  const segLen = cum[seg + 1] - cum[seg];
  const t = segLen > 0 ? (target - cum[seg]) / segLen : 0;
  const p = waypoints[idxs[seg]], q = waypoints[idxs[seg + 1]];
  return {
    lat: p[1] + t * (q[1] - p[1]),
    lng: p[0] + t * (q[0] - p[0]),
  };
}

// Attach waypoint indices and an updatable distance field to each stop pair.
// distance is initialised from crow-fly; overwritten with waypoint arc-length at load time.
const stopPairs = [
  {
    stop_a: { name: 'Stadelhofen', lat: 47.3663,   lon: 8.5484   },
    stop_b: { name: 'Bellevue',    lat: 47.36708,  lon: 8.545112 },
    lines: ['11', '9'],
    distance: 262.2,
    wpA: STOP_WP_INDEX['Stadelhofen'], wpB: STOP_WP_INDEX['Bellevue'],
  },
  {
    stop_a: { name: 'Bellevue',    lat: 47.36708,  lon: 8.545112 },
    stop_b: { name: 'Paradeplatz', lat: 47.369721, lon: 8.538917 },
    lines: ['9', '2', '11'],
    distance: 551.2767153189958,
    wpA: STOP_WP_INDEX['Bellevue'], wpB: STOP_WP_INDEX['Paradeplatz'],
  },
  {
    stop_a: { name: 'Paradeplatz', lat: 47.369721, lon: 8.538917 },
    stop_b: { name: 'Rennweg',     lat: 47.373054, lon: 8.538456 },
    lines: ['11', '7', '13'],
    distance: 372.2351042681431,
    wpA: STOP_WP_INDEX['Paradeplatz'], wpB: STOP_WP_INDEX['Rennweg'],
  },
  {
    stop_a: { name: 'Rennweg',            lat: 47.373054, lon: 8.538456 },
    stop_b: { name: 'Bahnhofstrasse/HB',  lat: 47.376211, lon: 8.539462 },
    lines: ['11', '7', '13'],
    distance: 359.12296548993754,
    wpA: STOP_WP_INDEX['Rennweg'], wpB: STOP_WP_INDEX['Bahnhofstrasse/HB'],
  },
  {
    stop_a: { name: 'Bahnhofstrasse/HB', lat: 47.376211, lon: 8.539462 },
    stop_b: { name: 'Bürkliplatz',       lat: 47.366528, lon: 8.540784 },
    lines: ['11'],
    distance: 1081.2932229405578,
    wpA: STOP_WP_INDEX['Bahnhofstrasse/HB'], wpB: STOP_WP_INDEX['Bürkliplatz'],
  },
  {
    // Bürkliplatz → Opernhaus: outside waypoint coverage — crow-fly fallback.
    stop_a: { name: 'Bürkliplatz', lat: 47.366528, lon: 8.540784 },
    stop_b: { name: 'Opernhaus',   lat: 47.36541,  lon: 8.547646 },
    lines: ['11'],
    distance: 531.544846570331,
  },
  {
    // Opernhaus → Stockerstrasse: outside waypoint coverage — crow-fly fallback.
    stop_a: { name: 'Opernhaus',      lat: 47.36541,  lon: 8.547646 },
    stop_b: { name: 'Stockerstrasse', lat: 47.367856, lon: 8.535423 },
    lines: ['11', '2'],
    distance: 959.8877703544122,
  },
];

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

// Fetch waypoints and rewrite pair.distance for covered segments.
async function loadWaypoints() {
  try {
    const resp = await fetch('/data/processed/route-waypoints.json');
    const data = await resp.json();
    waypoints = data.waypoints; // [[lng, lat], ...]

    // Recompute arc-length distances for covered segments so travel-time is accurate.
    for (const pair of stopPairs) {
      if (pair.wpA !== undefined && pair.wpB !== undefined) {
        pair.distance = waypointSubpathLength(pair.wpA, pair.wpB);
      }
    }

    const log = window.appendLog || console.log;
    log(`[TramEngine] Waypoints loaded — ${waypoints.length} pts, arc-lengths updated`, 'lok');
    log(
      `[TramEngine] Segment distances (m): ` +
      stopPairs
        .filter(p => p.wpA !== undefined)
        .map(p => `${p.stop_a.name.split('/')[0]}→${p.stop_b.name.split('/')[0]}: ${Math.round(p.distance)}`)
        .join(' | '),
      'linf',
    );
  } catch (e) {
    (window.appendLog || console.warn)(`[TramEngine] Waypoint load failed — crow-fly fallback active: ${e.message}`, 'lerr');
    waypoints = null;
  }
}

async function fetchTramSchedule(stopName, lines) {
  const url = `https://transport.opendata.ch/v1/stationboard?station=${encodeURIComponent(stopName)}&limit=50`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const trams = [];
    for (const dep of data.stationboard || []) {
      if (dep.category === 'T' && lines.includes(dep.number)) {
        const delay = dep.stop?.delay || 0;
        const departureStr = dep.stop?.departure;

        if (departureStr) {
          const scheduled = new Date(departureStr);
          const actual = new Date(scheduled.getTime() + delay * 60000);

          trams.push({
            line: dep.number,
            destination: dep.to,
            scheduledTime: scheduled,
            actualTime: actual,
            delay: delay,
          });
        }
      }
    }

    return trams;
  } catch (error) {
    const msg = `[TramEngine] Error fetching schedule for ${stopName}: ${error.message}`;
    console.error(msg);
    window.dispatchEvent(new CustomEvent('tram-error', { detail: msg }));
    fetchFailed = true;
    return [];
  }
}

async function calculateTramPositions() {
  const now = new Date();
  const allTrams = [];

  for (const pair of stopPairs) {
    const travelTime = pair.distance / TRAM_SPEED_MPS;

    // Fetch schedules for stop A
    const departures = await fetchTramSchedule(`Zürich ${pair.stop_a.name}`, pair.lines);

    for (const tram of departures) {
      const departure = tram.actualTime;
      const arrival = new Date(departure.getTime() + travelTime * 1000);

      // Is tram currently between stops?
      if (departure <= now && now <= arrival) {
        const elapsed = (now - departure) / 1000;
        const progress = elapsed / travelTime;

        let lat, lng;
        if (waypoints && pair.wpA !== undefined && pair.wpB !== undefined) {
          // Interpolate along waypoint path geometry.
          const pos = interpolateOnPath(pair.wpA, pair.wpB, progress);
          lat = pos.lat;
          lng = pos.lng;
        } else {
          // Crow-fly fallback for segments outside waypoint coverage.
          lat = pair.stop_a.lat + (pair.stop_b.lat - pair.stop_a.lat) * progress;
          lng = pair.stop_a.lon + (pair.stop_b.lon - pair.stop_a.lon) * progress;
        }

        allTrams.push({
          line: tram.line,
          lat,
          lng,
          fromStop: pair.stop_a.name,
          toStop: pair.stop_b.name,
          progress,
          delay: tram.delay,
        });
      }
    }
  }

  return allTrams;
}

// ---------------------------------------------------------------------------
// TramEngine singleton
// ---------------------------------------------------------------------------

let state = { trams: [], lastUpdated: null, isStale: false };
let intervalId = null;
let fetchFailed = false;
let running = false;
const listeners = [];

async function tick() {
  fetchFailed = false;
  try {
    const trams = await calculateTramPositions();
    // Guard: stop() may have been called while fetches were in flight.
    if (!running) return;
    state = { trams, lastUpdated: new Date(), isStale: fetchFailed };
  } catch (error) {
    if (!running) return;
    const msg = `[TramEngine] Update failed, keeping last known positions: ${error.message}`;
    console.error(msg);
    window.dispatchEvent(new CustomEvent('tram-error', { detail: msg }));
    state = { ...state, isStale: true };
  }
  for (const cb of listeners) {
    cb(state);
  }
}

const TramEngine = {
  /** Begin the update loop. Loads waypoints first on the initial call. */
  start() {
    if (intervalId !== null) return;
    running = true;
    loadWaypoints().then(() => {
      if (!running) return; // stop() called while waypoints were loading
      tick();
      intervalId = setInterval(tick, updateInterval);
    });
  },

  /** Halt the update loop. */
  stop() {
    if (intervalId === null) return;
    running = false;
    clearInterval(intervalId);
    intervalId = null;
  },

  /** Return { trams, lastUpdated, isStale }. */
  getState() {
    return state;
  },

  /** Register a callback fired with the state object on every refresh. */
  onUpdate(cb) {
    listeners.push(cb);
  },

  /**
   * Compute the haversine distance (metres) from a point to every active tram.
   * @param {number} lat - Latitude of the reference point.
   * @param {number} lng - Longitude of the reference point.
   * @returns {Array<{tram: object, distance: number}>} Sorted nearest-first.
   */
  getDistanceToPoint(lat, lng) {
    return state.trams
      .map((tram) => ({
        tram,
        distance: haversineDistance(lng, lat, tram.lng, tram.lat),
      }))
      .sort((a, b) => a.distance - b.distance);
  },

  /** Change the update interval. Takes effect on next start(). */
  setUpdateInterval(ms) {
    updateInterval = ms;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = setInterval(tick, updateInterval);
    }
  },
};

export default TramEngine;

export {
  stopPairs,
  STOP_WP_INDEX,
  TRAM_SPEED_MPS,
  UPDATE_INTERVAL,
  haversineDistance,
  interpolateOnPath,
  fetchTramSchedule,
  calculateTramPositions,
};
