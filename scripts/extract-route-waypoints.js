#!/usr/bin/env node
/**
 * extract-route-waypoints.js
 *
 * Extracts a single ordered pedestrian path from the powerline GeoJSON.
 *
 * Route: Stadelhofen → Bellevue → Quaibrücke → Paradeplatz → Rennweg →
 *        Bahnhofstrasse/HB → Bürkliplatz
 *
 * The route genuinely retraces Bahnhofstrasse (goes north to HB terminus,
 * then returns south to Bürkliplatz). This is the actual audio walk topology.
 *
 * Strategy:
 *  1. Build graph from all LineString segments (snap within 5m to merge parallel tracks)
 *  2. A* stitch through forced stops: Stadelhofen→Bellevue→Paradeplatz→Rennweg→HB→Bürkliplatz
 *  3. Uniform downsample to 75 waypoints (RDP fails on U-shaped paths)
 *  4. Save result
 */

'use strict';
const fs = require('fs');

function haversine(a, b) {
  const R = 6371000;
  const dLat=(b[1]-a[1])*Math.PI/180, dLng=(b[0]-a[0])*Math.PI/180;
  const lat1=a[1]*Math.PI/180, lat2=b[1]*Math.PI/180;
  const x=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}
function pathLength(pts){let d=0;for(let i=1;i<pts.length;i++)d+=haversine(pts[i-1],pts[i]);return d;}

// ─── Load ─────────────────────────────────────────────────────────────────────
const inFile  = 'C:/Users/robin/Documents/GitHub/hidden-infrastructures-zurich/data/raw/route-tram-powerlines.geojson';
const outFile = 'C:/Users/robin/Documents/GitHub/hidden-infrastructures-zurich/data/processed/route-waypoints.json';
const gj = JSON.parse(fs.readFileSync(inFile,'utf8'));
console.log(`Loaded ${gj.features.length} features`);

// ─── Build graph ──────────────────────────────────────────────────────────────
const SNAP = 0.000025; // ~2.5m grid
const cellAcc=new Map();
function addPt(lng,lat){
  const k=`${Math.round(lng/SNAP)}_${Math.round(lat/SNAP)}`;
  if(!cellAcc.has(k))cellAcc.set(k,{ls:0,la:0,n:0});
  const c=cellAcc.get(k);c.ls+=lng;c.la+=lat;c.n++;return k;
}
const rawEdges=[];
for(const f of gj.features){
  const cs=f.geometry.coordinates;
  for(let i=0;i<cs.length-1;i++){
    const ka=addPt(cs[i][0],cs[i][1]),kb=addPt(cs[i+1][0],cs[i+1][1]);
    if(ka!==kb)rawEdges.push([ka,kb]);
  }
}
const nodeCoord=new Map();
for(const[k,{ls,la,n}] of cellAcc)nodeCoord.set(k,[ls/n,la/n]);

// Union-Find for 5m parallel-track merge
const par=new Map();
function find(k){let r=k;while(par.has(r))r=par.get(r);let c=k;while(par.has(c)){const nx=par.get(c);par.set(c,r);c=nx;}return r;}
function unite(a,b){const ra=find(a),rb=find(b);if(ra!==rb)par.set(ra,rb);}
const sorted=[...nodeCoord.keys()].sort((a,b)=>nodeCoord.get(a)[0]-nodeCoord.get(b)[0]);
for(let i=0;i<sorted.length;i++){
  const ki=sorted[i],[lngi,lati]=nodeCoord.get(ki);
  const lw=5/(111320*Math.cos(lati*Math.PI/180))*2;
  for(let j=i+1;j<sorted.length;j++){
    const kj=sorted[j];
    if(nodeCoord.get(kj)[0]-lngi>lw)break;
    if(haversine(nodeCoord.get(ki),nodeCoord.get(kj))<=5)unite(ki,kj);
  }
}
const canonAcc=new Map();
for(const k of nodeCoord.keys()){
  const p=find(k),[lng,lat]=nodeCoord.get(k);
  if(!canonAcc.has(p))canonAcc.set(p,{ls:0,la:0,n:0});
  const c=canonAcc.get(p);c.ls+=lng;c.la+=lat;c.n++;
}
const canon=new Map();
for(const[p,{ls,la,n}] of canonAcc)canon.set(p,[ls/n,la/n]);
console.log(`Canonical nodes: ${canon.size}`);

const adj=new Map();
for(const[ka,kb] of rawEdges){
  const pa=find(ka),pb=find(kb);if(pa===pb)continue;
  if(!adj.has(pa))adj.set(pa,new Set());
  if(!adj.has(pb))adj.set(pb,new Set());
  adj.get(pa).add(pb);adj.get(pb).add(pa);
}

// ─── A* ───────────────────────────────────────────────────────────────────────
function nearest(lng,lat){
  let best=null,bd=Infinity;
  for(const[k,[l,a]] of canon){const d=haversine([l,a],[lng,lat]);if(d<bd){bd=d;best=k;}}
  return{key:best,dist:bd,coord:canon.get(best)};
}
function aStarPath(sk,ek){
  if(sk===ek)return[sk];
  const[eLng,eLat]=canon.get(ek);
  const h=k=>{const[l,a]=canon.get(k);return haversine([l,a],[eLng,eLat]);};
  const gS=new Map([[sk,0]]),prev=new Map([[sk,null]]),vis=new Set();
  const pq=[[h(sk),sk]];
  while(pq.length>0){
    pq.sort((a,b)=>a[0]-b[0]);
    const[,cur]=pq.shift();
    if(vis.has(cur))continue;vis.add(cur);
    if(cur===ek)break;
    const gc=gS.get(cur),cc=canon.get(cur);
    for(const nb of(adj.get(cur)||[])){
      if(vis.has(nb))continue;
      const ng=gc+haversine(cc,canon.get(nb));
      if(!gS.has(nb)||ng<gS.get(nb)){gS.set(nb,ng);prev.set(nb,cur);pq.push([ng+h(nb),nb]);}
    }
  }
  if(!prev.has(ek))return null;
  const path=[];let c=ek;
  while(c!==null){path.unshift(c);c=prev.get(c)??null;}
  return path;
}

