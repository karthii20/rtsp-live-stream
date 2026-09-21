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
  "http://127.0.0.1:8889/camera1",
];

/**
 * Paste an RTSP (or MediaMTX viewer) URL → remux via hevc-player gateway → WASM play.
 * The browser never opens RTSP directly; that is what the gateway is for.
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
    setMessage("Playing (WASM H.264 / H.265)");
  });

  const onPlayerError = useEffectEvent(() => {
    setStatus("error");
    setMessage("Playback failed. Check the RTSP URL and that the gateway can reach the camera.");
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
    setMessage("Opening remux session…");

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
          : "Could not start stream. Is `pnpm run gateway` running?",
      );
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-teal-700 dark:text-teal-300">
          hevc-player
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          RTSP in the browser
        </h1>
        <p className="max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
          Paste a direct <code className="text-teal-700 dark:text-teal-300">rtsp://</code> URL.
          The bundled gateway remuxes it to MPEG-TS; WASM decodes H.264 / H.265 in any modern
          browser. No hevc-studio checkout required.
        </p>
      </header>

      <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
        <label htmlFor="rtsp-url" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Stream URL
        </label>
        <input
          id="rtsp-url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="rtsp://user:pass@host:554/path"
          spellCheck={false}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 font-mono text-sm text-zinc-900 outline-none ring-teal-500/40 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setUrlInput(example)}
              className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              {example.length > 42 ? `${example.slice(0, 40)}…` : example}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="button"
            onClick={() => void play()}
            disabled={!ready || status === "connecting" || status === "loading"}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => void stop()}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Stop
          </button>
        </div>
        <p
          className={
            status === "error"
              ? "text-sm text-red-600 dark:text-red-400"
              : status === "playing"
                ? "text-sm text-teal-700 dark:text-teal-300"
                : "text-sm text-zinc-500"
          }
          role="status"
        >
          {message}
        </p>
      </section>

      <section
        ref={stageRef}
        className="aspect-video w-full overflow-hidden rounded-xl border border-zinc-800 bg-black shadow-lg"
        aria-label="Video stage"
      />

      {stats ? (
        <pre className="overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
          {stats}
        </pre>
      ) : null}

      <p className="text-xs text-zinc-500">
        Needs FFmpeg on PATH and <code>pnpm run gateway</code> (or <code>pnpm run dev</code> which
        starts both). Gateway listens on <code>:3002</code>; this app proxies <code>/v1</code> to
        it.
      </p>
    </div>
  );
}
