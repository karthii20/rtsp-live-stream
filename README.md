# hevc-player demo

Live demo of the [`hevc-player`](https://www.npmjs.com/package/hevc-player) npm package (**0.4.0**):
paste a direct **RTSP** URL and play **H.264 / H.265 video with AAC audio** in the browser.

**Package:** [npmjs.com/package/hevc-player](https://www.npmjs.com/package/hevc-player)

**Full working flow (with diagrams):** [docs/RTSP-PLAYBACK-FLOW.md](./docs/RTSP-PLAYBACK-FLOW.md)

```text
Browser  →  Next.js (/v1 rewrite)  →  hevc-player gateway  →  FFmpeg remux  →  camera RTSP
                ↓
         WASM player (H.264 / H.265 + AAC)
```

Browsers cannot open RTSP natively. The package’s gateway remuxes RTSP → MPEG-TS (video copy + audio to AAC); the WASM player decodes both in-page. Playback starts muted — click **Enable sound** after Play.
**MediaMTX is not required.** Paste the camera/NVR `rtsp://` URL directly. Shared remux in the gateway means many viewers of the same URL share one FFmpeg (one pull per camera, not per browser tab).
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

**Important:** the gateway only accepts listed browser origins. If you open
`http://YOUR_SERVER_IP:3000` but `PUBLIC_ORIGIN` is still localhost, you get **Forbidden** on `/v1/sessions`.

```bash
docker pull ghcr.io/karthii20/rtsp-live-stream:latest

docker run --rm -p 3000:3000 \
  -e PUBLIC_ORIGIN=http://YOUR_SERVER_IP:3000 \
  ghcr.io/karthii20/rtsp-live-stream:latest
```

Or with Compose:

```bash
# .env next to docker-compose.yml:
# PUBLIC_ORIGIN=http://169.58.70.166:3000

docker compose up -d
```

Open the same URL you set in `PUBLIC_ORIGIN`.

> First pull from GHCR may require `docker login ghcr.io` (GitHub username + a PAT with `read:packages`), or make the package public under **Packages** on the repo.

### “Forbidden” / CORS on a server

That is the gateway origin check, not a Next.js bug. Fix:

```bash
export PUBLIC_ORIGIN=http://169.58.70.166:3000   # must match the address bar exactly
docker compose up -d --force-recreate
```

The COOP console warning on plain HTTP + public IP is expected (browsers only fully trust HTTPS or localhost). For production, put HTTPS in front (Caddy/nginx + Let’s Encrypt).