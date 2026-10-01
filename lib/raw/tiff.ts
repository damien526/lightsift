import type { ExifSummary, ParseResult, PreviewCandidate } from './types';

/**
 * TIFF/EP walker shared by CR2, NEF, NRW, ARW, DNG, PEF, ORF, RW2 and JPEG EXIF.
 * It collects every embedded JPEG it can address (thumbnail IFDs, SubIFDs,
 * old-JPEG strips, Panasonic JpgFromRaw) and a summary of the shooting EXIF.
 */

const TAG = {
  imageWidth: 0x0100,
  imageLength: 0x0101,
  compression: 0x0103,
  make: 0x010f,
  model: 0x0110,
  stripOffsets: 0x0111,
  orientation: 0x0112,
  stripByteCounts: 0x0117,
  subIfds: 0x014a,
  jpegIfOffset: 0x0201,
  jpegIfLength: 0x0202,
  exifIfd: 0x8769,
  exposureTime: 0x829a,
  fNumber: 0x829d,
  iso: 0x8827,
  dateTimeOriginal: 0x9003,
  focalLength: 0x920a,
  lensModel: 0xa434,
  // Panasonic RW2: the full-size JPEG lives in this IFD0 tag.
  rw2JpgFromRaw: 0x002e,
} as const;

const TYPE_SIZE: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  6: 1, // SBYTE
  7: 1, // UNDEFINED
  8: 2, // SSHORT
  9: 4, // SLONG
  10: 8, // SRATIONAL
};

interface Entry {
  tag: number;
  type: number;
  count: number;
  /** Absolute offset (within the parsed buffer) of the value bytes. */
  valueOffset: number;
}

class Reader {
  view: DataView;
  little: boolean;
  /** The parsed buffer starts at this absolute file offset (0 except for JPEG APP1). */
  base: number;

  constructor(buf: Uint8Array, little: boolean, base = 0) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    this.little = little;
    this.base = base;
  }

  u16(o: number): number {
    return this.view.getUint16(o, this.little);
  }
  u32(o: number): number {
    return this.view.getUint32(o, this.little);
  }
  ok(o: number, len: number): boolean {
    return o >= 0 && o + len <= this.view.byteLength;
  }
}

function readEntries(r: Reader, ifdOffset: number): Entry[] {
  if (!r.ok(ifdOffset, 2)) return [];
  const count = r.u16(ifdOffset);
  if (count === 0 || count > 2048) return [];
  const entries: Entry[] = [];
  for (let i = 0; i < count; i++) {
    const e = ifdOffset + 2 + i * 12;
    if (!r.ok(e, 12)) break;
    const tag = r.u16(e);
    const type = r.u16(e + 4 - 2);
    const cnt = r.u32(e + 4);
    const size = (TYPE_SIZE[type] ?? 0) * cnt;
    const valueOffset = size > 4 ? r.u32(e + 8) : e + 8;
    entries.push({ tag, type, count: cnt, valueOffset });
  }
  return entries;
}

function entryNumber(r: Reader, e: Entry): number | undefined {
  if (!r.ok(e.valueOffset, TYPE_SIZE[e.type] ?? 1)) return undefined;
  switch (e.type) {
    case 1:
    case 7:
      return r.view.getUint8(e.valueOffset);
    case 3:
      return r.u16(e.valueOffset);
    case 4:
      return r.u32(e.valueOffset);
    case 5: {
      const n = r.u32(e.valueOffset);
      const d = r.u32(e.valueOffset + 4);
      return d === 0 ? undefined : n / d;
    }
    case 9:
      return r.view.getInt32(e.valueOffset, r.little);
    case 10: {
      const n = r.view.getInt32(e.valueOffset, r.little);
      const d = r.view.getInt32(e.valueOffset + 4, r.little);
      return d === 0 ? undefined : n / d;
    }
    default:
      return undefined;
  }
}

function entryNumbers(r: Reader, e: Entry): number[] {
  const size = TYPE_SIZE[e.type] ?? 0;
  if (size === 0 || !r.ok(e.valueOffset, size * e.count)) return [];
  const out: number[] = [];
  for (let i = 0; i < e.count && i < 4096; i++) {
    const o = e.valueOffset + i * size;
    if (e.type === 3) out.push(r.u16(o));
    else if (e.type === 4) out.push(r.u32(o));
    else if (e.type === 1 || e.type === 7) out.push(r.view.getUint8(o));
  }
  return out;
}

function entryAscii(r: Reader, e: Entry): string | undefined {
  if (e.type !== 2 || !r.ok(e.valueOffset, e.count)) return undefined;
  const bytes = new Uint8Array(r.view.buffer, r.view.byteOffset + e.valueOffset, e.count);
  let end = bytes.indexOf(0);
  if (end === -1) end = bytes.length;
  return new TextDecoder('ascii').decode(bytes.subarray(0, end)).trim() || undefined;
}

/**
 * Walks the IFD chain plus SubIFDs and the Exif IFD.
 * `headerLimit` guards against malformed files sending us in circles.
 */
