#!/usr/bin/env node
/**
 * Start hevc-player gateway + Next.js together (dev or production).
 *
 * Usage:
 *   node scripts/dev.mjs          # next dev
 *   node scripts/dev.mjs start    # next start (after pnpm build)
 *
 * Env (see .env.example): HEVC_GATEWAY_PORT, PORT, HOSTNAME, GATEWAY_ORIGINS
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, "..");
const require = createRequire(import.meta.url);
const hevcRoot = dirname(require.resolve("hevc-player/package.json"));
const cli = join(hevcRoot, "scripts/cli.mjs");
const nextBin = join(root, "node_modules/next/dist/bin/next");

const mode = process.argv[2] === "start" ? "start" : "dev";
const gatewayPort = process.env.HEVC_GATEWAY_PORT || "3002";
const appPort = process.env.PORT || "3000";
const hostname = process.env.HOSTNAME || "0.0.0.0";
const origins =
  process.env.GATEWAY_ORIGINS ||
  [
    `http://127.0.0.1:${appPort}`,
    `http://localhost:${appPort}`,
  ].join(",");

if (existsSync(join(root, ".env")) && typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(join(root, ".env"));
  } catch {
    /* optional */
  }
}

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

console.log(`[rtsp_stream] hevc-player gateway on :${gatewayPort} …`);
run(
  "gateway",
  cli,
  [
    "gateway",
    "--port",
    gatewayPort,
    "--host",
    "127.0.0.1",
    "--origins",
    origins,
  ],
  {
    ALLOW_LOOPBACK_ORIGINS: process.env.ALLOW_LOOPBACK_ORIGINS || "true",
    STREAM_PUBLIC_URL:
      process.env.STREAM_PUBLIC_URL || `http://127.0.0.1:${gatewayPort}`,
  },
);

setTimeout(() => {
  console.log(`[rtsp_stream] Next.js (${mode}) on ${hostname}:${appPort} …`);
  console.log(
    `[rtsp_stream] /v1 → ${process.env.HEVC_GATEWAY_URL || `http://127.0.0.1:${gatewayPort}`}`,
  );
  run("next", nextBin, [mode, "--hostname", hostname, "--port", appPort]);
}, 700);
