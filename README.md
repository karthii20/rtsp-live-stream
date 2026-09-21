# RTSP Stream (Next.js + hevc-player from npm)

Paste a direct **RTSP** URL and play **H.264 / H.265** in the browser.

Everything comes from the **`hevc-player` npm package** — no local `file:` path and no hevc-studio checkout.

```text
rtsp://…  →  hevc-player gateway (from node_modules)  →  Next /v1 rewrite  →  WASM player
```

| Piece | Comes from |
|---|---|
| Browser WASM player | `import { … } from "hevc-player"` |
| Remux gateway | `pnpm exec hevc-player gateway` (bin in the package) |
| WASM / vendor assets | `pnpm run setup` → package `copy-assets` |

## Requirements

- Node.js 20.12+ (22+ recommended)
- **FFmpeg** on `PATH` (the gateway shells out to it)
- A reachable RTSP camera or MediaMTX path

## Setup

```bash
cd /home/katomaran/Public/Projects/rtsp_stream
pnpm install
pnpm run setup
```

## Run

```bash
pnpm run dev
```

Opens **http://127.0.0.1:3000**. Paste e.g. `rtsp://127.0.0.1:8554/camera1` → **Play**.

Or two terminals:

```bash
pnpm run gateway   # hevc-player CLI from node_modules → :3002
pnpm run dev:web   # Next.js → :3000
```

## Why the gateway still runs as a local process

A browser **cannot** open `rtsp://` itself. The npm package ships a small **Node** server (`hevc-player gateway`) that remuxes RTSP → MPEG-TS. You install it with the package; you just start the CLI from `node_modules`. That is still “depending on the npm package,” not on hevc-studio.

## Upgrade later

When `hevc-player@0.3.1+` is published (includes `createRemuxSession`):

```bash
pnpm add hevc-player@latest
```

You can then replace `src/lib/openRemuxSession.ts` with the package helper if you want.
