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
import {
  detectMpegTsCodecs,
  formatCodecLabel,
  type DetectedCodecs,
} from "@/lib/detectMpegTsCodecs";

type Status = "idle" | "loading" | "connecting" | "playing" | "error";


const NPM_URL = "https://www.npmjs.com/package/hevc-player";
const GITHUB_URL = "https://github.com/karthii20/rtsp-live-stream";

/**
 * Live demo of hevc-player 0.5.0 (bundled WASM — no public asset copy).
 * Video + stream controls sit side-by-side; fullscreen expands the stage.
 */
export function RtspPastePlayer() {
  const stageRef = useRef<HTMLDivElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HevcPlayer | null>(null);

  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("Paste an RTSP URL and click Play.");
  const [stats, setStats] = useState<HevcPlayerStats | null>(null);
  const [codecs, setCodecs] = useState<DetectedCodecs | null>(null);
  const [ready, setReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const onPlaying = useEffectEvent(() => {
    setStatus("playing");
    setMessage("Playing via hevc-player WASM");
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
              : "Failed to load hevc-player. Check the package install / rebuild.",
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
    setCodecs(null);
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

      setMessage("Remuxing camera stream (video + audio)…");

      // Separate session so we can sample MPEG-TS for codec labels (tickets are one-shot).
      void createRemuxSession(sourceUrl, {
        gatewayUrl: "",
        skipProbe: true,
      })
        .then((probeUrl) => detectMpegTsCodecs(probeUrl))
        .then((detected) => {
          if (detected.video || detected.audio) setCodecs(detected);
        })
        .catch(() => undefined);

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
              v0.5.0
            </span>
          </div>
          <h1 className="max-w-xl text-base font-medium text-[var(--muted-strong)] sm:text-lg">
            Play RTSP in the browser — H.264 / H.265 + AAC
          </h1>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View this demo on GitHub"
            className="inline-flex items-center gap-2 rounded-md bg-[#24292f] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(36,41,47,0.65)] transition hover:bg-[#1b1f23]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 16 16"
              aria-hidden
              className="shrink-0"
              fill="currentColor"
            >
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>GitHub</span>
          </a>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View hevc-player on npm"
            className="inline-flex items-center gap-2 rounded-md bg-[#CB3837] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(203,56,55,0.7)] transition hover:bg-[#a82e2e]"
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

        <aside className="flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.8)] backdrop-blur-md">
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
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2.5 font-mono text-xs text-[var(--foreground)] outline-none ring-[var(--accent)]/40 placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:ring-2"
          />

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
                ? "break-all text-sm font-medium text-[var(--danger)]"
                : status === "playing"
                  ? "break-all text-sm font-medium text-[var(--success)]"
                  : "break-all text-sm text-[var(--muted-strong)]"
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
                <div className="col-span-2 rounded-md bg-black/25 px-2.5 py-2 sm:col-span-1">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Codec
                  </dt>
                  <dd className="mt-0.5 break-words font-semibold text-[var(--accent-bright)]">
                    {codecs
                      ? formatCodecLabel(codecs)
                      : "Detecting…"}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Video
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {codecs?.video ?? "—"}
                  </dd>
                </div>
                <div className="rounded-md bg-black/25 px-2.5 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-strong)]">
                    Audio
                  </dt>
                  <dd className="mt-0.5 font-semibold text-[var(--foreground)]">
                    {codecs?.audio ?? "—"}
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
                Codec, FPS, resolution, and bitrate appear while playing.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
