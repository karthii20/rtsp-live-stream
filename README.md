# RTSP Stream (Next.js + hevc-player from npm)

Paste a direct **RTSP** URL and play **H.264 / H.265** in the browser.

```text
Browser  →  Next.js (/v1 rewrite)  →  hevc-player gateway  →  FFmpeg remux  →  camera RTSP
                ↓
         WASM player (H.264 / H.265)
```

## Requirements (every machine)

1. Node.js 20.12+  
2. **FFmpeg on PATH** (`ffmpeg -version`)  
3. `pnpm install` + `pnpm run setup`  
4. **Both** Next.js **and** the gateway must be running  

## Run (recommended)

```bash
cp .env.example .env   # edit if needed
pnpm install
pnpm run setup
pnpm run dev           # gateway :3002 + Next :3000 together
```

Production:

```bash
pnpm run build
pnpm run start         # gateway + next start together
```

Open `http://127.0.0.1:3000` (or this machine’s LAN IP).

## Why it failed on another system

The rewrite in `next.config.ts` is **not** “the camera URL.” It is only how the Next.js **server** reaches the remux gateway:

```ts
destination: `${HEVC_GATEWAY_URL}/v1/:path*`
// default → http://127.0.0.1:3002/v1/:path*
```

That means:

| Situation | Result |
|---|---|
| You only ran `next start` / `next dev` | `/v1` → 500 — **gateway not running** |
| Gateway not installed / no FFmpeg | Remux fails |
| Camera RTSP not reachable from that PC | Probe / stream fails |
| You open `http://192.168.x.x:3000` but CORS origins only list localhost | May fail — set `GATEWAY_ORIGINS` |

`127.0.0.1` here is correct when **Next and the gateway run on the same machine**. The browser never talks to `:3002` directly; it calls same-origin `/v1`, and Next proxies to the local gateway.

## Env (`.env`)

See `.env.example`:

```bash
HEVC_GATEWAY_URL=http://127.0.0.1:3002   # Next server → gateway
HEVC_GATEWAY_PORT=3002
PORT=3000
HOSTNAME=0.0.0.0                          # allow LAN access
# Every origin users type in the browser address bar:
GATEWAY_ORIGINS=http://127.0.0.1:3000,http://localhost:3000,http://192.168.1.10:3000
ALLOW_LOOPBACK_ORIGINS=true
```

If the gateway runs on **another host**:

```bash
HEVC_GATEWAY_URL=http://gateway-host:3002
```

## Checklist on a new machine

```bash
ffmpeg -version
pnpm install && pnpm run setup
curl -s http://127.0.0.1:3002/health   # after pnpm run start / dev
# expect: {"ok":true,"service":"streaming",...}
```

If health fails, RTSP playback cannot work — start the gateway (`pnpm run gateway` or `pnpm run start`).

## Docker

On every push to `main`, GitHub Actions builds and publishes:

`ghcr.io/karthii20/rtsp-live-stream:latest`

(also tagged `sha-<commit>`).

### Run the published image

```bash
docker pull ghcr.io/karthii20/rtsp-live-stream:latest

docker run --rm -p 3000:3000 \
  -e GATEWAY_ORIGINS=http://127.0.0.1:3000,http://localhost:3000 \
  ghcr.io/karthii20/rtsp-live-stream:latest
```

Or with Compose (builds locally if the image is missing):

```bash
docker compose up --build
```

Open `http://127.0.0.1:3000`. If you browse via a LAN IP, add that origin to `GATEWAY_ORIGINS`.

> First pull from GHCR may require `docker login ghcr.io` (GitHub username + a PAT with `read:packages`), or make the package public under **Packages** on the repo.
