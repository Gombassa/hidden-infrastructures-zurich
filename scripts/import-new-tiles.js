#!/usr/bin/env node
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEOSHOP_DIR = join(__dirname, '../data/raw/GeoShop');
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
