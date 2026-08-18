# STARTUP

## Prerequisites

Run all commands from the project root directory.

```
cd "C:\Users\robin\Documents\GitHub\hidden-infrastructures-zurich"
npm install
```

---

## Local development (desktop browser only)

Terminal 1 — start Vite dev server:

```
npx vite --host
```

Open http://localhost:8080 in browser.

Shut down: Ctrl+C in Terminal 1.

---

## Mobile testing (phone GPS + real device)

Push to main branch — Cloud Run redeploys automatically.

```
/deploy
```

Cloud Run service URL: https://hidden-infrastructures-zurich-50944718104.europe-west2.run.app/

Open in Android Chrome for GPS field testing. Allow location permissions when prompted.

---

## Docker (local test only)

```
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures
```

Open http://localhost:8080 in browser.

---

## GeoShop tile ingestion

When new DXF tile orders arrive in `data/raw/GeoShop/`:

```
node scripts/import-new-tiles.js
```

This diffs against `data/processed/.processed-orders.json`, runs the extractor for any new `order_*` directories, and updates the manifest. Commit the updated GeoJSON files and manifest afterwards (`/deploy`).

---

## Notes

- Vite sets COEP/COOP headers, which enable cross-origin isolation for `SharedArrayBuffer` and high-resolution timers — not required by AudioWorklet itself. Neither SharedArrayBuffer nor AudioWorklet is currently used in the codebase; the headers are retained without an active requirement today (see `docs/Technical_Architecture_v5.md`, Deployment)
- `allowedHosts: true` in `vite.config.js` permits any hostname (required for Cloudflare tunnel)
- Cloud Run deployment triggered automatically on push to `main` via `cloudbuild.yaml`
- All 6 audio layers are togglable via the UI buttons (TRAM / WATER / SEWAGE / ELECTRICITY / TELECOM / FERNWÄRME)
- Audio lifecycle: tap "Unlock Audio" first (resumes AudioContext), then "Start" (creates synthesis nodes + begins tram polling)