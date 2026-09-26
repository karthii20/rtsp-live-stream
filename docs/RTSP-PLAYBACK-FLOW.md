# How RTSP is played in the browser

This document describes the end-to-end flow used by **rtsp_stream** (Next.js) and the **hevc-player** npm package.

Browsers cannot open `rtsp://` URLs. Playback works by remuxing RTSP on a Node gateway into HTTP MPEG-TS (video copy + audio normalized to AAC), then decoding H.264/H.265 and AAC with WebAssembly in the browser.

**No MediaMTX (or other RTSP proxy) is required.** Paste the camera/NVR RTSP URL; the package gateway pulls it directly. Shared remux means many viewers of the same URL share **one** FFmpeg process.

---

## Architecture overview

```text
┌─────────────────┐
│ Camera / NVR    │
└────────┬────────┘
         │ RTSP (TCP)
         ▼
┌─────────────────┐
│ hevc-player     │  FFmpeg: -c:v copy; audio → AAC when present
│ gateway :3002   │  1 source URL → 1 FFmpeg → N viewers
└────────┬────────┘
         │ HTTP  video/mp2t
         ▼
┌─────────────────┐
│ Next.js app     │  UI + rewrite /v1 → gateway
│ :3000           │  Serves Next UI; hevc-player bundles WASM in the package
└────────┬────────┘
         │ same-origin /v1/stream?ticket=…
         ▼
┌─────────────────┐
│ Browser         │  hevc-player WASM decode
│ (Chrome, etc.)  │  H.264 / H.265 + AAC → video + sound
└─────────────────┘
```

An optional RTSP proxy (MediaMTX, etc.) can sit in front of cameras if you already use one — paste its `rtsp://` URL the same way. It is **not** part of this stack.

---

## Sequence flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as Next.js UI<br/>(browser)
    participant Next as Next.js server<br/>:3000
    participant GW as hevc-player gateway<br/>:3002
    participant FF as FFmpeg
    participant Cam as Camera / NVR<br/>RTSP

    User->>UI: Paste rtsp://… and click Play
    UI->>UI: classifyPasteUrl (optional helper)

    UI->>Next: POST /v1/sessions<br/>{ url: "rtsp://…" }
    Next->>GW: rewrite → POST /v1/sessions
    GW->>GW: validate URL, create ticket
    Note over GW: Optional FFmpeg probe
    GW-->>Next: { streamUrl: "…/v1/stream?ticket=abc" }
    Next-->>UI: same JSON
    UI->>UI: use relative /v1/stream?ticket=abc

    UI->>Next: GET /v1/stream?ticket=abc
    Next->>GW: rewrite → GET /v1/stream?ticket=abc
    GW->>GW: redeem ticket → RTSP URL
    GW->>FF: shared remux (copy → MPEG-TS)
    FF->>Cam: RTSP DESCRIBE / SETUP / PLAY
    Cam-->>FF: H.264 or H.265 elementary stream
    FF-->>GW: MPEG-TS bytes on stdout
    GW-->>Next: HTTP 200 video/mp2t (chunked)
    Next-->>UI: MPEG-TS body

    UI->>UI: WASM demux + decode
    UI-->>User: Live video frames
