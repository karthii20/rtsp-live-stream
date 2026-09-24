# RTSP Live Stream — hevc-player demo

**Play RTSP camera streams in any modern browser** — H.264 / H.265 (HEVC) video with AAC audio, no plugins.

| | |
|---|---|
| **Live demo** | [https://thertsp.in](https://thertsp.in/) |
| **Source** | [github.com/karthii20/rtsp-live-stream](https://github.com/karthii20/rtsp-live-stream) |
| **npm package** | [hevc-player](https://www.npmjs.com/package/hevc-player) (`0.4.0`) |
| **Docker image** | `ghcr.io/karthii20/rtsp-live-stream:latest` |

This repository is **public and open source**. It is a working Next.js demo of the [`hevc-player`](https://www.npmjs.com/package/hevc-player) npm package: paste a camera `rtsp://` URL, remux on the server, and decode in the browser with WebAssembly.

---

## About this project

Browsers cannot open RTSP natively. Chrome, Firefox, Safari, and Edge have no built-in `rtsp://` support in a normal `<video>` tag.

**What this app does:**

1. You paste an IP camera / NVR RTSP URL in the UI.
2. A small **hevc-player gateway** (FFmpeg remux) turns that RTSP into HTTP MPEG-TS — video is copied (H.264 or H.265), audio is normalized to AAC.
3. Next.js proxies same-origin `/v1` to the gateway (so the browser never talks to the gateway port directly).
4. The **WASM player** in the page decodes H.264 / H.265 + AAC and shows live video (with optional sound).

```text
Browser  →  Next.js (/v1 rewrite)  →  hevc-player gateway  →  FFmpeg remux  →  camera RTSP
                ↓
         WASM player (H.264 / H.265 + AAC)
```

**Who it’s for**

- Developers evaluating [hevc-player](https://www.npmjs.com/package/hevc-player) before wiring it into their own app  
- Teams that need a quick **RTSP → browser** path for H.264 / H.265 cameras  
- Anyone searching for “play RTSP in browser” / “HEVC web player” who wants a runnable example  

**What it is not**

- Not a full NVR or recording system  
- Not MediaMTX-based — paste the camera URL directly; MediaMTX is not required  
- A hosted demo can only reach cameras **reachable from that server** (LAN `192.168.x.x` URLs work on your PC, not from the cloud unless you tunnel/VPN)

**Try it live:** [thertsp.in](https://thertsp.in/) · **Clone & run:** this repo  

Detailed flow diagrams: [docs/RTSP-PLAYBACK-FLOW.md](./docs/RTSP-PLAYBACK-FLOW.md)

---

## Requirements

1. Node.js **20.12+**
2. **FFmpeg on PATH** (`ffmpeg -version`)
3. `pnpm install` + `pnpm run setup`
4. **Both** Next.js **and** the gateway must be running

## Run locally

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

Playback starts muted — click **Sound** after Play (browser autoplay policy).

## Env (`.env`)

See [`.env.example`](./.env.example):

```bash
HEVC_GATEWAY_URL=http://127.0.0.1:3002   # Next server → gateway
HEVC_GATEWAY_PORT=3002
PORT=3000
HOSTNAME=0.0.0.0                          # allow LAN access
PUBLIC_ORIGIN=http://127.0.0.1:3000       # exact URL in the address bar
NEXT_PUBLIC_SITE_URL=https://thertsp.in   # SEO (canonical, sitemap, OG)
GATEWAY_ORIGINS=http://127.0.0.1:3000,http://localhost:3000
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

## Why it failed on another system

The rewrite in `next.config.ts` is **not** “the camera URL.” It is only how the Next.js **server** reaches the remux gateway:

```ts
destination: `${HEVC_GATEWAY_URL}/v1/:path*`
// default → http://127.0.0.1:3002/v1/:path*
```

| Situation | Result |
|---|---|
| You only ran `next start` / `next dev` | `/v1` → 500 — **gateway not running** |
| Gateway not installed / no FFmpeg | Remux fails |
| Camera RTSP not reachable from that PC | Probe / stream fails |
| You open `http://192.168.x.x:3000` but CORS origins only list localhost | May fail — set `GATEWAY_ORIGINS` / `PUBLIC_ORIGIN` |

`127.0.0.1` is correct when **Next and the gateway run on the same machine**. The browser calls same-origin `/v1`; Next proxies to the local gateway.

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
  -e NEXT_PUBLIC_SITE_URL=https://thertsp.in \
  ghcr.io/karthii20/rtsp-live-stream:latest
```

Or with Compose:

```bash
# .env next to docker-compose.yml:
# PUBLIC_ORIGIN=https://thertsp.in
# NEXT_PUBLIC_SITE_URL=https://thertsp.in

docker compose up -d
```

Open the same URL you set in `PUBLIC_ORIGIN`.

> First pull from GHCR may require `docker login ghcr.io` (GitHub username + a PAT with `read:packages`), or make the package public under **Packages** on the repo.

### “Forbidden” / CORS on a server

That is the gateway origin check, not a Next.js bug. Fix:

```bash
export PUBLIC_ORIGIN=https://thertsp.in   # must match the address bar exactly
docker compose up -d --force-recreate
```

The COOP console warning on plain HTTP + public IP is expected (browsers only fully trust HTTPS or localhost). Production at [thertsp.in](https://thertsp.in/) should use HTTPS.

## Use the package in your own app

This demo is the reference UI. For your product, install the library:

```bash
npm install hevc-player@0.4.0
npx hevc-player-copy-assets public
npx hevc-player gateway --port 3002
```

```js
import {
  createStreamPlayer,
  createRemuxSession,
  preloadHevcPlayer,
} from "hevc-player";

await preloadHevcPlayer();

const streamUrl = await createRemuxSession("rtsp://camera/stream", {
  gatewayUrl: "", // same-origin /v1 proxy
});

const player = await createStreamPlayer(container, {
  url: streamUrl,
  live: true,
  mode: "software",
  audio: true,
  muted: true,
});
```

Full API docs: [npmjs.com/package/hevc-player](https://www.npmjs.com/package/hevc-player)

## License & contributing

This demo repo is open source on GitHub: [karthii20/rtsp-live-stream](https://github.com/karthii20/rtsp-live-stream).

Issues and pull requests are welcome — especially docs, Docker/deploy tips, and UI accessibility fixes.

The underlying player/gateway is the separate **hevc-player** package on npm; this project shows how to run it end-to-end with Next.js.
