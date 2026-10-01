import { parseJpegExif } from './tiff';
import type { ParseResult } from './types';

/**
 * Fujifilm RAF: fixed header, then a full-size embedded JPEG whose offset and
 * length are stored big-endian at bytes 84 and 88. The JPEG carries the EXIF.
 */
export function isRaf(buf: Uint8Array): boolean {
  const magic = 'FUJIFILMCCD-RAW';
  if (buf.byteLength < 100) return false;
  for (let i = 0; i < magic.length; i++) {
    if (buf[i] !== magic.charCodeAt(i)) return false;
  }
  return true;
}

export function parseRaf(buf: Uint8Array, fileSize: number): ParseResult {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const offset = view.getUint32(84);
  const length = view.getUint32(88);
  const result: ParseResult = { candidates: [], exif: {} };
  if (offset > 0 && length > 16 && offset + length <= fileSize) {
    result.candidates.push({ offset, length, via: 'raf-header' });
    // The embedded JPEG usually sits inside the parsed window: mine its EXIF.
    if (offset + 4 < buf.byteLength) {
      const sub = buf.subarray(offset, Math.min(offset + length, buf.byteLength));
      result.exif = parseJpegExif(sub).exif;
    }
  }
  return result;
}