export function parseTiff(buf: Uint8Array, absBase = 0): ParseResult {
  const exif: ExifSummary = {};
  const candidates: PreviewCandidate[] = [];
  if (buf.byteLength < 16) return { candidates, exif };

  const b0 = buf[0];
  const b1 = buf[1];
  let little: boolean;
  if (b0 === 0x49 && b1 === 0x49) little = true;
  else if (b0 === 0x4d && b1 === 0x4d) little = false;
  else return { candidates, exif };

  const r = new Reader(buf, little, absBase);
  // Magic: 42 (TIFF/CR2/NEF/ARW/DNG/PEF), 0x4f52/0x5253 (ORF), 0x55 (RW2).
  const magic = r.u16(2);
  const knownMagic = [42, 0x4f52, 0x5253, 0x55];
  if (!knownMagic.includes(magic)) return { candidates, exif };
  const firstIfd = r.u32(4);

  const visited = new Set<number>();
  const queue: { offset: number; label: string }[] = [{ offset: firstIfd, label: 'ifd0' }];
  let isFirst = true;

  while (queue.length > 0) {
    const { offset, label } = queue.shift()!;
    if (visited.has(offset) || visited.size > 64) continue;
    visited.add(offset);
    const entries = readEntries(r, offset);
    if (entries.length === 0) continue;

    let jpegOffset: number | undefined;
    let jpegLength: number | undefined;
    let stripOffsets: number[] = [];
    let stripCounts: number[] = [];
    let compression: number | undefined;

    for (const e of entries) {
      switch (e.tag) {
        case TAG.make:
          if (!exif.make) exif.make = entryAscii(r, e);
          break;
        case TAG.model:
          if (!exif.model) exif.model = entryAscii(r, e);
          break;
        case TAG.orientation:
          if (isFirst || exif.orientation === undefined) exif.orientation = entryNumber(r, e);
          break;
        case TAG.imageWidth:
          if (isFirst) exif.rawWidth = entryNumber(r, e);
          break;
        case TAG.imageLength:
          if (isFirst) exif.rawHeight = entryNumber(r, e);
          break;
        case TAG.compression:
          compression = entryNumber(r, e);
          break;
        case TAG.stripOffsets:
          stripOffsets = entryNumbers(r, e);
          break;
        case TAG.stripByteCounts:
          stripCounts = entryNumbers(r, e);
          break;
        case TAG.jpegIfOffset:
          jpegOffset = entryNumber(r, e);
          break;
        case TAG.jpegIfLength:
          jpegLength = entryNumber(r, e);
          break;
        case TAG.subIfds:
          for (const sub of entryNumbers(r, e)) queue.push({ offset: sub, label: 'subifd' });
          break;
        case TAG.exifIfd: {
          const sub = entryNumber(r, e);
          if (sub !== undefined) queue.push({ offset: sub, label: 'exif' });
          break;
        }
        case TAG.exposureTime:
          if (exif.exposureTime === undefined) exif.exposureTime = entryNumber(r, e);
          break;
        case TAG.fNumber:
          if (exif.fNumber === undefined) exif.fNumber = entryNumber(r, e);
          break;
        case TAG.iso:
          if (exif.iso === undefined) exif.iso = entryNumber(r, e);
          break;
        case TAG.dateTimeOriginal:
          if (!exif.dateTimeOriginal) exif.dateTimeOriginal = entryAscii(r, e);
          break;
        case TAG.focalLength:
          if (exif.focalLength === undefined) exif.focalLength = entryNumber(r, e);
          break;
        case TAG.lensModel:
          if (!exif.lens) exif.lens = entryAscii(r, e);
          break;
        case TAG.rw2JpgFromRaw:
          // The JPEG bytes are the tag value itself.
          if (e.type === 7 && e.count > 8) {
            candidates.push({ offset: absBase + e.valueOffset, length: e.count, via: 'rw2-jpgfromraw' });
          }
          break;
      }
    }

    if (jpegOffset !== undefined && jpegLength !== undefined && jpegLength > 0) {
      candidates.push({ offset: absBase + jpegOffset, length: jpegLength, via: `${label}-jpegif` });
    }
    // Old-JPEG (6) or JPEG (7) compressed strips: CR2 IFD0 stores its big preview this way.
    if (
      stripOffsets.length === 1 &&
      stripCounts.length === 1 &&
      (compression === 6 || compression === 7 || compression === undefined)
    ) {
      if (stripCounts[0] > 16) {
        candidates.push({ offset: absBase + stripOffsets[0], length: stripCounts[0], via: `${label}-strip` });
      }
    }

    // Next IFD in the chain (thumbnail IFD1 and beyond).
    const next = offset + 2 + entries.length * 12;
    if (r.ok(next, 4)) {
      const nextIfd = r.u32(next);
      if (nextIfd !== 0) queue.push({ offset: nextIfd, label: 'ifd-chain' });
    }
    isFirst = false;
  }

  return { candidates, exif };
}

/** Finds the EXIF APP1 segment of a plain JPEG and runs the TIFF walker on it. */
export function parseJpegExif(buf: Uint8Array): ParseResult {
  const empty: ParseResult = { candidates: [], exif: {} };
  if (buf.byteLength < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return empty;
  let o = 2;
  while (o + 4 < buf.byteLength) {
    if (buf[o] !== 0xff) break;
    const marker = buf[o + 1];
    if (marker === 0xda) break; // start of scan: no EXIF past this point
    const len = (buf[o + 2] << 8) | buf[o + 3];
    if (marker === 0xe1 && len > 8) {
      const sig = buf.subarray(o + 4, o + 10);
      if (
        sig[0] === 0x45 && sig[1] === 0x78 && sig[2] === 0x69 && sig[3] === 0x66 &&
        sig[4] === 0 && sig[5] === 0
      ) {
        const tiff = buf.subarray(o + 10, o + 2 + len);
        return parseTiff(tiff);
      }
    }
    o += 2 + len;
  }
  return empty;
}
