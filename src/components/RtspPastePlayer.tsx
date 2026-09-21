"use client";

import { useEffect, useRef, useState, useEffectEvent } from "react";
import {
  classifyPasteUrl,
  createStreamPlayer,
  preloadHevcPlayer,
  type HevcPlayer,
} from "hevc-player";
import { openRemuxSession } from "@/lib/openRemuxSession";

type Status = "idle" | "loading" | "connecting" | "playing" | "error";

const EXAMPLES = [
  "rtsp://127.0.0.1:8554/camera1",
  "rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101",
];

const NPM_URL = "https://www.npmjs.com/package/hevc-player";

/**
 * Live demo of the hevc-player npm package.
 * Paste RTSP → package gateway remuxes to MPEG-TS → WASM plays H.264/H.265.
 * Browsers cannot open RTSP natively; the gateway in the package is what makes this work.
 */
export function RtspPastePlayer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HevcPlayer | null>(null);

  const [urlInput, setUrlInput] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Paste an RTSP URL and click Play.");
  const [stats, setStats] = useState("");
  const [ready, setReady] = useState(false);

  const onPlaying = useEffectEvent(() => {
    setStatus("playing");
    setMessage("Playing via hevc-player WASM (H.264 / H.265)");
  });

  const onPlayerError = useEffectEvent(() => {
    setStatus("error");
    setMessage(
      "Playback failed. Check the RTSP URL and that the hevc-player gateway can reach the camera.",
    );
  });

  useEffect(() => {
    let cancelled = false;
    preloadHevcPlayer()
      .then(() => {
        if (!cancelled) {
          setReady(true);
          setMessage("Player ready — paste an RTSP URL and click Play.");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStatus("error");
          setMessage(
            error instanceof Error
              ? error.message
              : "Failed to load player assets. Run: pnpm run setup",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = setInterval(() => {
      const s = playerRef.current?.stats();
      if (s) setStats(JSON.stringify(s, null, 2));
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  async function stop() {
    const player = playerRef.current;
    playerRef.current = null;
    if (player) await player.destroy().catch(() => undefined);
    stageRef.current?.replaceChildren();
    setStats("");
    setStatus("idle");
    setMessage("Stopped.");
  }

  async function play() {
    const raw = urlInput.trim();
    if (!raw) {
      setStatus("error");
      setMessage("Enter an RTSP URL first.");
      return;
    }
    if (!stageRef.current || !ready) {
      setStatus("error");
      setMessage("Player assets are still loading.");
      return;
    }

    setStatus("loading");
    setMessage("Stopping previous stream…");
    await stop();
    setStatus("connecting");
    setMessage("Opening remux session (hevc-player gateway)…");

    try {
      // MediaMTX viewer pages → derived RTSP; plain rtsp:// stays as-is.
      const kind = classifyPasteUrl(raw);
      const sourceUrl = kind.mode === "remux" ? kind.sourceUrl : raw;

      // Empty gatewayUrl → same-origin /v1 rewrite to the npm package gateway.
      const streamUrl = await openRemuxSession(sourceUrl, {
        gatewayUrl: "",
        skipProbe: false,
      });

      setMessage(`Remuxing ${sourceUrl} …`);

      const player = await createStreamPlayer(stageRef.current, {
        url: streamUrl,
        live: true,
        mode: "software",
        audio: false,
        onPlaying,
        onError: onPlayerError,
        onEnded: () => {
          setStatus("error");
          setMessage("Stream ended.");
        },
        onTimeout: () => {
          setStatus("error");
          setMessage("Timed out waiting for video.");
        },
      });
      playerRef.current = player;
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not start stream. Is the hevc-player gateway running?",
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-6 pt-10 sm:pt-14">
      <header className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
              hevc-player
            </span>
            <span className="rounded border border-[var(--line)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted)]">
              v0.3.0
            </span>
          </div>

          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View hevc-player on npm"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#CB3837] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a82e2e]"
          >
            {/* Official-style npm mark (white on red) */}
            <svg
              width="28"
              height="12"
              viewBox="0 0 18 7"
              aria-hidden
              className="shrink-0"
            >
              <path
                fill="#fff"
                d="M0 0h18v6H9v1H5V6H0V0zm1 5h3V1H1v4zm4 0h3V2H7v3H5V1zm4 0h5V1H9v4zm1-1h3V2h-3v2z"
              />
            </svg>
            <span>npm</span>
          </a>
        </div>

        <h1 className="max-w-2xl text-xl font-medium leading-snug text-[var(--foreground)]/90 sm:text-2xl">
          Paste an RTSP URL. Play H.264 / H.265 in any modern browser.
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          Browsers cannot speak RTSP. This live demo uses the{" "}
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            hevc-player
          </a>{" "}
          npm package end-to-end: its FFmpeg gateway remuxes your camera to
          MPEG-TS, then WASM decodes video in the page.
        </p>

        <ol className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[var(--muted)]">
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">1</span> paste <code>rtsp://</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">2</span> gateway remux
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">3</span> WASM play
          </li>
        </ol>
      </header>

      {/* Interactive demo surface */}
      <section className="flex flex-col gap-3 border border-[var(--line)] bg-[var(--panel)] p-4 backdrop-blur-sm sm:p-5">
        <label
          htmlFor="rtsp-url"
          className="text-sm font-medium text-[var(--foreground)]/90"
        >
          Camera RTSP URL
        </label>
        <input
          id="rtsp-url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="rtsp://user:pass@host:554/path"
          spellCheck={false}
          className="w-full border border-[var(--line)] bg-black/40 px-3 py-2.5 font-mono text-sm text-[var(--foreground)] outline-none ring-[var(--accent)]/35 placeholder:text-[var(--muted)]/60 focus:ring-2"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setUrlInput(example)}
              className="border border-[var(--line)] px-3 py-1 font-mono text-[11px] text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
            >
              {example.length > 48 ? `${example.slice(0, 46)}…` : example}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void play()}
            disabled={!ready || status === "connecting" || status === "loading"}
            className="bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-[var(--accent-ink)] transition hover:bg-[var(--accent-dim)] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Play stream
          </button>
          <button
            type="button"
            onClick={() => void stop()}
            className="border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/80 transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
          >
            Stop
          </button>
        </div>
        <p
          className={
            status === "error"
              ? "text-sm text-[var(--danger)]"
              : status === "playing"
                ? "text-sm text-[var(--accent)]"
                : "text-sm text-[var(--muted)]"
          }
          role="status"
        >
          {message}
        </p>
      </section>

      <section
        ref={stageRef}
        className="aspect-video w-full overflow-hidden border border-[var(--line)] bg-black shadow-[0_0_80px_-20px_rgba(232,165,75,0.35)]"
        aria-label="hevc-player video stage"
      />

      {stats ? (
        <pre className="overflow-auto border border-[var(--line)] bg-black/50 p-3 text-xs text-[var(--muted)]">
          {stats}
        </pre>
      ) : null}
    </div>
  );
}
