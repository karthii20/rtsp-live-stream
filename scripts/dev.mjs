#!/usr/bin/env node
/**
 * Start hevc-player gateway + Next.js together.
 * Browsers cannot open RTSP; the gateway remuxes to MPEG-TS for the WASM player.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, "..");
const require = createRequire(import.meta.url);
const hevcRoot = dirname(require.resolve("hevc-player/package.json"));
const cli = join(hevcRoot, "scripts/cli.mjs");
const nextBin = join(root, "node_modules/next/dist/bin/next");

const children = [];

function run(label, file, args, env = {}) {
  const child = spawn(process.execPath, [file, ...args], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  child.on("exit", (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
      shutdown(code);
    }
  });
  children.push(child);
}

function shutdown(code = 0) {
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* already gone */
    }
  }
  process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

console.log("[rtsp_stream] hevc-player gateway on :3002 …");
run("gateway", cli, [
  "gateway",
  "--port",
  "3002",
  "--origins",
  "http://127.0.0.1:3000,http://localhost:3000",
]);

setTimeout(() => {
  console.log("[rtsp_stream] Next.js on :3000 …");
  run("next", nextBin, ["dev", "--hostname", "127.0.0.1", "--port", "3000"]);
}, 700);
