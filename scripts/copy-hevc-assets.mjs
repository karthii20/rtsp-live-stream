#!/usr/bin/env node
/**
 * pnpm's bin shim does not always satisfy hevc-player-copy-assets' "invoked" check.
 * Call the exporter directly so WASM + vendor land in public/.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const hevcRoot = dirname(require.resolve("hevc-player/package.json"));
const script = join(hevcRoot, "scripts/copy-assets.mjs");
const { copyHevcPlayerAssets } = await import(pathToFileURL(script).href);
await copyHevcPlayerAssets(process.argv[2] || "public");
