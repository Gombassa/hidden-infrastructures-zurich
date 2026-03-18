# STARTUP

## 1. Launch local server
```
npx http-server . -p 8080
```

## 2. Launch Cloudflare tunnel
```
npx cloudflared tunnel --url http://localhost:8080
```
Navigate to `/prototypes/01-audio-sketches/` after the tunnel URL.

## 3. Kill Cloudflare tunnel
```
pkill cloudflared
```

## 4. Kill local server
`Ctrl+C` in the terminal running http-server.