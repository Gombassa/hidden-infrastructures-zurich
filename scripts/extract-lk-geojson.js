#!/usr/bin/env node
/**
 * extract-lk-geojson.js
 *
 * Batch-processes Stadt Zürich GeoShop DXF tile deliveries and consolidates
 * them into per-layer GeoJSON files.
 *
 * Usage:
 *   node extract-lk-geojson.js <tiles-dir> <output-dir>
 *
 * <tiles-dir> contains one subdirectory per tile delivery, each containing
 * the standard GeoShop DXF fileset.
 *
 * Incremental/append mode: if an output file already exists it is read on
 * startup and its features seed the dedup key Sets, so re-runs only add new
 * features rather than overwriting.
 *
 * Dependencies: proj4 (npm install proj4)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// proj4 — LV95 (EPSG:2056) → WGS84
// ---------------------------------------------------------------------------
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
  return toWGS84.forward([x, y]); // returns [lon, lat]
}

// ---------------------------------------------------------------------------
// Layer → output-file routing
// ---------------------------------------------------------------------------

// Each rule: { match: fn(layerName)→bool, file, infraType, geomType, exclude? }
// Rules with exclude:true are recognised but dropped — they never enter output.
// More-specific rules must appear before broader ones that share a prefix.
const LAYER_RULES = [
  // --- NIS_ZH_ABWASSER.dxf ---
  { match: l => /^LKZ1118-MLU/.test(l),            file: 'lk-sewage',      infraType: 'sewage',      geomType: 'pipe',     exclude: true  }, // Nebenleitung, lower accuracy
  { match: l => /^LKZ111[0-9]-MLU/.test(l),        file: 'lk-sewage',      infraType: 'sewage',      geomType: 'pipe'      },
  { match: l => /^LKZ1131-MSU-/.test(l),           file: 'lk-sewage',      infraType: 'sewage',      geomType: 'manhole',  exclude: true  },
  { match: l => /^LKZ1137-MSU-/.test(l),           file: 'lk-sewage',      infraType: 'sewage',      geomType: 'manhole',  exclude: true  },

  // --- NIS_ZH_EWZ.dxf ---
  { match: l => /^LKZ1511-MLU/.test(l),            file: 'lk-electricity', infraType: 'electricity', geomType: 'cable'     },
  { match: l => /^LKZ1512-MFU/.test(l),            file: 'lk-electricity', infraType: 'electricity', geomType: 'area',     exclude: true  }, // trasse footprints
  { match: l => /^LKZ1520-MSU-/.test(l),           file: 'lk-electricity', infraType: 'electricity', geomType: 'node'      },
  { match: l => /^LKZ1522-MSU-/.test(l),           file: 'lk-electricity', infraType: 'electricity', geomType: 'node'      },

  // --- NIS_ZH_WVZ.dxf ---
  { match: l => /^LKZ131[0-9]-MLU/.test(l),        file: 'lk-water',       infraType: 'water',       geomType: 'pipe'      },
  { match: l => /^LKZ1321-MSU-/.test(l),           file: 'lk-water',       infraType: 'water',       geomType: 'fitting'   },
  { match: l => /^LKZ1322-MSU-/.test(l),           file: 'lk-water',       infraType: 'water',       geomType: 'fitting'   },
  { match: l => /^LKZ1323-MSU-/.test(l),           file: 'lk-water',       infraType: 'water',       geomType: 'fitting'   },
  { match: l => /^LKZ1325-MSU-/.test(l),           file: 'lk-water',       infraType: 'water',       geomType: 'fitting'   },

  // --- SIA405_LKMap_2015_LV95.dxf — tram ---
  { match: l => /^LKZ151VOMLU/.test(l),            file: 'lk-tram-lk',     infraType: 'tram',        geomType: 'overhead', exclude: true  },
  { match: l => /^LKZ151V.*MLU/.test(l),           file: 'lk-tram-lk',     infraType: 'tram',        geomType: 'trasse'    },
  { match: l => /^LKZ154V-MSU/.test(l),            file: 'lk-tram-lk',     infraType: 'tram',        geomType: 'node'      },
  { match: l => /^LKZ150V-MSU/.test(l),            file: 'lk-tram-lk',     infraType: 'tram',        geomType: 'node'      },
  { match: l => /^LKZ150V-MFU/.test(l),            file: 'lk-tram-lk',     infraType: 'tram',        geomType: 'area'      },

  // --- SIA405_LKMap_2015_LV95.dxf — telecom (Swisscom) ---
  { match: l => /^LKZ161SU/.test(l),               file: 'lk-telecom',     infraType: 'telecom',     geomType: 'cable'     },
  { match: l => /^LKZ161SO/.test(l),               file: 'lk-telecom',     infraType: 'telecom',     geomType: 'overhead', exclude: true  },
  { match: l => /^LKZ163S-MFU/.test(l),            file: 'lk-telecom',     infraType: 'telecom',     geomType: 'area'      },
  { match: l => /^LKZ160S-MSU/.test(l),            file: 'lk-telecom',     infraType: 'telecom',     geomType: 'node'      },

  // --- SIA405_LKMap_2015_LV95.dxf — telecom (UPC) ---
  { match: l => /^LKZ161UU/.test(l),               file: 'lk-telecom',     infraType: 'telecom',     geomType: 'cable'     },
  { match: l => /^LKZ161UO/.test(l),               file: 'lk-telecom',     infraType: 'telecom',     geomType: 'overhead', exclude: true  },
  { match: l => /^LKZ163U-MSU/.test(l),            file: 'lk-telecom',     infraType: 'telecom',     geomType: 'node'      },
  { match: l => /^LKZ164U-MSU/.test(l),            file: 'lk-telecom',     infraType: 'telecom',     geomType: 'node'      },

  // --- SIA405_LKMap_2015_LV95.dxf — Fernwärme ---
  { match: l => /^LKZ141EU/.test(l),               file: 'lk-fernwaerme',  infraType: 'fernwaerme',  geomType: 'pipe'      },
];

const OUTPUT_FILES = [
  'lk-sewage',
  'lk-electricity',
  'lk-water',
  'lk-tram-lk',
  'lk-telecom',
  'lk-fernwaerme',
];

function routeLayer(layerName) {
  for (const rule of LAYER_RULES) {
    if (rule.match(layerName)) return rule.exclude ? null : rule;
  }
  return null;
}

// ---------------------------------------------------------------------------
// DXF parsing
// ---------------------------------------------------------------------------

/**
 * Parse a DXF file and yield raw entity objects.
 * Handles:
 *   - POLYLINE + VERTEX + SEQEND  → { type:'POLYLINE', layer, vertices:[{x,y}] }
 *   - INSERT                      → { type:'INSERT',   layer, x, y }
 * Skips everything else.
 *
 * Group codes and values alternate on successive lines; both are trimmed.
 */
