// tram-engine.js — Tram position engine extracted from tram-simulation-live.html
// Pure logic module: no DOM or Leaflet dependencies.

const TRAM_SPEED_MPS = 15000 / 3600; // ~15 km/h average
const UPDATE_INTERVAL = 10000; // 10 seconds (default)
let updateInterval = UPDATE_INTERVAL;

const stopPairs = [
  {
    stop_a: { name: "Bellevue", lat: 47.36708, lon: 8.545112 },
    stop_b: { name: "Paradeplatz", lat: 47.369721, lon: 8.538917 },
    lines: ["9", "2", "11"],
    distance: 551.2767153189958,
  },
  {
    stop_a: { name: "Paradeplatz", lat: 47.369721, lon: 8.538917 },
    stop_b: { name: "Rennweg", lat: 47.373054, lon: 8.538456 },
    lines: ["11", "7", "13"],
    distance: 372.2351042681431,
  },
  {
    stop_a: { name: "Rennweg", lat: 47.373054, lon: 8.538456 },
    stop_b: { name: "Bahnhofstrasse/HB", lat: 47.376211, lon: 8.539462 },
    lines: ["11", "7", "13"],
    distance: 359.12296548993754,
  },
  {
    stop_a: { name: "Bahnhofstrasse/HB", lat: 47.376211, lon: 8.539462 },
    stop_b: { name: "Bürkliplatz", lat: 47.366528, lon: 8.540784 },
    lines: ["11"],
    distance: 1081.2932229405578,
  },
  {
    stop_a: { name: "Bürkliplatz", lat: 47.366528, lon: 8.540784 },
    stop_b: { name: "Opernhaus", lat: 47.36541, lon: 8.547646 },
    lines: ["11"],
    distance: 531.544846570331,
  },
  {
    stop_a: { name: "Opernhaus", lat: 47.36541, lon: 8.547646 },
    stop_b: { name: "Stockerstrasse", lat: 47.367856, lon: 8.535423 },
    lines: [],
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

async function fetchTramSchedule(stopName, lines) {
  const url = `https://transport.opendata.ch/v1/stationboard?station=Zürich, ${encodeURIComponent(stopName)}&limit=50`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const trams = [];
    for (const dep of data.stationboard || []) {
      if (dep.category === "T" && lines.includes(dep.number)) {
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
    console.error(`[TramEngine] Error fetching schedule for ${stopName}:`, error);
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
    const departures = await fetchTramSchedule(pair.stop_a.name, pair.lines);

    for (const tram of departures) {
      const departure = tram.actualTime;
      const arrival = new Date(departure.getTime() + travelTime * 1000);

      // Is tram currently between stops?
      if (departure <= now && now <= arrival) {
        const elapsed = (now - departure) / 1000;
        const progress = elapsed / travelTime;

        // Interpolate position
        const lat =
          pair.stop_a.lat + (pair.stop_b.lat - pair.stop_a.lat) * progress;
        const lon =
          pair.stop_a.lon + (pair.stop_b.lon - pair.stop_a.lon) * progress;

        allTrams.push({
          line: tram.line,
          lat: lat,
          lng: lon,
          fromStop: pair.stop_a.name,
          toStop: pair.stop_b.name,
          progress: progress,
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
const listeners = [];

async function tick() {
  fetchFailed = false;
  try {
    const trams = await calculateTramPositions();
    state = { trams, lastUpdated: new Date(), isStale: fetchFailed };
  } catch (error) {
    console.error("[TramEngine] Update failed, keeping last known positions:", error);
    state = { ...state, isStale: true };
  }
  for (const cb of listeners) {
    cb(state);
  }
}

const TramEngine = {
  /** Begin the 10-second update loop. Safe to call if already running. */
  start() {
    if (intervalId !== null) return;
    tick();
    intervalId = setInterval(tick, updateInterval);
  },

  /** Halt the update loop. */
  stop() {
    if (intervalId === null) return;
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
  TRAM_SPEED_MPS,
  UPDATE_INTERVAL,
  haversineDistance,
  fetchTramSchedule,
  calculateTramPositions,
};
