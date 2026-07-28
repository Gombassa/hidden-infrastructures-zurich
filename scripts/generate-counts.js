#!/usr/bin/env node
/**
 * generate-counts.js
 *
 * Regenerates the per-file feature/size counts embedded between
 * <!-- COUNTS:BEGIN --> / <!-- COUNTS:END --> marker comments in the docs
 * listed in TARGET_DOCS, computed directly from data/processed/.processed-
 * orders.json and public/lk-*.geojson. Run standalone (`node scripts/
 * generate-counts.js`) or via the calls at the end of import-new-tiles.js
 * and extract-lk-geojson.js, so counts regenerate whenever the data changes
 * instead of drifting between manual updates.
 *
 * Also prints (does not fix) any geomType category that documentation says
 * should be excluded but is nonetheless present in the file — see
 * DOCUMENTED_EXCLUSIONS below.
 *
 * No thresholds, no size budget: this script reports what is there.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'data/processed/.processed-orders.json');
const PUBLIC_DIR = path.join(ROOT, 'public');

const COUNTS_BEGIN = '<!-- COUNTS:BEGIN -->';
const COUNTS_END = '<!-- COUNTS:END -->';

// Must match OUTPUT_FILES in scripts/extract-lk-geojson.js — duplicated
// rather than required from there, since that script runs its extraction
// unconditionally on require and the two scripts have no other reason to
// share a module boundary. Update both lists together if a layer is added.
const OUTPUT_FILES = ['lk-sewage', 'lk-electricity', 'lk-water', 'lk-tram-lk', 'lk-telecom', 'lk-fernwaerme'];

// Docs whose COUNTS:BEGIN/END block gets rewritten. docs/phase2-data-layer.md
// deliberately excluded — it's an intentionally frozen historical snapshot
// (see CLAUDE.md's former standing instruction / commit history), not a live
// figure, and stays that way by explicit decision.
const TARGET_DOCS = [
  'README.md',
  'CLAUDE.md',
  'docs/Technical_Architecture_v5.md',
  'docs/Project_Plan_v3_5.md',
];

// What the prose in docs/phase2-data-layer.md claims is excluded per file,
// keyed by geomType. This is a hand-maintained record of documentation
// claims, not a mirror of LAYER_RULES' exclude:true flags — the two are
// checked separately (see checkDocumentedExclusions vs checkRuleExclusions)
// because they catch different problems: a mismatch here means the docs and
// the data have drifted apart; a mismatch against LAYER_RULES would mean the
// extraction code doesn't do what it says it does.
const DOCUMENTED_EXCLUSIONS = {
  'lk-tram-lk':     ['overhead', 'area'], // phase2-data-layer.md: "421 overhead + area excluded"
  'lk-sewage':      ['manhole'],          // phase2-data-layer.md: manhole points excluded
  'lk-electricity': ['area'],             // phase2-data-layer.md: "area (trasse footprints) excluded"
  'lk-telecom':     ['overhead'],         // phase2-data-layer.md: "overhead excluded"
};

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function analyzeFile(name) {
  const filePath = path.join(PUBLIC_DIR, `${name}.geojson`);
  const size = fs.statSync(filePath).size;
  const geojson = readJson(filePath);
  const byGeomType = {};
  for (const f of geojson.features) {
    const gt = (f.properties && f.properties.geomType) || 'unknown';
    byGeomType[gt] = (byGeomType[gt] || 0) + 1;
  }
  return { name, size, total: geojson.features.length, byGeomType };
}

function orderRange(orders) {
  const nums = orders
    .map(o => parseInt(String(o).replace(/[^0-9]/g, ''), 10))
    .filter(n => !Number.isNaN(n));
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

// Cross-checks the file against what docs/phase2-data-layer.md claims is
// excluded. A hit here means documentation and data have drifted apart.
function checkDocumentedExclusions(analyses) {
  const warnings = [];
  for (const a of analyses) {
    const claimed = DOCUMENTED_EXCLUSIONS[a.name];
    if (!claimed) continue;
    for (const gt of claimed) {
      if (a.byGeomType[gt]) {
        warnings.push(
          `${a.name}.geojson: docs/phase2-data-layer.md says geomType="${gt}" is excluded, ` +
          `but ${a.byGeomType[gt].toLocaleString('en-US')} feature(s) with that geomType are present`
        );
      }
    }
  }
  return warnings;
}

function fmt(n) {
  return n.toLocaleString('en-US');
}

function fmtBytes(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)} MB (${fmt(n)} B)`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)} KB (${fmt(n)} B)`;
  return `${fmt(n)} B`;
}

function buildMarkdown(analyses, orders) {
  const { min, max } = orderRange(orders);
  const lines = [];
  lines.push('| File | Total features | By geomType | Size |');
  lines.push('|---|---|---|---|');
  let totalFeatures = 0;
  let totalBytes = 0;
  for (const a of analyses) {
    const breakdown = Object.entries(a.byGeomType)
      .sort((x, y) => y[1] - x[1])
      .map(([gt, n]) => `${gt}: ${fmt(n)}`)
      .join(', ');
    lines.push(`| \`${a.name}.geojson\` | ${fmt(a.total)} | ${breakdown} | ${fmtBytes(a.size)} |`);
    totalFeatures += a.total;
    totalBytes += a.size;
  }
  lines.push('');
  lines.push(
    `**${orders.length} GeoShop orders processed** (${min}–${max}) · ` +
    `**${fmt(totalFeatures)} total features** across ${analyses.length} files · ` +
    `**${fmtBytes(totalBytes)}** served.`
  );
  lines.push('');
  lines.push('*Generated by `scripts/generate-counts.js` from `data/processed/.processed-orders.json` ' +
    'and `public/lk-*.geojson` — do not hand-edit the content between the markers above and below.*');
  return lines.join('\n');
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Rewrites every COUNTS:BEGIN/END pair in the file, not just the first — a
// single document (CLAUDE.md) has more than one. Markers must stand alone on
// their own line (anchored with ^/$ under the `m` flag): a prose sentence
// that merely *mentions* the marker syntax — e.g. this file's own standing
// instruction describing what the markers look like — must never be
// mistaken for a real delimiter and have its surrounding sentence overwritten.
function rewriteMarkerBlock(filePath, newContent) {
  if (!fs.existsSync(filePath)) return { updated: false, reason: 'file not found', count: 0 };
  const text = fs.readFileSync(filePath, 'utf8');
  const pattern = new RegExp(
    `^[ \\t]*${escapeRegExp(COUNTS_BEGIN)}[ \\t]*$[\\s\\S]*?^[ \\t]*${escapeRegExp(COUNTS_END)}[ \\t]*$`,
    'gm'
  );
  const matches = text.match(pattern);
  if (!matches || matches.length === 0) {
    return { updated: false, reason: 'no COUNTS:BEGIN/END markers found', count: 0 };
  }
  const replacement = `${COUNTS_BEGIN}\n${newContent}\n${COUNTS_END}`;
  const rewritten = text.replace(pattern, replacement);
  if (rewritten === text) return { updated: false, reason: 'no change', count: matches.length };
  fs.writeFileSync(filePath, rewritten, 'utf8');
  return { updated: true, count: matches.length };
}

function run() {
  const orders = readJson(MANIFEST_PATH);
  const analyses = OUTPUT_FILES.map(analyzeFile);
  const markdown = buildMarkdown(analyses, orders);
  const warnings = checkDocumentedExclusions(analyses);

  console.log(markdown);
  console.log('');

  if (warnings.length) {
    console.log('WARNINGS — documented exclusion vs. actual file contents:');
    for (const w of warnings) console.log('  ' + w);
  } else {
    console.log('No documented-exclusion mismatches found.');
  }
  console.log('');

  for (const doc of TARGET_DOCS) {
    const result = rewriteMarkerBlock(path.join(ROOT, doc), markdown);
    if (result.updated) console.log(`updated:  ${doc}  (${result.count} block${result.count === 1 ? '' : 's'})`);
    else console.log(`skipped:  ${doc}  (${result.reason})`);
  }

  return { analyses, warnings };
}

if (require.main === module) {
  run();
}

module.exports = { run, analyzeFile, checkDocumentedExclusions, buildMarkdown, OUTPUT_FILES, DOCUMENTED_EXCLUSIONS };
