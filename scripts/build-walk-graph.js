#!/usr/bin/env node
'use strict';
/**
 * build-walk-graph.js
 *
 * Builds a street-like walk graph for src/sim-walker.js (the simulated-walk
 * feature, index.html's "Simulate Walk" toggle) from the water-pipe LineStrings
 * in public/lk-water.geojson — water mains follow streets, so they're a cheap
 * stand-in for a real street-centreline dataset we don't have.
 *
 * Output: public/data/processed/walk-graph.json (committed — the browser does
 * not build this at runtime).
 *
 * MUST BE REGENERATED whenever a new GeoShop tile delivery changes
 * public/lk-water.geojson (this script is NOT hooked into import-new-tiles.js
 * or extract-lk-geojson.js — run it by hand after extracting new water tiles).
 *
 * Pipeline: load pipe LineStrings -> clip to BBOX -> snap vertices to a ~1m
 * grid (so touching/overlapping pipe segments share a node) -> dedupe edges ->
 * keep only the largest connected component -> iteratively prune dead-end
 * spurs shorter than MIN_SPUR_M (mostly house connections running a few
 * metres off the main into a building) -> write compact JSON.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_FILE = path.join(__dirname, '..', 'public', 'lk-water.geojson');
const OUT_FILE = path.join(__dirname, '..', 'public', 'data', 'processed', 'walk-graph.json');

// Stadelhofen-to-HB area: the STOPS coordinates from
// Archive/simulation/listener-engine.js (Stadelhofen, Bellevue, Paradeplatz,
// Rennweg, Bahnhofstrasse/HB, Bürkliplatz), expanded by ~150m margin on every
// side. Not re-derived from those coordinates at runtime — fixed here so the
// clipped network (and therefore the graph) doesn't silently shift if that
// file's STOPS ever change.
const BBOX = { minLat: 47.3649, maxLat: 47.3776, minLng: 8.5365, maxLng: 8.5504 };

const SNAP_M = 1;        // grid size for snapping pipe vertices into shared nodes
const MIN_SPUR_M = 25;   // dead-end spurs shorter than this are pruned

// Stops to report nearest-node distance for (Archive/simulation/listener-engine.js STOPS).
const STOPS = [
  { name: 'Stadelhofen', lat: 47.3663, lng: 8.5484 },
  { name: 'Bellevue', lat: 47.36708, lng: 8.545112 },
  { name: 'Paradeplatz', lat: 47.369721, lng: 8.538917 },
  { name: 'Rennweg', lat: 47.373054, lng: 8.538456 },
  { name: 'Bahnhofstrasse/HB', lat: 47.376211, lng: 8.539462 },
];
const FLAG_STOP_DIST_M = 40;
const WARN_LARGEST_COMPONENT_SHARE = 0.80;

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function inBbox(lat, lng) {
  return lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng;
}

// ─── Load pipes ──────────────────────────────────────────────────────────────
const gj = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
const pipes = gj.features.filter((f) => f.properties.geomType === 'pipe');
console.log(`Loaded ${gj.features.length} water features, ${pipes.length} pipes (fittings excluded)`);

// ─── Snap vertices to a ~1m grid ─────────────────────────────────────────────
// Grid cell size in degrees, using the bbox's centre latitude for the
// lng->metres scale factor — negligible distortion over a ~1.4km bbox.
const refLat = (BBOX.minLat + BBOX.maxLat) / 2;
const latStep = SNAP_M / 111320;
const lngStep = SNAP_M / (111320 * Math.cos(refLat * Math.PI / 180));

const cellAcc = new Map(); // cellKey -> { sLat, sLng, n }
function addPoint(lat, lng) {
  const key = Math.round(lat / latStep) + '_' + Math.round(lng / lngStep);
  if (!cellAcc.has(key)) cellAcc.set(key, { sLat: 0, sLng: 0, n: 0 });
  const c = cellAcc.get(key);
  c.sLat += lat; c.sLng += lng; c.n += 1;
  return key;
}

// GeoJSON coordinates are [lng, lat] — converted to (lat, lng) immediately on
// read so every function from here on takes (lat, lng), matching the rest of
// this codebase's convention.
const rawEdgeKeys = []; // [cellKeyA, cellKeyB]
let segmentsTotal = 0, segmentsKept = 0;
for (const f of pipes) {
  const coords = f.geometry.coordinates;
  for (let i = 0; i < coords.length - 1; i++) {
    segmentsTotal++;
    const latA = coords[i][1], lngA = coords[i][0];
    const latB = coords[i + 1][1], lngB = coords[i + 1][0];
    // Clip: keep a segment only if both endpoints are inside BBOX. This drops
    // (rather than interpolates) segments that cross the boundary — a
    // reasonable approximation at this scale, and the dead-end pruning pass
    // below cleans up any short stubs this leaves at the boundary anyway.
    if (!inBbox(latA, lngA) || !inBbox(latB, lngB)) continue;
    segmentsKept++;
    const ka = addPoint(latA, lngA);
    const kb = addPoint(latB, lngB);
    if (ka !== kb) rawEdgeKeys.push([ka, kb]);
  }
}
console.log(`Pipe segments: ${segmentsTotal} total, ${segmentsKept} kept after clipping to bbox`);

// ─── Canonical node list ─────────────────────────────────────────────────────
const cellKeys = [...cellAcc.keys()];
const nodeIndexOf = new Map(cellKeys.map((k, i) => [k, i]));
const nodes = cellKeys.map((k) => {
  const { sLat, sLng, n } = cellAcc.get(k);
  return { lat: sLat / n, lng: sLng / n };
});
console.log(`Snapped to ${nodes.length} nodes (grid ~${SNAP_M}m)`);

// ─── Dedupe edges ─────────────────────────────────────────────────────────────
const edgeMap = new Map(); // "a_b" (a<b) -> { a, b, len }
for (const [ka, kb] of rawEdgeKeys) {
  const i = nodeIndexOf.get(ka), j = nodeIndexOf.get(kb);
  if (i === j) continue;
  const a = Math.min(i, j), b = Math.max(i, j);
  const key = a + '_' + b;
  if (!edgeMap.has(key)) {
    const len = haversine(nodes[a].lat, nodes[a].lng, nodes[b].lat, nodes[b].lng);
    edgeMap.set(key, { a, b, len });
  }
}
let edges = [...edgeMap.values()];
console.log(`Deduped to ${edges.length} edges`);

// ─── Connected components (before pruning) ───────────────────────────────────
class DSU {
  constructor(n) { this.p = Array.from({ length: n }, (_, i) => i); this.r = new Array(n).fill(0); }
  find(x) { while (this.p[x] !== x) { this.p[x] = this.p[this.p[x]]; x = this.p[x]; } return x; }
  union(a, b) {
    a = this.find(a); b = this.find(b); if (a === b) return;
    if (this.r[a] < this.r[b]) { const t = a; a = b; b = t; }
    this.p[b] = a; if (this.r[a] === this.r[b]) this.r[a]++;
  }
}
const dsu = new DSU(nodes.length);
for (const e of edges) dsu.union(e.a, e.b);

const compLength = new Map(); // root -> total edge length
for (const e of edges) {
  const root = dsu.find(e.a);
  compLength.set(root, (compLength.get(root) || 0) + e.len);
}
const allRoots = new Set(nodes.map((_, i) => dsu.find(i)));
const numComponentsBeforePruning = allRoots.size;

let totalClippedLength = 0;
for (const e of edges) totalClippedLength += e.len;

let largestRoot = null, largestLen = -1;
for (const [root, len] of compLength) { if (len > largestLen) { largestLen = len; largestRoot = root; } }

console.log(`Components before pruning: ${numComponentsBeforePruning}`);
console.log(`Total clipped network length: ${totalClippedLength.toFixed(0)}m`);
console.log(`Largest component length: ${largestLen.toFixed(0)}m (${(100 * largestLen / totalClippedLength).toFixed(1)}% of total)`);
if (largestLen / totalClippedLength < WARN_LARGEST_COMPONENT_SHARE) {
  console.warn(`WARNING: largest connected component covers only ${(100 * largestLen / totalClippedLength).toFixed(1)}% of the total clipped network length (< ${WARN_LARGEST_COMPONENT_SHARE * 100}%)`);
}

// Keep only the largest component, remapped to contiguous 0..k-1 indices.
const keepOldIdx = [];
for (let i = 0; i < nodes.length; i++) if (dsu.find(i) === largestRoot) keepOldIdx.push(i);
const oldToNew = new Map(keepOldIdx.map((oldI, newI) => [oldI, newI]));
let compNodes = keepOldIdx.map((oldI) => nodes[oldI]);
let compEdges = edges
  .filter((e) => oldToNew.has(e.a) && oldToNew.has(e.b))
  .map((e) => ({ a: oldToNew.get(e.a), b: oldToNew.get(e.b), len: e.len }));

console.log(`Largest component: ${compNodes.length} nodes, ${compEdges.length} edges`);

// ─── Prune dead-end spurs shorter than MIN_SPUR_M, iteratively ──────────────
function pruneDeadEnds(nodeCount, inEdges, minLen) {
  let aliveNodes = new Set(Array.from({ length: nodeCount }, (_, i) => i));
  let aliveEdges = new Set(inEdges.map((_, i) => i));
  let passes = 0;
  let changedEver = false;

  for (;;) {
    const adj = new Map();
    for (const n of aliveNodes) adj.set(n, []);
    for (const idx of aliveEdges) {
      const e = inEdges[idx];
      adj.get(e.a).push({ to: e.b, len: e.len, edgeIdx: idx });
      adj.get(e.b).push({ to: e.a, len: e.len, edgeIdx: idx });
    }

    const leaves = [...aliveNodes].filter((n) => adj.get(n).length === 1);
    const nodesToRemove = new Set();
    const edgesToRemove = new Set();

    for (const leaf of leaves) {
      if (nodesToRemove.has(leaf)) continue; // consumed by the other end's trace already this pass

      let cur = leaf, prevEdgeIdx = -1, total = 0;
      const pathNodes = [leaf];
      const pathEdges = [];
      let terminal = null;

      for (;;) {
        const options = adj.get(cur).filter((o) => o.edgeIdx !== prevEdgeIdx);
        if (options.length === 0) { terminal = null; break; }
        const step = options[0];
        total += step.len;
        pathEdges.push(step.edgeIdx);
        prevEdgeIdx = step.edgeIdx;
        const nextDeg = adj.get(step.to).length;
        if (nextDeg !== 2) { terminal = step.to; break; } // junction (>=3) or another dead end (1)
        pathNodes.push(step.to);
        cur = step.to;
      }
      if (terminal === null) continue;

      if (total < minLen) {
        for (const pn of pathNodes) nodesToRemove.add(pn);
        for (const pe of pathEdges) edgesToRemove.add(pe);
        if (adj.get(terminal).length === 1) nodesToRemove.add(terminal); // isolated chain, no real junction to anchor to
      }
    }

    if (nodesToRemove.size === 0) break;
    changedEver = true;
    passes++;
    for (const n of nodesToRemove) aliveNodes.delete(n);
    for (const e of edgesToRemove) aliveEdges.delete(e);
  }

  const keepOld = [...aliveNodes].sort((x, y) => x - y);
  const remap = new Map(keepOld.map((oldI, newI) => [oldI, newI]));
  const outNodes = keepOld.map((oldI) => ({ oldI }));
  const outEdges = [...aliveEdges].map((idx) => inEdges[idx]).filter((e) => remap.has(e.a) && remap.has(e.b));
  return { keepOld, remap, outEdges, passes, changedEver };
}

const pruneResult = pruneDeadEnds(compNodes.length, compEdges, MIN_SPUR_M);
const finalNodes = pruneResult.keepOld.map((oldI) => compNodes[oldI]);
const finalEdges = pruneResult.outEdges.map((e) => ({
  a: pruneResult.remap.get(e.a), b: pruneResult.remap.get(e.b), len: e.len,
}));

console.log(`Pruning: ${pruneResult.passes} pass(es), ${pruneResult.changedEver ? 'changes made' : 'no changes needed'}`);
console.log(`After pruning: ${finalNodes.length} nodes, ${finalEdges.length} edges`);

const finalTotalLength = finalEdges.reduce((s, e) => s + e.len, 0);

// Dead ends remaining = degree-1 nodes in the final graph (real cul-de-sacs
// / spurs >= MIN_SPUR_M, not pruned away).
const finalDegree = new Array(finalNodes.length).fill(0);
for (const e of finalEdges) { finalDegree[e.a]++; finalDegree[e.b]++; }
const deadEndsRemaining = finalDegree.filter((d) => d === 1).length;

console.log('\n=== RESULT ===');
console.log(`Nodes: ${finalNodes.length}`);
console.log(`Edges: ${finalEdges.length}`);
console.log(`Total length: ${finalTotalLength.toFixed(0)}m`);
console.log(`Components before pruning: ${numComponentsBeforePruning}`);
console.log(`Dead ends remaining (spurs >= ${MIN_SPUR_M}m): ${deadEndsRemaining}`);

console.log('\nNearest final-graph node to each stop:');
for (const stop of STOPS) {
  let best = Infinity;
  for (const n of finalNodes) {
    const d = haversine(stop.lat, stop.lng, n.lat, n.lng);
    if (d < best) best = d;
  }
  const flag = best > FLAG_STOP_DIST_M ? '  <-- FLAGGED (> ' + FLAG_STOP_DIST_M + 'm)' : '';
  console.log(`  ${stop.name}: ${best.toFixed(1)}m${flag}`);
}

// ─── Write output ─────────────────────────────────────────────────────────────
const output = {
  generatedAt: new Date().toISOString(),
  sourceFile: 'public/lk-water.geojson',
  bbox: BBOX,
  snapMeters: SNAP_M,
  minSpurLengthM: MIN_SPUR_M,
  coordOrder: 'lat,lng', // NOT GeoJSON order — deliberate, matches this codebase's lat/lng convention
  nodes: finalNodes.map((n) => [Math.round(n.lat * 1e6) / 1e6, Math.round(n.lng * 1e6) / 1e6]),
  edges: finalEdges.map((e) => [e.a, e.b, Math.round(e.len * 10) / 10]),
};
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(output));
console.log(`\nSaved to ${OUT_FILE} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB)`);
