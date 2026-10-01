import type { PreviewCandidate } from './types';

/**
 * Last-resort fallback: scan a window of the file for JPEG streams and keep
 * the largest. Covers makers that hide previews in MakerNotes (Olympus) and
 * the full-size JPEG track of CR3. SOS-marker pairing keeps false positives
 * out: a candidate must start with SOI + a plausible marker chain.
 */
export function scanForJpegs(buf: Uint8Array, absBase = 0): PreviewCandidate[] {
  const found: PreviewCandidate[] = [];
  let o = 0;
  const n = buf.byteLength;
  while (o + 4 < n && found.length < 64) {
    if (buf[o] === 0xff && buf[o + 1] === 0xd8 && buf[o + 2] === 0xff) {
      const marker = buf[o + 3];
      // Plausible first marker after SOI: APPn, DQT, SOF, DHT, COM.
      const plausible =
        (marker >= 0xe0 && marker <= 0xef) ||
        marker === 0xdb ||
        marker === 0xc0 ||
        marker === 0xc4 ||
        marker === 0xfe;
      if (plausible) {
        const end = findEoi(buf, o + 2, n);
        if (end !== -1 && end - o > 8192) {
          found.push({ offset: absBase + o, length: end - o, via: 'scan' });
          o = end;
          continue;
        }
      }
    }
    o++;
  }
  return found;
}

/** Walks JPEG segments to find the true EOI rather than a random FFD9. */
function findEoi(buf: Uint8Array, from: number, to: number): number {
  let o = from;
  let guard = 0;
  while (o + 4 <= to && guard++ < 4096) {
    if (buf[o] !== 0xff) return -1;
    const marker = buf[o + 1];
    if (marker === 0xd9) return o + 2;
    if (marker === 0xda) {
      // Start of scan: entropy-coded data until the next real marker.
      o += 2;
      while (o + 2 <= to) {
        if (buf[o] === 0xff && buf[o + 1] !== 0 && !(buf[o + 1] >= 0xd0 && buf[o + 1] <= 0xd7)) {
          if (buf[o + 1] === 0xd9) return o + 2;
          break;
        }
        o++;
      }
      continue;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      o += 2;
      continue;
    }
    const len = (buf[o + 2] << 8) | buf[o + 3];
    if (len < 2) return -1;
    o += 2 + len;
  }
  return -1;
}
