import { extractPreview, fileSource } from './raw/extract';
import type { ExifSummary } from './raw/types';

/**
 * One worker of the preview pool. Receives a File, returns a ready-to-paint
 * thumbnail plus the byte range of the full preview for on-demand loupe use.
 */

export interface WorkerJob {
  id: string;
  file: File;
  isRaw: boolean;
}

export interface WorkerResult {
  id: string;
  ok: boolean;
  error?: string;
  thumb?: ArrayBuffer;
  thumbType?: string;
  width?: number;
  height?: number;
  previewRange?: { offset: number; length: number } | null;
  exif?: ExifSummary;
  histogram?: number[];
  clippedShare?: number;
}

const THUMB_MAX = 640;

self.onmessage = async (e: MessageEvent<WorkerJob>) => {
  const { id, file, isRaw } = e.data;
  try {
    let bitmap: ImageBitmap;
    let previewRange: { offset: number; length: number } | null = null;
    let exif: ExifSummary = {};

    if (isRaw) {
      const extraction = await extractPreview(fileSource(file));
      exif = extraction.exif;
      previewRange = extraction.range;
      if (extraction.via === 'native') {
        bitmap = await createImageBitmap(file);
      } else if (extraction.jpeg) {
        const blob = new Blob([extraction.jpeg as BlobPart], { type: 'image/jpeg' });
        bitmap = await createImageBitmap(blob);
      } else {
        throw new Error('No embedded preview found');
      }
    } else {
      const { parseJpegExif } = await import('./raw/tiff');
      try {
        const head = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
        exif = parseJpegExif(head).exif;
      } catch {
        // EXIF is a nice-to-have for plain images.
      }
      bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      previewRange = { offset: 0, length: file.size };
    }

    const sourceW = bitmap.width;
    const sourceH = bitmap.height;
    const scale = Math.min(1, THUMB_MAX / Math.max(sourceW, sourceH));
    const orientation = isRaw ? (exif.orientation ?? 1) : 1;
    const rotated = orientation === 6 || orientation === 8;
    const w = Math.max(1, Math.round(sourceW * scale));
    const h = Math.max(1, Math.round(sourceH * scale));

    const canvas = new OffscreenCanvas(rotated ? h : w, rotated ? w : h);
    const ctx = canvas.getContext('2d')!;
    if (orientation === 3) {
      ctx.translate(w, h);
      ctx.rotate(Math.PI);
    } else if (orientation === 6) {
      ctx.translate(h, 0);
      ctx.rotate(Math.PI / 2);
    } else if (orientation === 8) {
      ctx.translate(0, w);
      ctx.rotate(-Math.PI / 2);
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    // Luma histogram + clipped-highlights share, computed on the thumbnail.
    const sample = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const histogram = new Array<number>(64).fill(0);
    let clipped = 0;
    const pixels = sample.length / 4;
    for (let i = 0; i < sample.length; i += 4) {
      const luma = 0.2126 * sample[i] + 0.7152 * sample[i + 1] + 0.0722 * sample[i + 2];
      histogram[Math.min(63, luma >> 2)]++;
      if (luma > 250) clipped++;
    }

    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.82 });
    const thumb = await blob.arrayBuffer();

    const result: WorkerResult = {
      id,
      ok: true,
      thumb,
      thumbType: blob.type,
      width: rotated ? sourceH : sourceW,
      height: rotated ? sourceW : sourceH,
      previewRange,
      exif,
      histogram,
      clippedShare: clipped / pixels,
    };
    (self as unknown as Worker).postMessage(result, [thumb]);
  } catch (err) {
    const result: WorkerResult = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    (self as unknown as Worker).postMessage(result);
  }
};
