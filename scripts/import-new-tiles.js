#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import generateCounts from './generate-counts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEOSHOP_DIR = join(__dirname, '../data/raw/GeoShop');
const EXTRACTED_DIR = join(GEOSHOP_DIR, 'Extracted');
const MANIFEST_PATH = join(__dirname, '../data/processed/.processed-orders.json');

const allOrders = readdirSync(GEOSHOP_DIR).filter(name => name.startsWith('order_'));

const processed = existsSync(MANIFEST_PATH)
  ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
  : [];

const newOrders = allOrders.filter(name => !processed.includes(name));

if (newOrders.length === 0) {
  console.log('No new GeoShop tiles found.');
  process.exit(0);
}

console.log('New orders found:');
newOrders.forEach(name => console.log(`  ${name}`));

console.log('\nRunning extractor...');
execSync('node scripts/extract-lk-geojson.js data/raw/GeoShop public', { stdio: 'inherit', cwd: join(__dirname, '..') });

writeFileSync(MANIFEST_PATH, JSON.stringify([...processed, ...newOrders], null, 2));
console.log(`\nManifest updated — ${newOrders.length} new order(s) recorded.`);

// Move each newly-processed order folder out of the GeoShop root into
// Extracted/, so the root only ever shows orders still awaiting extraction.
// Done AFTER the manifest write above, not before: if this step fails partway,
// the order is already recorded as processed, so the next run won't try to
// re-extract it (readdirSync + the processed-orders filter above would skip
// it either way) — it'll just need a manual move later, not a repeat or a
// silent skip of real new data.
mkdirSync(EXTRACTED_DIR, { recursive: true });
for (const name of newOrders) {
  renameSync(join(GEOSHOP_DIR, name), join(EXTRACTED_DIR, name));
}
console.log(`Moved ${newOrders.length} order folder(s) into ${EXTRACTED_DIR}`);

// Belt-and-braces: extract-lk-geojson.js already regenerates counts at the
// end of its own run above, but call it again here directly so this script
// doesn't silently stop regenerating counts if that internal call is ever
// removed or the extraction step changes shape.
generateCounts.run();
