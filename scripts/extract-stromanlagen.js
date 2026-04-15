#!/usr/bin/env node
/**
 * extract-stromanlagen.js
 *
 * Processes ewz Stromanlagen OGD DXF deliveries (EN_STROMANLAGEN_P + EN_STROMLEITUNGEN_L)
 * into a GeoJSON file for use in the Hidden Infrastructures app.
 *
 * Handles POINT and LWPOLYLINE entity types in LV95 (EPSG:2056) → WGS84.
 *
 * Usage:
 *   node scripts/extract-stromanlagen.js <dxf-file> <output.geojson>
 *
 * Example:
 *   node scripts/extract-stromanlagen.js \
 *     "data/raw/Stromanlagem_OGD 2/Stromanlagen_-OGD/Stromanlagen_-OGD.dxf" \
 *     data/processed/lk/lk-stromanlagen.geojson
 *
 * Attribute enrichment from CSV (optional — merged on point coordinates):
 *   data/raw/afcfe85f26bc4c8a9eed5e16babc68aa/Stromanlagen_-OGD/EN_STROMANLAGEN_P.csv
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── proj4: LV95 (EPSG:2056) → WGS84 ──────────────────────────────────────
let proj4;
try {
  proj4 = require('proj4');
} catch (e) {
  console.error('proj4 not found. Run: npm install proj4');
  process.exit(1);
}

const LV95_DEF =
  '+proj=somerc +lat_0=46.9524055555556 +lon_0=7.43958333333333 ' +
  '+k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel ' +
  '+towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs';
proj4.defs('EPSG:2056', LV95_DEF);
const toWGS84 = proj4('EPSG:2056', 'WGS84');

function lv95ToWgs84(x, y) {
  return toWGS84.forward([x, y]); // [lon, lat]
}

// ── DXF parser: POINT + LWPOLYLINE ───────────────────────────────────────
function parseDxf(filePath) {
  const content = fs.readFileSync(filePath, 'latin1');
  const lines   = content.split(/\r?\n/);
  const entities = [];

  // Find ENTITIES section
  let start = -1, end = -1;
  for (let i = 0; i + 3 < lines.length; i++) {
    if (lines[i].trim() === '0'      && lines[i+1].trim() === 'SECTION' &&
        lines[i+2].trim() === '2'    && lines[i+3].trim() === 'ENTITIES') {
      start = i + 4;
    }
    if (start > 0 && lines[i].trim() === '0' && lines[i+1].trim() === 'ENDSEC') {
      end = i; break;
    }
  }

  if (start === -1) {
    console.error('No ENTITIES section found in DXF');
    return entities;
  }

  let i = start;
  while (i < end) {
    if (lines[i].trim() !== '0') { i += 2; continue; }
    const type = lines[i+1].trim();
    i += 2;

    if (type === 'POINT') {
      let layer = '', x = null, y = null;
      while (i < end && lines[i].trim() !== '0') {
        const code = lines[i].trim();
        const val  = lines[i+1] ? lines[i+1].trim() : '';
        i += 2;
        if (code === '8')  layer = val;
        if (code === '10') x = parseFloat(val);
        if (code === '20') y = parseFloat(val);
      }
      if (layer && x !== null && y !== null) {
        entities.push({ type: 'POINT', layer, x, y });
      }

    } else if (type === 'LWPOLYLINE') {
      let layer = '', numVerts = 0;
      const verts = [];
      let pendingX = null;

      while (i < end && lines[i].trim() !== '0') {
        const code = lines[i].trim();
        const val  = lines[i+1] ? lines[i+1].trim() : '';
        i += 2;
        if (code === '8')  layer    = val;
        if (code === '90') numVerts = parseInt(val);
        if (code === '10') pendingX = parseFloat(val);
        if (code === '20' && pendingX !== null) {
          verts.push({ x: pendingX, y: parseFloat(val) });
          pendingX = null;
        }
      }
      if (layer && verts.length >= 2) {
        entities.push({ type: 'LWPOLYLINE', layer, verts });
      }

    } else {
      // Skip unknown entity
      while (i < end && lines[i].trim() !== '0') i += 2;
    }
  }
  return entities;
}

// ── CSV attribute loader for EN_STROMANLAGEN_P ───────────────────────────
function loadCsvAttributes(csvPath) {
  if (!fs.existsSync(csvPath)) return {};
  const content = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''); // strip BOM
  const rows    = content.trim().split(/\r?\n/);
  const headers = rows[0].split(',');
  const map     = {};

  for (let r = 1; r < rows.length; r++) {
    const vals = rows[r].split(',');
    const row  = {};
    headers.forEach((h, idx) => { row[h.trim()] = (vals[idx] || '').trim(); });
    // Key by rounded LV95 coordinates (match precision of DXF)
    const e = parseFloat(row['E']), n = parseFloat(row['N']);
    if (!isNaN(e) && !isNaN(n)) {
      const key = `${Math.round(e * 10) / 10},${Math.round(n * 10) / 10}`;
      map[key] = row;
    }
  }
  return map;
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  const [,, dxfFile, outputFile] = process.argv;
  if (!dxfFile || !outputFile) {
    console.error(
      'Usage: node scripts/extract-stromanlagen.js <dxf-file> <output.geojson>'
    );
    process.exit(1);
  }

  const csvPath = path.join(
    path.dirname(dxfFile),
    '../../afcfe85f26bc4c8a9eed5e16babc68aa/Stromanlagen_-OGD/EN_STROMANLAGEN_P.csv'
  );
  const csvAttrs = loadCsvAttributes(csvPath);
  console.log(`Loaded ${Object.keys(csvAttrs).length} CSV attribute rows`);

  console.log(`Parsing DXF: ${dxfFile}`);
  const entities = parseDxf(dxfFile);
  console.log(`  Found ${entities.length} entities`);

  const features = [];

  for (const entity of entities) {
    if (entity.type === 'POINT' && entity.layer === 'EN_STROMANLAGEN_P') {
      const [lon, lat] = lv95ToWgs84(entity.x, entity.y);
      const key = `${Math.round(entity.x * 10) / 10},${Math.round(entity.y * 10) / 10}`;
      const attrs = csvAttrs[key] || {};

      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lon, lat] },
        properties: {
          infraType:         'electricity',
          geomType:          'substation',
          layer:             entity.layer,
          typ:               attrs['TYP']           || 'Unterwerk',
          eigentuemer:       attrs['EIGENTUEMER']   || 'EWZ',
          bezeichnung:       attrs['BEZEICHNUNG']   || '',
          ort:               attrs['BEMERKUNGEN']   || '',
          spannung_in_kv:    attrs['SPANNUNG_IN']   ? parseInt(attrs['SPANNUNG_IN'])  : null,
          spannung_out_kv:   attrs['SPANNUNG_OUT']  ? parseInt(attrs['SPANNUNG_OUT']) : null,
          betriebsstatus:    'bestehend',
        },
      });

    } else if (entity.type === 'LWPOLYLINE' && entity.layer === 'EN_STROMLEITUNGEN_L') {
      const coords = entity.verts.map(v => lv95ToWgs84(v.x, v.y));

      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
        properties: {
          infraType:         'electricity',
          geomType:          'cable-hv',
          layer:             entity.layer,
          eigentuemer:       'EWZ',
          spannung_kv:       150,
          leitung_typ:       'Kabelleitung',
          betriebsstatus:    'inBetrieb',
          spannung_bezeichnung: 'Hochspannung',
        },
      });
    }
  }

  const fc = { type: 'FeatureCollection', features };
  const outDir = path.dirname(outputFile);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outputFile, JSON.stringify(fc, null, 2), 'utf8');

  const pts  = features.filter(f => f.geometry.type === 'Point').length;
  const lns  = features.filter(f => f.geometry.type === 'LineString').length;
  console.log(`\nWrote ${features.length} features to ${outputFile}`);
  console.log(`  ${pts} substations (EN_STROMANLAGEN_P)`);
  console.log(`  ${lns} HV cables  (EN_STROMLEITUNGEN_L)`);

  if (pts > 0) {
    const substations = features.filter(f => f.geometry.type === 'Point');
    console.log('\nSubstations:');
    substations.forEach(f => {
      const p = f.properties;
      console.log(`  ${p.bezeichnung} (${p.typ}) — ${p.spannung_in_kv}kV→${p.spannung_out_kv}kV — ${f.geometry.coordinates[1].toFixed(5)}, ${f.geometry.coordinates[0].toFixed(5)}`);
    });
  }
}

main();
