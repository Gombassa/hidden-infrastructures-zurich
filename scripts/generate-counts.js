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
 * Also prints (does not fix) any order-number-shaped or comma-grouped
 * feature-total-shaped figure found in a target doc *outside* its
 * COUNTS:BEGIN/END block — see checkStaleFiguresOutsideMarkers below. The
 * marker block is the only part of these docs this script keeps current;
 * a hand-written number anywhere else is a restatement that will silently
 * go stale on the next GeoShop ingestion, so this surfaces it at generation
 * time instead of leaving it for someone to notice months later.
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

// These figures grow with every GeoShop ingestion, so a hand-written number
// outside the protected marker block is wrong the moment the next tile
// delivery lands — it just doesn't look wrong yet. Two shapes are worth
// flagging on sight:
//   - an order-number-shaped integer (GeoShop order IDs run 55xxx-56xxx)
//   - a comma-grouped integer of 4+ digits (a restated feature/byte total)
// CHF currency figures are the one other comma-grouped-number category that
// shows up in these docs (budget lines) and have nothing to do with GeoShop
// scale, so a number immediately preceded by "CHF " is excluded from the
// second check — otherwise every run would drown the real warnings in
// currency noise and the check would stop getting read.
const ORDER_NUMBER_RE = /\b5[56]\d{3}\b/g;
const COMMA_GROUPED_RE = /(?<!CHF )\b\d{1,3}(?:,\d{3})+\b/g;

// Scans a doc for the two shapes above, but only in the lines that fall
// *outside* any COUNTS:BEGIN/END pair — the block itself is generated and
// legitimately full of exactly these shapes. Line-by-line with a running
// "inside a marker block" flag rather than a single regex over the whole
// text, so it still works correctly across a file with more than one
// marker pair (e.g. CLAUDE.md) and reports real line numbers.
function checkStaleFiguresOutsideMarkers(filePath, relPath) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const warnings = [];
  let insideMarker = false;
  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed === COUNTS_BEGIN) { insideMarker = true; return; }
    if (trimmed === COUNTS_END) { insideMarker = false; return; }
    if (insideMarker) return;

    const lineNo = i + 1;
    const orderMatches = line.match(ORDER_NUMBER_RE) || [];
    for (const m of orderMatches) {
      warnings.push(`${relPath}:${lineNo}: order-number-shaped figure "${m}" outside the counts block — "${trimmed}"`);
    }
    const commaMatches = line.match(COMMA_GROUPED_RE) || [];
    for (const m of commaMatches) {
      warnings.push(`${relPath}:${lineNo}: comma-grouped figure "${m}" outside the counts block — "${trimmed}"`);
    }
  });
  return warnings;
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

  const staleFigureWarnings = [];
  for (const doc of TARGET_DOCS) {
    const result = rewriteMarkerBlock(path.join(ROOT, doc), markdown);
    if (result.updated) console.log(`updated:  ${doc}  (${result.count} block${result.count === 1 ? '' : 's'})`);
    else console.log(`skipped:  ${doc}  (${result.reason})`);
    staleFigureWarnings.push(...checkStaleFiguresOutsideMarkers(path.join(ROOT, doc), doc));
  }
  console.log('');

  if (staleFigureWarnings.length) {
    console.log('WARNINGS — order/feature-total-shaped figures found outside the counts block (not auto-fixed, check by hand):');
    for (const w of staleFigureWarnings) console.log('  ' + w);
  } else {
    console.log('No order/feature-total-shaped figures found outside the counts block.');
  }

  return { analyses, warnings, staleFigureWarnings };
}

if (require.main === module) {
  run();
}

module.exports = {
  run, analyzeFile, checkDocumentedExclusions, checkStaleFiguresOutsideMarkers,
  buildMarkdown, OUTPUT_FILES, DOCUMENTED_EXCLUSIONS,
};
