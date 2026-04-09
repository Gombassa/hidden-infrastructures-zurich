# STARTUP

## Prerequisites
Run all commands from the project root directory (hiddeninfrastructures-zurich/).

```
cd "C:\Users\robin\Documents\GitHub\hidden-infrastructures-zurich"
```

---

## Local development (desktop browser only)

**Terminal 1 — start Vite dev server:**
```
npx vite --host
```
Open http://localhost:8080 in browser.

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

## Docker (local test)

```bash
cd C:\Users\robin\Documents\GitHub\hidden-infrastructures-zurich
docker build -t hidden-infrastructures .
docker run -p 8080:80 hidden-infrastructures
```

---

## Shut down

**Kill Cloudflare tunnel (Windows):**
```bash
taskkill /IM cloudflared.exe /F
```

**Kill Vite:**
`Ctrl+C` in Terminal 1.

---

## Notes
- Vite sets required COEP/COOP headers for AudioWorklet + SharedArrayBuffer
- `allowedHosts: true` in vite.config.js permits any Cloudflare tunnel hostname
- The tunnel URL changes every session
