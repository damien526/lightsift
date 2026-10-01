import { parseTiff } from './tiff';
import type { ParseResult, PreviewCandidate } from './types';

/**
 * Canon CR3 is an ISO-BMFF (MP4-like) container.
 * - EXIF lives in CMT1 (IFD0) and CMT2 (Exif IFD) boxes inside Canon's moov uuid.
 * - A 1620 px preview JPEG lives in a PRVW box inside a second uuid box.
 * - A full-size JPEG track usually sits at the start of mdat; the caller's
 *   brute scan picks it up, so PRVW is only the guaranteed baseline here.
 */

function fourcc(buf: Uint8Array, o: number): string {
  return String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
}

interface Box {
  type: string;
  /** Offset of the box payload within the buffer. */
  start: number;
  /** Offset one past the end of the box. */
  end: number;
}

function* boxes(buf: Uint8Array, from: number, to: number): Generator<Box> {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let o = from;
  let guard = 0;
  while (o + 8 <= to && guard++ < 10000) {
    let size = view.getUint32(o);
    const type = fourcc(buf, o + 4);
    let payload = o + 8;
    if (size === 1) {
      if (o + 16 > to) return;
      const hi = view.getUint32(o + 8);
      const lo = view.getUint32(o + 12);
      size = hi * 2 ** 32 + lo;
      payload = o + 16;
    } else if (size === 0) {
      size = to - o;
    }
    if (size < 8 || o + size > to + 1) return;
    yield { type, start: payload, end: Math.min(o + size, to) };
    o += size;
  }
}

export function parseCr3(buf: Uint8Array): ParseResult {
  const candidates: PreviewCandidate[] = [];
  let exif: ParseResult['exif'] = {};

  for (const top of boxes(buf, 0, buf.byteLength)) {
    if (top.type === 'moov') {
      for (const inner of boxes(buf, top.start, top.end)) {
        if (inner.type === 'uuid') {
          // Canon metadata uuid: CMT1/CMT2 boxes follow the 16-byte uuid.
          for (const meta of boxes(buf, inner.start + 16, inner.end)) {
            if (meta.type === 'CMT1') {
              const r = parseTiff(buf.subarray(meta.start, meta.end), meta.start);
              exif = { ...r.exif, ...exif };
            } else if (meta.type === 'CMT2') {
              // CMT2 is a bare Exif IFD TIFF; its tags use the same ids.
              const r = parseTiff(buf.subarray(meta.start, meta.end), meta.start);
              exif = { ...exif, ...r.exif };
            } else if (meta.type === 'THMB') {
              const jpeg = findJpegIn(buf, meta.start, meta.end);
              if (jpeg) candidates.push({ ...jpeg, via: 'cr3-thmb' });
            }
          }
        }
      }
    } else if (top.type === 'uuid') {
      // Preview uuid: a PRVW box follows the uuid behind a short prefix whose
      // layout varies by model, so hunt the JPEG bytes directly.
      const jpeg = findJpegIn(buf, top.start + 16, top.end);
      if (jpeg) candidates.push({ ...jpeg, via: 'cr3-prvw' });
    }
  }

  return { candidates, exif };
}

/** Locates a JPEG (SOI..EOI) inside a byte range, returning absolute offsets. */
function findJpegIn(
  buf: Uint8Array,
  from: number,
  to: number,
): { offset: number; length: number } | null {
  for (let o = from; o + 4 < to; o++) {
    if (buf[o] === 0xff && buf[o + 1] === 0xd8 && buf[o + 2] === 0xff) {
      for (let e = to - 2; e > o; e--) {
        if (buf[e] === 0xff && buf[e + 1] === 0xd9) {
          return { offset: o, length: e + 2 - o };
        }
      }
      return { offset: o, length: to - o };
    }
  }
  return null;
}

export function isCr3(buf: Uint8Array): boolean {
  return buf.byteLength > 16 && fourcc(buf, 4) === 'ftyp' && fourcc(buf, 8) === 'crx ';
}
