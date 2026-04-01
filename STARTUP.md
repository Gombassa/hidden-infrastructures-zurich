# STARTUP

## Prerequisites
Run all commands from the project root directory.

```
cd "C:\Users\robin\Documents\GitHub\hidden-infrastructures-zurich"
```

---

## Local development (desktop browser)

**Start Vite dev server:**
```
npx vite --host
```
Open http://localhost:8080 in browser.

---

## Docker (production build, local)

```
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures
```
Open http://localhost:8080 in browser.

**Stop container:**
```
docker stop $(docker ps -q --filter ancestor=hidden-infrastructures)
```

---

## Mobile testing (phone GPS + real device)

**Terminal 1 — start Vite dev server:**
```
npx vite --host
```

**Terminal 2 — start Cloudflare tunnel:**
```
npx cloudflared tunnel --url http://localhost:8080
```
Copy the `trycloudflare.com` URL from Terminal 2 output.
Open it in a **new tab** on your phone (do not follow a link — type it directly).

---

## Shut down

**Kill Cloudflare tunnel (Windows):**
```
taskkill //IM cloudflared.exe //F
```

**Kill Vite:**
`Ctrl+C` in Terminal 1.

---

## Notes
- Vite and nginx (Docker) both set required COEP/COOP headers for AudioWorklet + SharedArrayBuffer
- `allowedHosts: true` in vite.config.js permits any Cloudflare tunnel hostname
- The tunnel URL changes every session
- GeoJSON data files are served from `public/data/` (Vite) or copied into the Docker image at build time
