"use client";

import { useEffect, useRef, useState, useEffectEvent } from "react";
import {
  classifyPasteUrl,
  createRemuxSession,
  createStreamPlayer,
  preloadHevcPlayer,
  type HevcPlayer,
  type HevcPlayerStats,
} from "hevc-player";

type Status = "idle" | "loading" | "connecting" | "playing" | "error";

const EXAMPLES = [
  "rtsp://admin:password@192.168.1.50:554/Streaming/Channels/101",
  "rtsp://user:pass@camera.example.com:554/stream1",
];

const NPM_URL = "https://www.npmjs.com/package/hevc-player";

/**
 * Live demo of hevc-player 0.4.0.
 * Video + stream controls sit side-by-side; fullscreen expands the stage.
 */
export function RtspPastePlayer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HevcPlayer | null>(null);

  const [urlInput, setUrlInput] = useState(EXAMPLES[0]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Paste an RTSP URL and click Play.");
  const [stats, setStats] = useState<HevcPlayerStats | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
      if (s) setStats(s);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    function onFsChange() {
      const active =
        document.fullscreenElement === stageShellRef.current ||
        // Safari prefix fallback
        (document as Document & { webkitFullscreenElement?: Element })
          .webkitFullscreenElement === stageShellRef.current;
      setIsFullscreen(Boolean(active));
      // Keep canvas filling the shell in fullscreen
      const media = stageRef.current?.querySelector(
        "canvas, video",
      ) as HTMLElement | null;
      if (media) {
        media.style.width = "100%";
        media.style.height = "100%";
        media.style.objectFit = "contain";
      }
    }
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  async function stop() {
    const player = playerRef.current;
    playerRef.current = null;
    if (player) await player.destroy().catch(() => undefined);
    stageRef.current?.replaceChildren();
    setStats(null);
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

  async function toggleFullscreen() {
    const shell = stageShellRef.current;
    if (!shell) return;
    try {
      if (!document.fullscreenElement) {
        const req =
          shell.requestFullscreen?.bind(shell) ||
          (
            shell as HTMLDivElement & {
              webkitRequestFullscreen?: () => Promise<void>;
            }
          ).webkitRequestFullscreen?.bind(shell);
        await req?.();
      } else {
        const exit =
          document.exitFullscreen?.bind(document) ||
          (
            document as Document & {
              webkitExitFullscreen?: () => Promise<void>;
            }
          ).webkitExitFullscreen?.bind(document);
        await exit?.();
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Fullscreen was blocked by the browser.",
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
      const kind = classifyPasteUrl(raw);
      const sourceUrl = kind.mode === "remux" ? kind.sourceUrl : raw;

      const streamUrl = await createRemuxSession(sourceUrl, {
        gatewayUrl: "",
        skipProbe: false,
      });

      setMessage(`Remuxing ${sourceUrl} (video + audio) …`);

      const player = await createStreamPlayer(stageRef.current, {
        url: streamUrl,
        live: true,
        mode: "software",
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

      const media = stageRef.current.querySelector(
        "canvas, video",
      ) as HTMLElement | null;
      if (media) {
        media.style.width = "100%";
        media.style.height = "100%";
        media.style.objectFit = "contain";
        media.style.display = "block";
      }
    } catch (error) {
      setStatus("error");
      const rawMessage =
        error instanceof Error
          ? error.message
          : "Could not start stream. Is the hevc-player gateway running?";
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 pb-4 pt-8 sm:pt-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
              hevc-player
            </span>
            <span className="rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[11px] text-[var(--muted-strong)]">
              v0.4.0
            </span>
          </div>
          <h1 className="max-w-xl text-base font-medium text-[var(--muted-strong)] sm:text-lg">
            Play RTSP in the browser — H.264 / H.265 + AAC
          </h1>
        </div>

        <a
          href={NPM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View hevc-player on npm"
          className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#CB3837] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(203,56,55,0.7)] transition hover:bg-[#a82e2e]"
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
      </header>

      {/* Video + stream info side by side */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:items-stretch">
        <div
          ref={stageShellRef}
          className="relative flex min-h-[240px] flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-black shadow-[0_0_60px_-12px_rgba(255,122,61,0.45)] lg:min-h-[400px]"
        >
          <div
            ref={stageRef}
            className="min-h-0 w-full flex-1 bg-black [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:object-contain [&_video]:h-full [&_video]:w-full [&_video]:object-contain"
            aria-label="hevc-player video stage"
          />

          <div className="absolute right-2 top-2 z-10 flex gap-2">
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="rounded-md border border-white/25 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition hover:border-[var(--accent)] hover:text-[var(--accent-bright)]"
            >
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </button>
          </div>

          {!stats && status !== "playing" ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm font-medium text-[var(--muted-strong)]">
              Video appears here after Play
            </div>
          ) : null}
        </div>

        <aside className="flex flex-col gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
          <label
            htmlFor="rtsp-url"
            className="text-sm font-semibold text-[var(--foreground)]"
          >
            Camera RTSP URL
          </label>
          <input
            id="rtsp-url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="rtsp://user:pass@host:554/path"
            spellCheck={false}
            className="w-full rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs text-[var(--foreground)] outline-none ring-[var(--accent)]/40 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setUrlInput(example)}
                className="rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[10px] text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-bright)]"
              >
                {example.length > 36 ? `${example.slice(0, 34)}…` : example}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void play()}
              disabled={
                !ready || status === "connecting" || status === "loading"
              }
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-bold text-[var(--accent-ink)] shadow-[0_8px_20px_-8px_rgba(255,122,61,0.8)] transition hover:bg-[var(--accent-bright)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => void toggleSound()}
              disabled={status !== "playing"}
              className="rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-bright)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {muted ? "Sound" : "Mute"}
            </button>
            <button
              type="button"
              onClick={() => void stop()}
              className="rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-bright)]"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              className="rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--muted-strong)] transition hover:border-[var(--accent)] hover:text-[var(--accent-bright)]"
            >
              {isFullscreen ? "Exit FS" : "Full screen"}
            </button>
          </div>

          <p
            className={
              status === "error"
                ? "text-sm font-medium text-[var(--danger)]"
                : status === "playing"
                  ? "text-sm font-medium text-[var(--success)]"
                  : "text-sm text-[var(--muted-strong)]"
            }
            role="status"
          >
            {message}
          </p>

          <div className="mt-auto space-y-3 rounded-lg border border-[var(--line-soft)] bg-[var(--surface)] p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent-bright)]">
              Stream info
            </h2>
            {stats ? (
              <dl className="grid grid-cols-2 gap-3 font-mono text-sm">
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Status
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--success)]">
                    {status}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    FPS
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {stats.fps.toFixed(1)}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Size
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {stats.width}×{stats.height}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Bitrate
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {(stats.bitrate / 1000).toFixed(0)} kbps
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Frames
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {stats.frames}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Dropped
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {stats.dropped}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-[var(--muted-strong)]">
                FPS, resolution, and bitrate appear while playing.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