// ─── Stops ────────────────────────────────────────────────────────────────────
// Note: the route genuinely goes north to HB then south to Bürkliplatz —
// this is correct walk topology, not an error.
const STOPS = [
  { name: 'Stadelhofen', lat: 47.36630, lng: 8.54842 },
  { name: 'Bellevue',    lat: 47.36708, lng: 8.54511 },
  { name: 'Paradeplatz', lat: 47.36972, lng: 8.53892 },
  { name: 'Rennweg',     lat: 47.37305, lng: 8.53846 },
  { name: 'HB',          lat: 47.37621, lng: 8.53946 },
  { name: 'Bürkliplatz', lat: 47.36653, lng: 8.54078 },
];

console.log('\nNearest nodes to stops:');
const stopNodes = STOPS.map(s => {
  const n = nearest(s.lng, s.lat);
  console.log(`  ${s.name}: ${n.dist.toFixed(1)}m → [${n.coord.map(x=>x.toFixed(5))}]`);
  return {...s, ...n};
});

// ─── Stitch path ──────────────────────────────────────────────────────────────
console.log('\nA* sub-paths:');
const fullPathCoords = [];

for(let i=0;i<stopNodes.length-1;i++){
  const from=stopNodes[i],to=stopNodes[i+1];
  const sub=aStarPath(from.key,to.key);
  if(!sub||sub.length===0){
    console.log(`  ${from.name}→${to.name}: NO PATH`);
    continue;
  }
  const subCoords=sub.map(k=>canon.get(k));
  console.log(`  ${from.name}→${to.name}: ${sub.length} nodes, ${pathLength(subCoords).toFixed(0)}m`);
  if(fullPathCoords.length===0){
    fullPathCoords.push(...subCoords);
  } else {
    // Drop first point if it duplicates the last
    const last=fullPathCoords[fullPathCoords.length-1];
    const subStart=subCoords[0];
    const startIdx=(last[0]===subStart[0]&&last[1]===subStart[1])?1:0;
    fullPathCoords.push(...subCoords.slice(startIdx));
  }
}

console.log(`\nFull stitched path: ${fullPathCoords.length} nodes`);
console.log(`Total distance: ${pathLength(fullPathCoords).toFixed(0)}m`);

// ─── Downsample to ~75 waypoints using uniform spacing by arc-length ──────────
// (RDP is inappropriate here because the path retraces some geographic area,
//  which RDP would incorrectly simplify away)
const TARGET = 75;

// Build cumulative distances
const cumDist = [0];
for(let i=1;i<fullPathCoords.length;i++){
  cumDist.push(cumDist[i-1]+haversine(fullPathCoords[i-1],fullPathCoords[i]));
}
const totalLen = cumDist[cumDist.length-1];
const step = totalLen/(TARGET-1);

const waypoints = [];
let nextTarget = 0;
let j = 0;
for(let wi=0;wi<TARGET;wi++){
  const targetDist = wi*step;
  // Find the segment that contains this distance
  while(j<cumDist.length-2 && cumDist[j+1]<targetDist) j++;
  if(j>=fullPathCoords.length-1){
    waypoints.push(fullPathCoords[fullPathCoords.length-1]);
  } else {
    const segLen = cumDist[j+1]-cumDist[j];
    const t = segLen>0 ? (targetDist-cumDist[j])/segLen : 0;
    const a=fullPathCoords[j], b=fullPathCoords[j+1];
    waypoints.push([a[0]+t*(b[0]-a[0]), a[1]+t*(b[1]-a[1])]);
  }
}

// Round to 6dp
const roundedWaypoints = waypoints.map(([lng,lat])=>[
  Math.round(lng*1e6)/1e6,
  Math.round(lat*1e6)/1e6,
]);

const totalDistance = Math.round(pathLength(roundedWaypoints));

console.log('\n=== RESULT ===');
console.log(`Waypoints: ${roundedWaypoints.length}`);
console.log(`Total distance: ${totalDistance}m`);
console.log(`Start: [${roundedWaypoints[0]}]`);
console.log(`End:   [${roundedWaypoints[roundedWaypoints.length-1]}]`);

// Verify stop proximity
console.log('\nDistance from nearest waypoint to each stop:');
for(const stop of STOPS){
  let minD=Infinity;
  for(const wp of roundedWaypoints){
    const d=haversine(wp,[stop.lng,stop.lat]);
    if(d<minD)minD=d;
  }
  console.log(`  ${stop.name}: ${minD.toFixed(0)}m`);
}

// Show first and last 5 waypoints
console.log('\nFirst 5 waypoints:');
roundedWaypoints.slice(0,5).forEach((wp,i)=>console.log(`  [${i}] [${wp}]`));
console.log('Last 5 waypoints:');
roundedWaypoints.slice(-5).forEach((wp,i)=>console.log(`  [${TARGET-5+i}] [${wp}]`));

// ─── Write output ─────────────────────────────────────────────────────────────
const output = {
  waypoints: roundedWaypoints,
  totalDistance,
  waypointCount: roundedWaypoints.length,
};
fs.writeFileSync(outFile, JSON.stringify(output, null, 2));
console.log(`\nSaved to ${outFile}`);
