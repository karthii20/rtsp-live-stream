/**
 * Talk to the remux gateway that ships inside the hevc-player npm package
 * (`pnpm exec hevc-player gateway` / `npx hevc-player gateway`).
 *
 * createRemuxSession lands in hevc-player ≥ 0.3.1; until that publish, this
 * helper does the same POST so the app only depends on the npm package.
 */
export async function openRemuxSession(
  sourceUrl: string,
  options: { gatewayUrl?: string; skipProbe?: boolean } = {},
): Promise<string> {
  if (!sourceUrl?.trim()) {
    throw new Error("openRemuxSession needs a stream URL.");
  }

  const base = (options.gatewayUrl ?? "").replace(/\/$/, "");
  const endpoint = `${base}/v1/sessions`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: sourceUrl.trim(),
        skipProbe: options.skipProbe === true,
      }),
    });
  } catch {
    throw new Error(
      "Cannot reach the hevc-player gateway. Start it with: pnpm run gateway",
    );
  }

  const result = (await response.json().catch(() => ({}))) as {
    streamUrl?: string;
    error?: string;
  };

  if (!response.ok || !result.streamUrl) {
    if (!result.error && (response.status === 500 || response.status === 502)) {
      throw new Error(
        "Remux gateway is not reachable. Start it with: pnpm run gateway " +
          "(or `pnpm run dev`, which starts both Next.js and the gateway).",
      );
    }
    throw new Error(result.error || `Remux failed (${response.status})`);
  }

  // Same-origin proxy: keep path+query so playback goes through Next → gateway.
  if (!base) {
    const { pathname, search } = new URL(result.streamUrl, "http://127.0.0.1");
    return `${pathname}${search}`;
  }

  return result.streamUrl;
}
