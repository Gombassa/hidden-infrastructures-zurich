// listener-engine.js — Real GPS listener using navigator.geolocation + DeviceOrientationEvent.
// Preserves the onUpdate/getState interface. No simulation, no waypoints, no init().

const STOPS = [
  { name: "Stadelhofen", lat: 47.3663, lng: 8.5484 },
  { name: "Bellevue", lat: 47.36708, lng: 8.545112 },
  { name: "Paradeplatz", lat: 47.369721, lng: 8.538917 },
  { name: "Rennweg", lat: 47.373054, lng: 8.538456 },
  { name: "Bahnhofstrasse/HB", lat: 47.376211, lng: 8.539462 },
  { name: "Bürkliplatz", lat: 47.366528, lng: 8.540784 },
];

// --- Internal state ---
let lat = null;
let lng = null;
let heading = null;   // degrees from DeviceOrientationEvent, or GPS course
let speed = null;     // m/s from GPS, or null
let watchId = null;
let isActive = false;
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
  return {
    lat,
    lng,
    heading,
    speed,
    nearestStop: lat !== null ? nearestStop(lat, lng) : null,
    isWalking: isActive,
  };
}

function notify() {
  const state = buildState();
  for (const cb of listeners) cb(state);
}

function onPosition(pos) {
  lat = pos.coords.latitude;
  lng = pos.coords.longitude;
  speed = pos.coords.speed;       // m/s, may be null
  // Use GPS course when available and device orientation hasn't fired
  if (pos.coords.heading !== null && pos.coords.heading >= 0) {
    heading = Math.round(pos.coords.heading);
  }
  notify();
}

function onPositionError(err) {
  console.error('[ListenerEngine] GPS error:', err.message);
}

function onOrientation(evt) {
  // webkitCompassHeading is iOS; alpha (adjusted) covers Android
  if (evt.webkitCompassHeading != null) {
    heading = Math.round(evt.webkitCompassHeading);
  } else if (evt.absolute && evt.alpha != null) {
    heading = Math.round((360 - evt.alpha) % 360);
  }
  // No notify() here — GPS position drives the update cadence
}

const ListenerEngine = {
  /**
   * Request GPS permission and begin watching position + orientation.
   * Resolves when the first position fix arrives.
   */
  start() {
    if (isActive) return;
    if (!navigator.geolocation) {
      console.error('[ListenerEngine] Geolocation not available');
      return;
    }

    isActive = true;

    watchId = navigator.geolocation.watchPosition(onPosition, onPositionError, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    });

    // DeviceOrientationEvent — request permission on iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission()
        .then(result => {
          if (result === 'granted') {
            window.addEventListener('deviceorientation', onOrientation, true);
          }
        })
        .catch(err => console.warn('[ListenerEngine] Orientation permission denied:', err));
    } else {
      window.addEventListener('deviceorientation', onOrientation, true);
    }

    console.log('[ListenerEngine] GPS started');
  },

  /** Stop watching position and orientation. */
  stop() {
    if (!isActive) return;
    isActive = false;

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    window.removeEventListener('deviceorientation', onOrientation, true);

    notify();
    console.log('[ListenerEngine] GPS stopped');
  },

  /** Current state snapshot. */
  getState() {
    return buildState();
  },

  /** Register update callback — fires on each GPS position update. */
  onUpdate(cb) {
    listeners.push(cb);
  },

  /** Stop coordinate list. */
  get stops() {
    return STOPS;
  },
};

export default ListenerEngine;
