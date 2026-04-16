# STARTUP

## Prerequisites

Run all commands from the project root directory.

cd "C:\Users\robin\Documents\GitHub\hidden-infrastructures-zurich"

---

## Local development (desktop browser only)

Terminal 1 — start Vite dev server:

npx vite --host

Open http://localhost:8080 in browser.

Shut down: Ctrl+C in Terminal 1.

---

## Mobile testing (phone GPS + real device)

Push to main branch — Cloud Run redeploys automatically.
Open the Cloud Run service URL in Android Chrome.
Cloud Run service URL: https://hidden-infrastructures-50944718104.europe-west6.run.app/
Open in Android Chrome for GPS field testing.
---

## Docker (local test only)

docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures

Open http://localhost:8080 in browser.

---

## Notes

- Vite sets required COEP/COOP headers for AudioWorklet + SharedArrayBuffer
- allowedHosts: true in vite.config.js permits any hostname
- Cloud Run deployment triggered automatically on push to main via cloudbuild.yaml