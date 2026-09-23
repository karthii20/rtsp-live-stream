const NPM_URL = "https://www.npmjs.com/package/hevc-player";

const INSTALL = `npm install hevc-player@0.4.0
npx hevc-player-copy-assets public
npx hevc-player gateway --port 3002`;

const USAGE = `import {
  createStreamPlayer,
  createRemuxSession,
  preloadHevcPlayer,
} from "hevc-player";

await preloadHevcPlayer();

// 1) Register RTSP with the package gateway (video copy + audio → AAC)
const streamUrl = await createRemuxSession("rtsp://camera/stream", {
  gatewayUrl: "", // same-origin /v1 proxy
});

// 2) Play MPEG-TS in the browser (WASM H.264/H.265 + AAC)
const player = await createStreamPlayer(container, {
  url: streamUrl,
  live: true,
  mode: "software",
  audio: true,  // default — decode audio when present
  muted: true,  // start muted; unmute from a click
});

// 3) Unlock sound from a user gesture (browser autoplay policy)
soundButton.onclick = async () => {
  await player.setMuted(!player.isMuted());
};`;

/**
 * Below-the-fold guide: how to use hevc-player 0.4.0 (video + audio) in your app.
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
          </a>{" "}
          0.4.0. Install it, start the bundled gateway, paste an RTSP URL, and
          play video with synchronized AAC audio.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Snippet title="Install & start gateway" code={INSTALL} />
        <Snippet title="Open RTSP → play video + audio" code={USAGE} />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-medium text-[var(--foreground)]">
          What the package gives you
        </h3>
        <ul className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-3">
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">WASM player</p>
            Software H.264 / H.265 + AAC decode — works without GPU HEVC.
          </li>
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">RTSP gateway</p>
            <code className="text-[var(--accent)]">hevc-player gateway</code> remuxes
            video (copy) and camera audio to AAC.
          </li>
          <li className="border border-[var(--line)] bg-black/25 p-4">
            <p className="mb-1 font-medium text-[var(--foreground)]">React helper</p>
            Optional <code className="text-[var(--accent)]">HevcPlayerView</code> from{" "}
            <code>hevc-player/react</code> with <code>audio</code> / <code>muted</code>.
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
