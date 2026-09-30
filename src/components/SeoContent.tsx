const NPM_URL = "https://www.npmjs.com/package/hevc-player";

import { FAQS } from "@/lib/rtspFaq";

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
          Play an IP camera or NVR stream in a web page using the open-source
          hevc-player demo. Its FFmpeg gateway converts RTSP to HTTP MPEG-TS,
          and WebAssembly decodes H.264 / H.265 video with AAC audio. You can
          try a stream reachable from this server, or run the same app on your
          camera’s network using Docker.

        </p>
      </header>

      <section id="how-to-play-rtsp" className="space-y-4">
        <h3 className="text-xl font-semibold">Play an RTSP camera stream in Chrome or Firefox</h3>
        <ol className="list-decimal space-y-3 pl-5 text-[var(--muted-strong)]">
          <li>Find the RTSP URL in your camera or NVR settings. Confirm the address and credentials using VLC on the camera’s network.</li>
          <li>Choose where to run the gateway. For a private IP camera, run this app locally or give your server a VPN route to the camera network.</li>
          <li>Paste the RTSP URL into the player above and select Play. The server remuxes the stream; your browser decodes the video.</li>
          <li>Select Sound to enable audio. If playback fails, check gateway connectivity, camera credentials, and FFmpeg availability.</li>
        </ol>
        <p className="text-[var(--muted-strong)]">The hosted demo cannot reach a camera at 192.168.x.x just because your browser is on the same Wi-Fi. Camera URLs and credentials are sent to the gateway. For private cameras, use your own deployment.</p>
      </section>

      <section id="rtsp-react-player" className="space-y-3">
        <h3 className="text-xl font-semibold">Add an RTSP player to React, Next.js, or a JavaScript website</h3>
        <p className="text-[var(--muted-strong)]">Use the install and code example above to start the Node.js gateway and connect your UI. The live-player API registers fresh stream tickets when reconnecting. WASM decoder assets are bundled with the npm package. Serve the UI over HTTPS or localhost with the supplied cross-origin isolation headers.</p>
        <p className="text-[var(--muted-strong)]">An HTML5 video tag alone cannot open an RTSP URL. This implementation uses a canvas renderer and an HTTP MPEG-TS stream. Keep the gateway on a host that can reach your cameras; static hosting alone does not run FFmpeg.</p>
      </section>

      <section id="rtsp-streaming-options" className="space-y-3">
        <h3 className="text-xl font-semibold">RTSP to HLS, WebRTC, or MPEG-TS: which path does this demo use?</h3>
        <p className="text-[var(--muted-strong)]">These are different ways to deliver camera video to a web page. HLS uses HTTP playlists and media segments. WebRTC uses a real-time connection and negotiated browser codecs. This demo sends MPEG-TS over HTTP and decodes H.264 or H.265 using WebAssembly, avoiding dependence on native HEVC decoding.</p>
        <p className="text-[var(--muted-strong)]">The gateway copies video rather than re-encoding it, and converts camera audio to AAC. Playback delay depends on the camera, network, buffering, and device performance. Try a lower-resolution camera substream if software decoding struggles.</p>
      </section>

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
        Build your own RTSP web viewer with the{" "}
        <a className="text-[var(--accent-bright)] underline" href="https://github.com/karthii20/rtsp-live-stream">
          open-source RTSP browser player on GitHub
        </a>{" "}
        or install <a className="text-[var(--accent-bright)] underline" href={NPM_URL}>hevc-player for JavaScript and React</a>.
      </p>
    </article>
  );
}
