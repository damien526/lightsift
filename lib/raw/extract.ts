import { isCr3, parseCr3 } from './cr3';
import { isRaf, parseRaf } from './raf';
import { scanForJpegs } from './scan';
import { parseJpegExif, parseTiff } from './tiff';
import type { ByteSource, ExifSummary, PreviewCandidate } from './types';

/** How much of the file the parsers get to see. Previews live near the start. */
const HEADER_WINDOW = 12 * 1024 * 1024;

export interface Extraction {
  /** The best embedded JPEG, ready to decode. Null when nothing was found. */
  jpeg: Uint8Array | null;
  exif: ExifSummary;
  via: string;
  /** Absolute byte range of the preview, so callers can re-slice on demand. */
  range: { offset: number; length: number } | null;
}

function isTiffFamily(buf: Uint8Array): boolean {
  return (
    buf.byteLength > 8 &&
    ((buf[0] === 0x49 && buf[1] === 0x49) || (buf[0] === 0x4d && buf[1] === 0x4d))
  );
}

function isPlainJpeg(buf: Uint8Array): boolean {
  return buf.byteLength > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
}

/**
 * Finds the best embedded preview in a RAW file (or the file itself for JPEG).
 * Candidates are validated against the real bytes: anything that does not
 * start with a JPEG SOI is dropped before we pick the largest.
 */
export async function extractPreview(source: ByteSource): Promise<Extraction> {
  const window = await source.read(0, Math.min(source.size, HEADER_WINDOW));

  let candidates: PreviewCandidate[] = [];
  let exif: ExifSummary = {};

  if (isPlainJpeg(window)) {
    exif = parseJpegExif(window).exif;
    return {
      jpeg: null,
      exif,
      via: 'native',
      range: { offset: 0, length: source.size },
    };
  }

  if (isCr3(window)) {
    const r = parseCr3(window);
    candidates = r.candidates;
    exif = r.exif;
  } else if (isRaf(window)) {
    const r = parseRaf(window, source.size);
    candidates = r.candidates;
    exif = r.exif;
  } else if (isTiffFamily(window)) {
    const r = parseTiff(window);
    candidates = r.candidates;
    exif = r.exif;
  }

  // Structured parsing found nothing usable: brute-scan the window.
  let best = await pickBest(source, candidates);
  if (!best || best.length < 32 * 1024) {
    const scanned = scanForJpegs(window);
    const bestScan = await pickBest(source, scanned);
    if (bestScan && (!best || bestScan.length > best.length)) best = bestScan;
  }

  if (!best) return { jpeg: null, exif, via: 'none', range: null };

  const jpeg = await source.read(best.offset, best.length);
  // Some makers (Panasonic, Olympus) keep the EXIF inside the embedded JPEG.
  if (!exif.make || exif.iso === undefined) {
    const inner = parseJpegExif(jpeg).exif;
    exif = { ...inner, ...Object.fromEntries(Object.entries(exif).filter(([, v]) => v !== undefined)) };
  }
  return { jpeg, exif, via: best.via, range: { offset: best.offset, length: best.length } };
}

async function pickBest(
  source: ByteSource,
  candidates: PreviewCandidate[],
): Promise<PreviewCandidate | null> {
  const inRange = candidates.filter(
    (c) => c.length >= 1024 && c.offset >= 0 && c.offset + c.length <= source.size,
  );
  inRange.sort((a, b) => b.length - a.length);
  for (const c of inRange) {
    const head = await source.read(c.offset, Math.min(c.length, 65536));
    if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff && isDecodableJpeg(head)) {
      return c;
    }
  }
  return null;
}

/**
 * RAW files also contain the sensor data as lossless JPEG (SOF3), which no
 * browser can decode. Walk the marker chain and only accept baseline,
 * extended or progressive DCT streams.
 */
function isDecodableJpeg(head: Uint8Array): boolean {
  let o = 2;
  let guard = 0;
  while (o + 4 <= head.byteLength && guard++ < 256) {
    if (head[o] !== 0xff) return false;
    const marker = head[o + 1];
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) return true;
    if (marker >= 0xc3 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return false;
    }
    if (marker === 0xda || marker === 0xd9) return false;
    const len = (head[o + 2] << 8) | head[o + 3];
    if (len < 2) return false;
    o += 2 + len;
  }
  // Ran out of header window without a verdict: assume decodable.
  return true;
}

/** Wraps a browser File (or Blob) as a ByteSource. */
export function fileSource(file: Blob): ByteSource {
  return {
    size: file.size,
    async read(offset, length) {
      const buf = await file.slice(offset, offset + length).arrayBuffer();
      return new Uint8Array(buf);
    },
  };
}
