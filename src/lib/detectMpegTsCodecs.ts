/**
 * Detect video/audio codecs from an MPEG-TS URL by reading the first PAT/PMT.
 * Used after remux so we can show H.264 vs H.265 (+ AAC) in the demo UI.
 */

export type DetectedCodecs = {
  video: string | null;
  audio: string | null;
};

const STREAM_TYPES: Record<number, { kind: "video" | "audio"; label: string }> = {
  0x01: { kind: "video", label: "MPEG-1" },
  0x02: { kind: "video", label: "MPEG-2" },
  0x1b: { kind: "video", label: "H.264" },
  0x24: { kind: "video", label: "H.265" },
  0x27: { kind: "video", label: "H.264" },
  0x0f: { kind: "audio", label: "AAC" },
  0x11: { kind: "audio", label: "AAC" },
  0x03: { kind: "audio", label: "MPEG Audio" },
  0x04: { kind: "audio", label: "MPEG Audio" },
  0x81: { kind: "audio", label: "AC-3" },
  0x86: { kind: "audio", label: "AC-3" },
};

const PACKET = 188;

function findSync(bytes: Uint8Array, from = 0): number {
  for (let i = from; i + PACKET <= bytes.length; i++) {
    if (bytes[i] !== 0x47) continue;
    if (i + PACKET < bytes.length && bytes[i + PACKET] !== 0x47) continue;
    return i;
  }
  return -1;
}

function parsePackets(bytes: Uint8Array): Map<number, Uint8Array[]> {
  const byPid = new Map<number, Uint8Array[]>();
  const start = findSync(bytes);
  if (start < 0) return byPid;

  for (let i = start; i + PACKET <= bytes.length; i += PACKET) {
    if (bytes[i] !== 0x47) break;
    const pid = ((bytes[i + 1] & 0x1f) << 8) | bytes[i + 2];
    const pusi = (bytes[i + 1] & 0x40) !== 0;
    const adaptation = (bytes[i + 3] >> 4) & 0x3;
    let payloadOffset = 4;
    if (adaptation === 2 || adaptation === 3) {
      const adaptLen = bytes[i + 4];
      payloadOffset = 5 + adaptLen;
    }
    if (adaptation === 2) continue;
    if (payloadOffset >= PACKET) continue;
    let payload = bytes.subarray(i + payloadOffset, i + PACKET);
    if (pusi && payload.length > 0) {
      const pointer = payload[0];
      payload = payload.subarray(1 + pointer);
    }
    if (!payload.length) continue;
    const list = byPid.get(pid) ?? [];
    list.push(payload);
    byPid.set(pid, list);
  }
  return byPid;
}

function concatPayloads(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function parsePatPmt(bytes: Uint8Array): DetectedCodecs {
  const byPid = parsePackets(bytes);
  const patParts = byPid.get(0);
  if (!patParts?.length) return { video: null, audio: null };

  const pat = concatPayloads(patParts);
  if (!pat.length || pat[0] !== 0x00) return { video: null, audio: null };

  const sectionLength = ((pat[1] & 0x0f) << 8) | pat[2];
  const sectionEnd = Math.min(3 + sectionLength - 4, pat.length);
  let pmtPid: number | null = null;
  for (let i = 8; i + 4 <= sectionEnd; i += 4) {
    const programNumber = (pat[i] << 8) | pat[i + 1];
    const pid = ((pat[i + 2] & 0x1f) << 8) | pat[i + 3];
    if (programNumber !== 0) {
      pmtPid = pid;
      break;
    }
  }
  if (pmtPid == null) return { video: null, audio: null };

  const pmtParts = byPid.get(pmtPid);
  if (!pmtParts?.length) return { video: null, audio: null };
  const pmt = concatPayloads(pmtParts);
  if (!pmt.length || pmt[0] !== 0x02) return { video: null, audio: null };

  const pmtLen = ((pmt[1] & 0x0f) << 8) | pmt[2];
  const pmtEnd = Math.min(3 + pmtLen - 4, pmt.length);
  const programInfoLen = ((pmt[10] & 0x0f) << 8) | pmt[11];
  let offset = 12 + programInfoLen;

  let video: string | null = null;
  let audio: string | null = null;

  while (offset + 5 <= pmtEnd) {
    const streamType = pmt[offset];
    const esInfoLen = ((pmt[offset + 3] & 0x0f) << 8) | pmt[offset + 4];
    const mapped = STREAM_TYPES[streamType];
    if (mapped?.kind === "video" && !video) video = mapped.label;
    if (mapped?.kind === "audio" && !audio) audio = mapped.label;
    offset += 5 + esInfoLen;
  }

  return { video, audio };
}

/**
 * Fetch a short prefix of the MPEG-TS and read codecs from PMT.
 * Safe to abort; uses a separate remux session from the player when needed.
 */
export async function detectMpegTsCodecs(
  streamUrl: string,
  timeoutMs = 8000,
): Promise<DetectedCodecs> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(streamUrl, {
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok || !response.body) {
      return { video: null, audio: null };
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    const target = 256 * 1024;

    while (total < target) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.length;
      const merged = concatPayloads(chunks);
      const found = parsePatPmt(merged);
      if (found.video) {
        controller.abort();
        return found;
      }
    }

    return parsePatPmt(concatPayloads(chunks));
  } catch {
    return { video: null, audio: null };
  } finally {
    clearTimeout(timer);
  }
}

export function formatCodecLabel(codecs: DetectedCodecs): string {
  const parts: string[] = [];
  if (codecs.video) parts.push(codecs.video);
  if (codecs.audio) parts.push(codecs.audio);
  return parts.length ? parts.join(" + ") : "Unknown";
}