function parseDxf(filePath) {
  const entities = [];

  const content = fs.readFileSync(filePath, 'latin1');
  const lines = content.split(/\r?\n/);

  // Find the ENTITIES section. There may be multiple SECTION / ENDSEC pairs
  // (HEADER, TABLES, BLOCKS, ENTITIES). We want only the last one that is
  // followed by an entity stream, identified by the text "ENTITIES" appearing
  // as a value (group code 2) after a "SECTION" marker.
  let entitiesStart = -1;
  let entitiesEnd   = -1;

  for (let i = 0; i < lines.length - 1; i++) {
    const code = lines[i].trim();
    const val  = lines[i + 1].trim();
    if (code === '0' && val === 'SECTION') {
      // peek at the next pair
      if (i + 2 < lines.length && lines[i + 2].trim() === '2' &&
          i + 3 < lines.length && lines[i + 3].trim() === 'ENTITIES') {
        entitiesStart = i + 4; // first pair after "ENTITIES"
      }
    }
    if (entitiesStart !== -1 && code === '0' && val === 'ENDSEC') {
      entitiesEnd = i;
      break;
    }
  }

  if (entitiesStart === -1) return entities; // no ENTITIES section

  // Walk the ENTITIES section
  let i = entitiesStart;

  // Helper: read one group-code/value pair starting at index i, advance i by 2
  function peek() {
    if (i >= entitiesEnd) return null;
    return { code: lines[i].trim(), val: lines[i + 1] ? lines[i + 1].trim() : '' };
  }
  function consume() {
    const p = peek();
    i += 2;
    return p;
  }

  while (i < entitiesEnd) {
    const p = peek();
    if (!p) break;

    if (p.code !== '0') { consume(); continue; }
    const entityType = p.val;
    consume(); // consume the "0 / ENTITYTYPE" pair

    if (entityType === 'POLYLINE') {
      let layer = '';
      const vertices = [];

      // Read POLYLINE header until first VERTEX or SEQEND
      while (i < entitiesEnd) {
        const q = peek();
        if (!q) break;
        if (q.code === '0') {
          if (q.val === 'VERTEX' || q.val === 'SEQEND') break;
          // Unexpected entity — stop
          break;
        }
        const pair = consume();
        if (pair.code === '8') layer = pair.val;
      }

      // Read VERTEX blocks
      while (i < entitiesEnd) {
        const q = peek();
        if (!q) break;
        if (q.code === '0' && q.val !== 'VERTEX') break;
        if (q.code === '0' && q.val === 'VERTEX') consume(); // consume "0 VERTEX"

        let vx = null, vy = null;
        while (i < entitiesEnd) {
          const r = peek();
          if (!r) break;
          if (r.code === '0') break; // next entity
          const pair = consume();
          if (pair.code === '10') vx = parseFloat(pair.val);
          if (pair.code === '20') vy = parseFloat(pair.val);
        }
        if (vx !== null && vy !== null) vertices.push({ x: vx, y: vy });
      }

      // Consume SEQEND block
      if (i < entitiesEnd) {
        const q = peek();
        if (q && q.code === '0' && q.val === 'SEQEND') {
          consume(); // "0 SEQEND"
          while (i < entitiesEnd) {
            const r = peek();
            if (!r) break;
            if (r.code === '0') break;
            consume();
          }
        }
      }

      if (layer && vertices.length >= 2) {
        entities.push({ type: 'POLYLINE', layer, vertices });
      }

    } else if (entityType === 'INSERT') {
      let layer = '';
      let x = null, y = null;

      while (i < entitiesEnd) {
        const q = peek();
        if (!q) break;
        if (q.code === '0') break;
        const pair = consume();
        if (pair.code === '8')  layer = pair.val;
        if (pair.code === '10') x = parseFloat(pair.val);
        if (pair.code === '20') y = parseFloat(pair.val);
      }

      if (layer && x !== null && y !== null) {
        entities.push({ type: 'INSERT', layer, x, y });
      }

    } else {
      // Skip — consume until the next entity boundary
      while (i < entitiesEnd) {
        const q = peek();
        if (!q) break;
        if (q.code === '0') break;
        consume();
      }
    }
  }

  return entities;
}

