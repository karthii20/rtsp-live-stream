import type { NextConfig } from "next";

/**
 * Where the Next.js *server* forwards /v1/* (hevc-player remux gateway).
 * Override with HEVC_GATEWAY_URL when the gateway runs on another host/port.
 * Browsers still call same-origin /v1 — they never see this URL.
 */
const gatewayUrl = (
  process.env.HEVC_GATEWAY_URL ||
  `http://127.0.0.1:${process.env.HEVC_GATEWAY_PORT || "3002"}`
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  transpilePackages: ["hevc-player"],

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

  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${gatewayUrl}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
