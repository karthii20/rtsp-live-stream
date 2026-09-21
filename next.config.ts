import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ESM package with .js imports inside dist/
  transpilePackages: ["hevc-player"],

  // SharedArrayBuffer / WASM workers used by the HEVC decoder
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },

  // Same-origin /v1 → package gateway (avoids CORS when pasting RTSP)
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: "http://127.0.0.1:3002/v1/:path*",
      },
    ];
  },
};

export default nextConfig;
