export const FAQS: { q: string; a: string }[] = [
  {
    q: "Can browsers play RTSP directly?",
    a: "No. Chrome, Firefox, Safari, and Edge cannot open an rtsp:// URL in a normal <video> tag. You need a small server-side gateway that turns RTSP into something the browser understands (HTTP MPEG-TS, HLS, or WebRTC). This demo uses the hevc-player gateway for that step.",
  },
  {
    q: "How do I play an RTSP stream in the browser?",
    a: "Use a gateway that can reach your camera, then paste its RTSP URL above and click Play, or install the hevc-player npm package, run npx hevc-player gateway, use startLiveStreamPlayer with createRemuxSession in its resolveUrl callback for automatic reconnection.",
  },
  {
    q: "Will H.265 / HEVC work in Chrome without plugins?",
    a: "The package supports this through software decoding; performance depends on your device and stream settings. hevc-player ships WASM (WebAssembly) decoders for H.265 and H.264, so you are not limited to browsers with native HEVC. Audio is normalized to AAC for playback.",
  },
  {
    q: "What is the difference between an RTSP player and a browser player?",
    a: "A desktop RTSP player (VLC, Onvif tools) speaks RTSP natively. A browser player needs HTTP or WebRTC. hevc-player bridges both: the gateway speaks RTSP to the camera; the page speaks MPEG-TS over HTTP to WASM.",
  },
  {
    q: "Why does my IP camera work on localhost but not on a hosted site?",
    a: "Private addresses like 192.168.1.x are only reachable on your LAN. The hosted gateway runs in the cloud and cannot open that RTSP path unless you VPN, tunnel, or run the gateway on a machine that shares the camera’s network.",
  },
];

