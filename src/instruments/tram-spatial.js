// tram-spatial.js — shared HRTF coordinate transform for tram instruments
// (feeder-crackle.js, tram-hiss-voice.js). Third shared-extraction module
// after pool-allocator.js and line-crossing-voice.js — extracted because both
// tram instruments need the identical formula, not preemptively.
//
// Ported verbatim from src/audio-layers.js's _feederToXYZ (~lines 144-159 at
// the time of porting), except this is a pure function taking listener state
// as parameters instead of production's module-closure
// _lastListenerLat/_lastListenerLng/_lastListenerHeading.
//
// INHERITED QUIRK, preserved not fixed: index.html's deviceorientation handler
// (lines ~213-222, out of scope for this rebuild) separately sets
// ctx.listener.forward{X,Y,Z} from the same device heading on every fix. So a
// feeder's panner position is computed in a heading-rotated frame via this
// function AND the listener's own orientation is independently heading-rotated
// by index.html. Whether this is a real double-rotation (sounds rotate twice
// as far as intended) or happens to cancel out depends on sign conventions
// neither this module nor audio-layers.js documents — it's a pre-existing
// production characteristic, not something Step 4 is scoped to resolve.

export function feederToXYZ(listenerLat, listenerLng, listenerHeading, feederLat, feederLng) {
  if (listenerLat === null || listenerLng === null || listenerHeading === null) {
    return { x: 0, y: 0, z: -1 };
  }
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(listenerLat * Math.PI / 180);
  const dNorth = (feederLat - listenerLat) * metersPerDegLat;
  const dEast  = (feederLng - listenerLng) * metersPerDegLng;
  const headingRad = listenerHeading * Math.PI / 180;
  const x =  dEast * Math.cos(headingRad) - dNorth * Math.sin(headingRad);
  const z = -(dEast * Math.sin(headingRad) + dNorth * Math.cos(headingRad));
  const dist = Math.sqrt(x * x + z * z) || 1;
  const scale = Math.min(dist, 500) / dist;
  return { x: x * scale / 500, y: 0, z: z * scale / 500 };
}

// Plain listener-to-point flat-earth distance in metres — used by both tram
// instruments to compute distance themselves, since ProximityEngine's feeder
// objects carry no `dist` field (only { id, lat, lng, triggered,
// triggeringTram } — triggered means "near a tram," not "near the listener").
export function flatEarthDist(lat1, lng1, lat2, lng2) {
  const dlat = (lat2 - lat1) * 111320;
  const dlng = (lng2 - lng1) * 111320 * Math.cos(lat1 * Math.PI / 180);
  return Math.sqrt(dlat * dlat + dlng * dlng);
}

// Stable per-feeder identity key, since ProximityEngine's feeder `id` is a
// pure array index (`tram-node-${n}`, proximity-engine.js) — unstable across
// GeoShop re-extraction — and no _dedupKey is exposed on feeder objects.
// Rounded coordinates are far finer-grained than feeder spacing, so the same
// physical feeder maps to the same key before and after re-extraction.
export function feederKey(lat, lng) {
  return lat.toFixed(6) + ',' + lng.toFixed(6);
}