```

---

## Component flow (who does what)

```mermaid
flowchart TB
    subgraph Sources
        A[rtsp://user:pass@camera/...]
    end

    subgraph Browser
        C[Paste URL]
        D[classifyPasteUrl]
        E[POST /v1/sessions]
        F[createStreamPlayer]
        G[WASM H.264 / H.265 + AAC]
        H[Render frames]
    end

    subgraph Nextjs["Next.js :3000"]
        I[UI + hevc-player bundled WASM]
        J["Rewrite /v1 → gateway"]
    end

    subgraph Gateway["hevc-player gateway :3002"]
        K[Validate + ticket]
        L[Shared remux hub]
        M[1× FFmpeg -c:v copy]
        N[HTTP MPEG-TS fan-out]
    end

    A --> C
    C --> D --> E
    E --> I --> J --> K
    K --> L --> M
    M --> N
    N --> J
    J --> F --> G --> H
```

---

## Step-by-step detail

### 1. User pastes a URL

Example (direct camera / NVR):

```text
rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101
```

### 2. Browser registers a remux session

```http
POST /v1/sessions
Content-Type: application/json

{ "url": "rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101" }
```

The browser calls **Next.js** (same origin), not the camera.

### 3. Next.js proxies to the gateway

Configured in `next.config.ts`:

```text
/v1/:path*  →  HEVC_GATEWAY_URL/v1/:path*
             (default http://127.0.0.1:3002)
```

`127.0.0.1` here means “gateway on the same host as Next,” not “the user’s camera.”

### 4. Gateway creates a ticket

1. Validates the URL (rtsp, hls, srt, rtmp, …)
2. Optionally probes with FFmpeg
3. Stores the source URL under a random ticket id
4. Returns a play URL, e.g. `/v1/stream?ticket=abc…`

Tickets keep credentials out of long-lived browser URLs and access logs.

### 5. Gateway remuxes when the stream is opened

On `GET /v1/stream?ticket=…`:

1. Look up the RTSP URL from the ticket
2. Subscribe to the **shared remux hub** for that URL (one FFmpeg per unique source)
3. FFmpeg roughly as:

   ```text
   ffmpeg -rtsp_transport tcp -i <rtsp>
          -map 0:v:0 -an -c:v copy -f mpegts pipe:1
   ```

4. Fan out stdout as `Content-Type: video/mp2t` to all viewers of that source

**Copy** means no video re-encode: H.265 stays H.265, H.264 stays H.264. When audio is present, the gateway normalizes it to AAC (48 kHz stereo). Latency stays low; CPU cost on the server is small.

### 6. WASM player decodes in the browser

`createStreamPlayer` / `createHevcPlayer`:

1. Loads the player + WASM from the hevc-player package (bundled Blob URLs; no public/ copy)
2. Fetches the MPEG-TS HTTP stream
3. Demuxes and decodes in a worker
4. Draws frames (WebGL / canvas)

Requires COOP/COEP headers for SharedArrayBuffer workers:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

## Processes that must be running

| Process | Role | Typical command |
|--------|------|-----------------|
| Next.js | UI, assets, `/v1` proxy | part of `pnpm run dev` / `pnpm run start` |
| hevc-player gateway | RTSP → MPEG-TS | same scripts (spawns `hevc-player gateway`) |
| FFmpeg | Remux binary on PATH | installed on the host |
| Camera / NVR | RTSP publisher | external |

The npm package **ships** the gateway code. A **running Node process** must execute it. Browsers cannot run FFmpeg or open RTSP themselves.

```text
pnpm run dev    →  gateway + Next (development)
pnpm run start  →  gateway + Next (production, after build)
```

---

## Data on the wire

| Hop | Protocol | Payload |
|-----|----------|---------|
| Camera → gateway | RTSP over TCP | H.264 or H.265 elementary stream |
| Gateway → Next → browser | HTTP | MPEG-TS (`video/mp2t`) |
| Inside browser | — | Decoded YUV/RGB frames |

---

## What this path is not

| Not used for main H.265 path | Why |
|------------------------------|-----|
| Raw RTSP in the browser | No browser RTSP API |
| WebRTC / WHEP as default | Native HEVC WebRTC is not portable |
| Server transcode to another codec | Remux only (`-c:v copy`) |
| MediaMTX / OME required | Package pulls camera RTSP directly |

Optional WHEP exists in the package for native WebRTC when codecs allow; reliable H.265 on all browsers uses the remux + WASM path above.

---

## Env knobs (rtsp_stream)

| Variable | Meaning |
|----------|---------|
| `HEVC_GATEWAY_URL` | Where Next rewrites `/v1` (default `http://127.0.0.1:3002`) |
| `HEVC_GATEWAY_PORT` | Gateway listen port |
| `GATEWAY_ORIGINS` | Allowed browser Origins for the gateway |
| `HOSTNAME` / `PORT` | Next bind address |
| `STREAM_MAX_CONNECTIONS` | Max concurrent HTTP viewers (default 64) |
| `STREAM_MAX_SOURCES` | Max unique camera remuxes / FFmpeg (default 64) |

See `.env.example` in this project.

---

## One-line summary

**RTSP is pulled by the hevc-player gateway with FFmpeg, remuxed to MPEG-TS over HTTP (video copy + optional AAC audio), proxied through Next.js, and decoded by WASM in the browser — no MediaMTX required.**
