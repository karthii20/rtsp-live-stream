"use client";

import { useEffect, useRef, useState, useEffectEvent } from "react";
import {
  classifyPasteUrl,
  createRemuxSession,
  createStreamPlayer,
  preloadHevcPlayer,
  type HevcPlayer,
} from "hevc-player";

type Status = "idle" | "loading" | "connecting" | "playing" | "error";

const EXAMPLES = [
  "rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101",
  "rtsp://user:pass@camera.example.com:554/stream1",
];

const NPM_URL = "https://www.npmjs.com/package/hevc-player";

/**
 * Live demo of hevc-player 0.4.0.
 * Paste RTSP → package gateway remuxes video+audio to MPEG-TS → WASM plays H.264/H.265 + AAC.
 * Starts muted (browser autoplay); use Enable sound from a click to unmute.
 */
export function RtspPastePlayer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HevcPlayer | null>(null);

  const [urlInput, setUrlInput] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Paste an RTSP URL and click Play.");
  const [stats, setStats] = useState("");
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);

  const onPlaying = useEffectEvent(() => {
    setStatus("playing");
    setMessage("Playing video + audio via hevc-player WASM (H.264 / H.265 + AAC)");
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
    setMuted(true);
    setStatus("idle");
    setMessage("Stopped.");
  }

  /** Must run from a click — browsers block unmuted autoplay. */
  async function toggleSound() {
    const player = playerRef.current;
    if (!player) return;
    try {
      const next = !player.isMuted();
      await player.setMuted(next);
      setMuted(player.isMuted());
      setMessage(
        player.isMuted()
          ? "Muted — click Enable sound to hear camera audio."
          : "Sound on (AAC when the camera has audio).",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not unmute. Click Enable sound again.",
      );
    }
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
      // Optional: rewrite some HTTP viewer URLs to rtsp://. Plain camera RTSP stays as-is.
      const kind = classifyPasteUrl(raw);
      const sourceUrl = kind.mode === "remux" ? kind.sourceUrl : raw;

      // Empty gatewayUrl → same-origin /v1 rewrite to the npm package gateway.
      const streamUrl = await createRemuxSession(sourceUrl, {
        gatewayUrl: "",
        skipProbe: false,
      });

      setMessage(`Remuxing ${sourceUrl} (video + audio) …`);

      const player = await createStreamPlayer(stageRef.current, {
        url: streamUrl,
        live: true,
        mode: "software",
        // 0.4.0: decode AAC when present; start muted for autoplay, unmute via button.
        audio: true,
        muted: true,
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
      setMuted(player.isMuted());
    } catch (error) {
      setStatus("error");
      const rawMessage =
        error instanceof Error
          ? error.message
          : "Could not start stream. Is the hevc-player gateway running?";
      // Gateway origin whitelist → Forbidden when PUBLIC_ORIGIN does not match the address bar.
      if (/forbidden/i.test(rawMessage)) {
        setMessage(
          "Gateway rejected this browser origin (Forbidden). " +
            `Set PUBLIC_ORIGIN=${typeof window !== "undefined" ? window.location.origin : "http://YOUR_HOST:3000"} ` +
            "or add it to GATEWAY_ORIGINS, then restart.",
        );
        return;
      }
      setMessage(rawMessage);
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
              v0.4.0
            </span>
          </div>

          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View hevc-player on npm"
            className="inline-flex shrink-0 items-center gap-2 rounded-sm bg-[#CB3837] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#a82e2e]"
          >
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
          Paste an RTSP URL. Play H.264 / H.265 video with AAC audio.
        </h1>

        <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
          Browsers cannot speak RTSP. This live demo uses{" "}
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline-offset-2 hover:underline"
          >
            hevc-player
          </a>{" "}
          0.4.0 end-to-end: the FFmpeg gateway remuxes camera video (copy) and
          audio (to AAC), then WASM decodes both in the page.
        </p>

        <ol className="flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-[var(--muted)]">
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">1</span> paste <code>rtsp://</code>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">2</span> gateway remux
          </li>
          <li className="flex items-center gap-2">
            <span className="text-[var(--accent)]">3</span> WASM video + audio
          </li>
        </ol>
      </header>

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
            onClick={() => void toggleSound()}
            disabled={status !== "playing"}
            className="border border-[var(--line)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/80 transition hover:border-[var(--accent)]/40 hover:text-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {muted ? "Enable sound" : "Mute"}
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
