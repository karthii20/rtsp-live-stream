const NPM_URL = "https://www.npmjs.com/package/hevc-player";

const INSTALL = `npm install hevc-player@0.5.0
npx hevc-player gateway --port 3002
# WASM + player assets are bundled in the package (no public/ copy)`

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
 * Below-the-fold guide: how to use hevc-player 0.5.0 (bundled WASM assets).
 */
export function PackageGuide() {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 border-t border-[var(--line-soft)] px-4 py-12">
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">
          Use the package in your app
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted-strong)]">
          This demo site is built on{" "}
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[var(--accent-bright)] underline-offset-2 hover:underline"
          >
            hevc-player
          </a>{" "}
          0.5.0. Install it, start the bundled gateway, paste an RTSP URL, and
          play video with synchronized AAC audio — no{" "}
          <code className="text-[var(--muted-strong)]">public/wasm</code> or{" "}
          <code className="text-[var(--muted-strong)]">public/vendor</code> copy
          step.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Snippet title="Install & start gateway" code={INSTALL} />
        <Snippet title="Open RTSP → play video + audio" code={USAGE} />
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          What the package gives you
        </h3>
        <ul className="grid gap-3 text-sm text-[var(--muted-strong)] sm:grid-cols-3">
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">WASM player</p>
            Software H.264 / H.265 + AAC decode — bundled in the package (no public/ copy).
          </li>
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">RTSP gateway</p>
            <code className="text-[var(--accent-bright)]">hevc-player gateway</code> remuxes
            video (copy) and camera audio to AAC.
          </li>
          <li className="rounded-xl border border-[var(--line-soft)] bg-[var(--panel)] p-4">
            <p className="mb-1 font-semibold text-[var(--foreground)]">React helper</p>
            Optional <code className="text-[var(--accent-bright)]">HevcPlayerView</code> from{" "}
            <code className="text-[var(--muted-strong)]">hevc-player/react</code> with{" "}
            <code className="text-[var(--muted-strong)]">audio</code> /{" "}
            <code className="text-[var(--muted-strong)]">muted</code>.
          </li>
        </ul>
      </div>

      <p className="text-sm text-[var(--muted-strong)]">
        Full docs:{" "}
        <a
          href={NPM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--accent-bright)] underline-offset-2 hover:underline"
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
      <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <pre className="overflow-x-auto rounded-xl border border-[var(--line-soft)] bg-[var(--panel-solid)] p-4 text-[12px] leading-relaxed text-[var(--muted-strong)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}