// ---------------------------------------------------------------------------
// Dedup key helpers (LV95 coordinates, 0.1m precision)
// ---------------------------------------------------------------------------

function roundLV95(v) {
  return Math.round(v * 10) / 10;
}

function lineKey(vertices) {
  const first = vertices[0];
  const last  = vertices[vertices.length - 1];
  const a = `${roundLV95(first.x)},${roundLV95(first.y)}`;
  const b = `${roundLV95(last.x)},${roundLV95(last.y)}`;
  // Sort so direction doesn't matter
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function pointKey(x, y) {
  return `${roundLV95(x)},${roundLV95(y)}`;
}

// ---------------------------------------------------------------------------
// Seed dedup Sets from an existing GeoJSON file
// ---------------------------------------------------------------------------

function seedDedupFromFile(filePath, dedupSet) {
  if (!fs.existsSync(filePath)) return 0;
  let fc;
  try {
    fc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.warn(`  Warning: could not parse existing ${path.basename(filePath)}: ${e.message}`);
    return 0;
  }
  if (!fc.features) return 0;
  let count = 0;
  for (const feature of fc.features) {
    const geom = feature.geometry;
    if (!geom) continue;
    if (geom.type === 'LineString') {
      const coords = geom.coordinates;
      if (coords.length < 2) continue;
      // Re-derive LV95 key from existing WGS84 coords by back-projecting
      // Not reliable. Instead, store a dedup key in properties during write.
      // We stored it as properties._dedupKey — use that if present.
      if (feature.properties && feature.properties._dedupKey) {
        dedupSet.add(feature.properties._dedupKey);
        count++;
      }
    } else if (geom.type === 'Point') {
      if (feature.properties && feature.properties._dedupKey) {
        dedupSet.add(feature.properties._dedupKey);
        count++;
      }
    }
  }
  return count;
}

// ---------------------------------------------------------------------------
// Bounding box helper
// ---------------------------------------------------------------------------

function updateBbox(bbox, lon, lat) {
  if (lon < bbox[0]) bbox[0] = lon;
  if (lat < bbox[1]) bbox[1] = lat;
  if (lon > bbox[2]) bbox[2] = lon;
  if (lat > bbox[3]) bbox[3] = lat;
}

function bboxStr(bbox) {
  if (bbox[0] === Infinity) return 'n/a';
  return `[${bbox[0].toFixed(5)},${bbox[1].toFixed(5)},${bbox[2].toFixed(5)},${bbox[3].toFixed(5)}]`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const [,, tilesDir, outputDir] = process.argv;
  if (!tilesDir || !outputDir) {
    console.error('Usage: node extract-lk-geojson.js <tiles-dir> <output-dir>');
    process.exit(1);
  }

  if (!fs.existsSync(tilesDir)) {
    console.error(`Tiles directory not found: ${tilesDir}`);
    process.exit(1);
  }
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // DXF filenames we look for in each tile subdirectory
  const KNOWN_DXF = [
    'NIS_ZH_ABWASSER.dxf',
    'NIS_ZH_EWZ.dxf',
    'NIS_ZH_WVZ.dxf',
    'NIS_ZH_ERZF.dxf',  // may be empty / skipped
    'SIA405_LKMap_2015_LV95.dxf',
  ];
  // Files to skip (no geometry we care about)
  const SKIP_DXF = new Set(['NIS_ZH_ERZF.dxf']);

  // Discover tile subdirectories
  const tileDirs = fs.readdirSync(tilesDir)
    .map(name => path.join(tilesDir, name))
    .filter(p => {
      if (!fs.statSync(p).isDirectory()) return false;
      return KNOWN_DXF.some(f => fs.existsSync(path.join(p, f)));
    });

  if (tileDirs.length === 0) {
    console.error('No tile subdirectories found in', tilesDir);
    process.exit(1);
  }
  console.log(`Found ${tileDirs.length} tile(s): ${tileDirs.map(d => path.basename(d)).join(', ')}\n`);

  // Per-output-file state
  const state = {};
  for (const name of OUTPUT_FILES) {
    const filePath = path.join(outputDir, `${name}.geojson`);
    const dedupSet = new Set();
    const existingFeatures = [];

    if (fs.existsSync(filePath)) {
      let fc;
      try {
        fc = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {
        console.warn(`Warning: could not parse existing ${name}.geojson — starting fresh`);
        fc = null;
      }
      if (fc && fc.features) {
        for (const feature of fc.features) {
          if (feature.properties && feature.properties._dedupKey) {
            dedupSet.add(feature.properties._dedupKey);
          }
          existingFeatures.push(feature);
        }
        console.log(`  Loaded ${existingFeatures.length} existing features from ${name}.geojson`);
      }
    }

    state[name] = {
      features: existingFeatures,
      dedupSet,
      existingCount: existingFeatures.length,
      rawAdded: 0,
      newAdded: 0,
      bbox: [Infinity, Infinity, -Infinity, -Infinity],
    };

    // Seed bbox from existing features
    for (const f of existingFeatures) {
      const geom = f.geometry;
      if (!geom) continue;
      if (geom.type === 'LineString') {
        for (const [lon, lat] of geom.coordinates) updateBbox(state[name].bbox, lon, lat);
      } else if (geom.type === 'Point') {
        updateBbox(state[name].bbox, geom.coordinates[0], geom.coordinates[1]);
      }
    }
  }

  let tilesProcessed = 0;
  let totalRawThisRun = 0;
  let totalNewThisRun = 0;

  for (const tileDir of tileDirs) {
    const tileName = path.basename(tileDir);
    let tileHadAnyFile = false;

    for (const dxfName of KNOWN_DXF) {
      if (SKIP_DXF.has(dxfName)) continue;
      const dxfPath = path.join(tileDir, dxfName);
      if (!fs.existsSync(dxfPath)) continue;

      tileHadAnyFile = true;
      const sourceLabel = `${tileName}/${dxfName}`;
      process.stdout.write(`  Parsing ${sourceLabel} … `);

      const entities = parseDxf(dxfPath);
      process.stdout.write(`${entities.length} entities\n`);

      for (const entity of entities) {
        const rule = routeLayer(entity.layer);
        if (!rule) continue;
        if (entity.layer === '0' || entity.layer === 'geo-srvc-geoshop-p2') continue;

        const s = state[rule.file];
        totalRawThisRun++;
        s.rawAdded++;

        if (entity.type === 'POLYLINE') {
          const key = lineKey(entity.vertices);
          if (s.dedupSet.has(key)) continue;
          s.dedupSet.add(key);

          const coords = entity.vertices.map(v => lv95ToWgs84(v.x, v.y));
          for (const [lon, lat] of coords) updateBbox(s.bbox, lon, lat);

          s.features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: coords },
            properties: {
              layer:     entity.layer,
              infraType: rule.infraType,
              geomType:  rule.geomType,
              source:    sourceLabel,
              _dedupKey: key,
            },
          });
          s.newAdded++;
          totalNewThisRun++;

        } else if (entity.type === 'INSERT') {
          const key = pointKey(entity.x, entity.y);
          if (s.dedupSet.has(key)) continue;
          s.dedupSet.add(key);

          const [lon, lat] = lv95ToWgs84(entity.x, entity.y);
          updateBbox(s.bbox, lon, lat);

          s.features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [lon, lat] },
            properties: {
              layer:     entity.layer,
              infraType: rule.infraType,
              geomType:  rule.geomType,
              source:    sourceLabel,
              _dedupKey: key,
            },
          });
          s.newAdded++;
          totalNewThisRun++;
        }
      }
    }

    if (tileHadAnyFile) tilesProcessed++;
  }

  // Write output files
  console.log('\nWriting output files…');
  for (const name of OUTPUT_FILES) {
    const s = state[name];
    const fc = {
      type: 'FeatureCollection',
      features: s.features,
    };
    const outPath = path.join(outputDir, `${name}.geojson`);
    fs.writeFileSync(outPath, JSON.stringify(fc), 'utf8');
  }

  // Per-run summary
  console.log(`\nAdded ${totalNewThisRun} new features from ${tilesProcessed} tile(s) ` +
    `(${Object.values(state).reduce((a, s) => a + s.features.length, 0)} total across all runs)\n`);

  // Summary table
  const COL = [28, 8, 12, 11, 46];
  const header = [
    'file'.padEnd(COL[0]),
    'tiles'.padStart(COL[1]),
    'raw (run)'.padStart(COL[2]),
    'after dedup'.padStart(COL[3]),
    'bbox (WGS84)',
  ];
  console.log(header.join('  '));
  console.log('-'.repeat(COL.reduce((a, c) => a + c + 2, 0)));

  for (const name of OUTPUT_FILES) {
    const s = state[name];
    const row = [
      `${name}.geojson`.padEnd(COL[0]),
      tilesProcessed.toString().padStart(COL[1]),
      s.rawAdded.toString().padStart(COL[2]),
      s.features.length.toString().padStart(COL[3]),
      bboxStr(s.bbox),
    ];
    console.log(row.join('  '));
  }
}

main();
