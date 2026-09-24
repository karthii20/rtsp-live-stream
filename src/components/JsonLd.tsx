type JsonLdProps = {
  siteUrl: string;
};

/**
 * Structured data for Google rich results (SoftwareApplication + FAQPage).
 * Helps SEO for “play RTSP in browser” and related developer searches.
 */
export function JsonLd({ siteUrl }: JsonLdProps) {
  const software = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "hevc-player",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description:
      "H.264 / H.265 (HEVC) WASM browser player with an FFmpeg RTSP remux gateway. Play IP camera streams in Chrome, Firefox, and Edge.",
    url: siteUrl,
    softwareVersion: "0.4.0",
    downloadUrl: "https://www.npmjs.com/package/hevc-player",
    codeRepository: "https://www.npmjs.com/package/hevc-player",
  };

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Play RTSP in Browser — hevc-player demo",
    url: siteUrl,
    description:
      "Free online demo to play RTSP camera streams in the browser with H.264, H.265, and AAC audio.",
    applicationCategory: "MultimediaApplication",
    browserRequirements: "Requires HTML5 and WebAssembly",
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can browsers play RTSP directly?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Modern browsers cannot open rtsp:// URLs in a video element. You need a gateway that remuxes RTSP to a browser-friendly format such as HTTP MPEG-TS, HLS, or WebRTC. hevc-player includes that gateway.",
        },
      },
      {
        "@type": "Question",
        name: "How do I play an RTSP stream in the browser?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Install hevc-player, run the bundled gateway with FFmpeg, register your camera with createRemuxSession, then play with createStreamPlayer. Or use this live demo: paste your RTSP URL and click Play.",
        },
      },
      {
        "@type": "Question",
        name: "Does this play H.265 / HEVC in Chrome?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. hevc-player uses WebAssembly software decode for H.265 / HEVC and H.264, so playback does not depend on GPU HEVC support in the browser.",
        },
      },
      {
        "@type": "Question",
        name: "Why does my LAN camera work locally but not on a hosted site?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The remux gateway must reach the camera. A private IP like 192.168.x.x is reachable from your LAN but not from a cloud server. Host the gateway on a machine that can open the RTSP URL, or expose the camera via VPN.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(software) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}
