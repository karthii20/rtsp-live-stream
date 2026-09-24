const NPM_URL = "https://www.npmjs.com/package/hevc-player";

const FAQS: { q: string; a: string }[] = [
  {
    q: "Can browsers play RTSP directly?",
    a: "No. Chrome, Firefox, Safari, and Edge cannot open an rtsp:// URL in a normal <video> tag. You need a small server-side gateway that turns RTSP into something the browser understands (HTTP MPEG-TS, HLS, or WebRTC). This demo uses the hevc-player gateway for that step.",
  },
  {
    q: "How do I play an RTSP stream in the browser?",
    a: "Paste your camera’s RTSP URL above and click Play, or install the hevc-player npm package, run npx hevc-player gateway, call createRemuxSession with the camera URL, then createStreamPlayer with the returned MPEG-TS URL.",
  },
  {
    q: "Will H.265 / HEVC work in Chrome without plugins?",
    a: "Yes on this stack. hevc-player ships WASM (WebAssembly) decoders for H.265 and H.264, so you are not limited to browsers with native HEVC. Audio is normalized to AAC for playback.",
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

/**
 * SEO / education section targeting high-intent searches.
 */
export function SeoContent() {
  return (
    <article className="mx-auto w-full max-w-6xl space-y-12 border-t border-[var(--line-soft)] px-4 py-12">
      <header className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          How to play RTSP in a browser (H.264 &amp; H.265)
        </h2>
        <p className="max-w-3xl text-base leading-relaxed text-[var(--muted-strong)]">
          Searching for an{" "}
          <strong className="font-semibold text-[var(--foreground)]">
            RTSP player in the browser
          </strong>
          , an{" "}
          <strong className="font-semibold text-[var(--foreground)]">
            H.265 / HEVC web player
          </strong>
          , or a way to{" "}
          <strong className="font-semibold text-[var(--foreground)]">
            stream an IP camera in Chrome
          </strong>
          ? Browsers block raw RTSP. This live demo shows a practical path:
          remux the camera with the{" "}
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent-bright)] underline-offset-2 hover:underline"
          >
            hevc-player
          </a>{" "}
          gateway, then decode H.264 / H.265 and AAC in-page with WebAssembly.
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="why-rtsp-browser">
        <h3
          id="why-rtsp-browser"
          className="text-lg font-semibold text-[var(--foreground)]"
        >
          Why “play RTSP in browser” needs a gateway
        </h3>
        <p className="max-w-3xl text-sm leading-relaxed text-[var(--muted-strong)]">
          IP cameras and NVRs almost always expose{" "}
          <code className="rounded bg-[var(--surface)] px-1.5 py-0.5 text-[var(--accent-bright)]">
            rtsp://
          </code>{" "}
          for live view. That protocol is perfect for VLC and recorders, but web
          pages expect HTTP or WebRTC. Converting RTSP → MPEG-TS (video copy,
          audio to AAC) keeps latency low without re-encoding video, then the
          WASM player renders frames in any modern browser—including cameras
          that only offer H.265.
        </p>
      </section>

      <section className="space-y-3" aria-labelledby="who-its-for">
        <h3
          id="who-its-for"
          className="text-lg font-semibold text-[var(--foreground)]"
        >
          Who this RTSP web player is for
        </h3>
        <ul className="grid gap-3 text-sm text-[var(--muted-strong)] sm:grid-cols-2">
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">
              Developers &amp; integrators
            </p>
            Build an IP camera web viewer or live wall with an npm package
            instead of a custom FFmpeg pipeline.
          </li>
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">
              Security &amp; IoT teams
            </p>
            Preview H.264 / H.265 RTSP feeds in Chrome or Edge without
            installing a desktop RTSP client for every operator.
          </li>
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">
              HEVC troubleshooting
            </p>
            When “H.265 RTSP not working” in a browser path, WASM decode avoids
            depending on scarce native HEVC support.
          </li>
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">
              npm package evaluators
            </p>
            Try{" "}
            <a
              href={NPM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--accent-bright)] underline-offset-2 hover:underline"
            >
              hevc-player on npm
            </a>{" "}
            end-to-end before wiring it into React or Next.js.
          </li>
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="faq-heading">
        <h3
          id="faq-heading"
          className="text-lg font-semibold text-[var(--foreground)]"
        >
          RTSP browser player FAQ
        </h3>
        <dl className="space-y-3">
          {FAQS.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4"
            >
              <dt className="font-semibold text-[var(--foreground)]">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm text-[var(--muted)]">
        Related searches this page targets: play RTSP in browser, RTSP player
        browser, H.265 browser player, HEVC web player, stream IP camera in
        browser, RTSP H.264 H.265 WASM player.
      </p>
    </article>
  );
}
