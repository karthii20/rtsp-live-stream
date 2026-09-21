const NPM_URL = "https://www.npmjs.com/package/hevc-player";

const INSTALL = `npm install hevc-player
npx hevc-player-copy-assets public
npx hevc-player gateway --port 3002`;

const USAGE = `import { createStreamPlayer, preloadHevcPlayer } from "hevc-player";

// 1) Register your RTSP camera with the package gateway
const res = await fetch("/v1/sessions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: "rtsp://camera/stream" }),
});
const { streamUrl } = await res.json();

// 2) Play the remuxed MPEG-TS in the browser (WASM H.264 / H.265)
await preloadHevcPlayer();
const player = await createStreamPlayer(container, {
  url: streamUrl,
  live: true,
  mode: "software",
});`;

/**
 * Below-the-fold guide: how to use hevc-player in your own app.
 * One job — teach install + RTSP → play pattern from the npm package.
 */
export function PackageGuide() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 border-t border-[var(--line)] px-4 py-14">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Use the package in your app
        </h2>
        <p className="max-w-2xl text-[var(--muted)]">
          This demo site is built on{" "}
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            hevc-player
          </a>
          . Install it, start the bundled gateway, paste an RTSP URL, and play.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Snippet title="Install & start gateway" code={INSTALL} />
        <Snippet title="Open RTSP → play in the browser" code={USAGE} />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-[var(--foreground)]">
          What the package gives you
        </h3>
        <ul className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">WASM player</p>
            Software H.264 / H.265 decode — works without GPU HEVC.
          </li>
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">RTSP gateway</p>
            <code className="text-[var(--accent)]">hevc-player gateway</code> remuxes
            cameras to MPEG-TS over HTTP.
          </li>
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">React helper</p>
            Optional <code className="text-[var(--accent)]">HevcPlayerView</code> from{" "}
            <code>hevc-player/react</code>.
          </li>
        </ul>
      </div>

      <p className="text-sm text-[var(--muted)]">
        Full docs:{" "}
        <a
          href={NPM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent)] underline-offset-2 hover:underline"
        >
          npmjs.com/package/hevc-player
        </a>
      </p>
    </section>
  );
}

function Snippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-[var(--foreground)]/90">{title}</h3>
      <pre className="overflow-x-auto border border-[var(--line)] bg-black/50 p-4 text-[12px] leading-relaxed text-[var(--muted)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
