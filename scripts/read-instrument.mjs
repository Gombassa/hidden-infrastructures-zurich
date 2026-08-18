#!/usr/bin/env node
// Reads every numeric/select input's current value off a running instrument HTML page
// (see instruments/*.html + docs/instrument-reference.html) and optionally screenshots it.
// Requires the page to actually be served (e.g. `npx vite --host`) and Playwright's Chromium
// installed (`npx playwright install chromium`) — both are dev-only, nothing here ships.
//
// Usage: node scripts/read-instrument.mjs <url> [screenshotPath]
import { chromium } from 'playwright';

const url = process.argv[2];
const shotPath = process.argv[3];
if (!url) {
  console.error('Usage: node scripts/read-instrument.mjs <url> [screenshotPath]');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1600 } });
await page.goto(url, { waitUntil: 'networkidle' });

const values = await page.evaluate(() => {
  const out = {};
  document.querySelectorAll('input[type=number], input[type=range], select').forEach(el => {
    if (!el.id) return;
    out[el.id] = el.tagName === 'SELECT' ? el.value : parseFloat(el.value);
  });
  return out;
});

console.log(JSON.stringify(values, null, 2));

if (shotPath) {
  await page.screenshot({ path: shotPath, fullPage: true });
  console.error('Screenshot saved to ' + shotPath);
}

await browser.close();
