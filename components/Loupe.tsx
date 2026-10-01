'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { exifLine, formatExifDate } from '@/lib/format';
import type { PhotoItem } from '@/lib/session';
import type { Mark } from '@/lib/store';
import { FlagBadge, Stars } from './Stars';

/**
 * Full-screen viewer drawn on canvas so RAW preview rotation, fit and 1:1
 * zoom behave identically across engines. Neighbors preload for instant
 * arrow-key flipping.
 */

const bitmapCache = new Map<string, Promise<ImageBitmap>>();
const CACHE_MAX = 8;

async function loadBitmap(item: PhotoItem): Promise<ImageBitmap> {
  const cached = bitmapCache.get(item.id);
  if (cached) return cached;
  const promise = (async () => {
    if (item.isRaw && item.previewRange) {
      const blob = item.file.slice(
        item.previewRange.offset,
        item.previewRange.offset + item.previewRange.length,
      );
      return createImageBitmap(new Blob([await blob.arrayBuffer()], { type: 'image/jpeg' }));
    }
    return createImageBitmap(item.file, { imageOrientation: 'from-image' });
  })();
  bitmapCache.set(item.id, promise);
  if (bitmapCache.size > CACHE_MAX) {
    const first = bitmapCache.keys().next().value;
    if (first && first !== item.id) {
      const evicted = bitmapCache.get(first);
      bitmapCache.delete(first);
      evicted?.then((b) => b.close()).catch(() => undefined);
    }
  }
  return promise;
}

function orientationAngle(item: PhotoItem): number {
  const o = item.isRaw ? (item.exif?.orientation ?? 1) : 1;
  if (o === 3) return Math.PI;
  if (o === 6) return Math.PI / 2;
  if (o === 8) return -Math.PI / 2;
  return 0;
}

export function Loupe({
  items,
  index,
  onIndex,
  onClose,
  onMark,
  zoom,
  onZoomToggle,
}: {
  items: PhotoItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  onMark: (id: string, mark: Mark) => void;
  zoom: boolean;
  onZoomToggle: () => void;
}) {
  const item = items[index];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [loading, setLoading] = useState(true);
  const panRef = useRef({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  // Load current, then preload neighbors.
  useEffect(() => {
    if (!item || item.status !== 'ready') return;
    let alive = true;
    setLoading(true);
    loadBitmap(item)
      .then((b) => {
        if (alive) {
          setBitmap(b);
          setLoading(false);
        }
      })
      .catch(() => alive && setLoading(false));
    for (const n of [index + 1, index - 1]) {
      const neighbor = items[n];
      if (neighbor && neighbor.status === 'ready') void loadBitmap(neighbor).catch(() => undefined);
    }
    return () => {
      alive = false;
    };
  }, [item, index, items]);

  useEffect(() => {
    panRef.current = { x: 0, y: 0 };
  }, [item?.id, zoom]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const box = boxRef.current;
    if (!canvas || !box || !bitmap || !item) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = box.clientWidth;
    const ch = box.clientHeight;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    const ctx = canvas.getContext('2d')!;
    const angle = orientationAngle(item);
    const rotated = angle === Math.PI / 2 || angle === -Math.PI / 2;
    const ow = rotated ? bitmap.height : bitmap.width;
    const oh = rotated ? bitmap.width : bitmap.height;
    const fitScale = Math.min(cw / ow, ch / oh, 1);
    const scale = zoom ? 1 : fitScale;

    // Clamp pan so the image cannot be lost off screen.
    const maxX = Math.max(0, (ow * scale - cw) / 2);
    const maxY = Math.max(0, (oh * scale - ch) / 2);
    panRef.current.x = Math.min(maxX, Math.max(-maxX, panRef.current.x));
    panRef.current.y = Math.min(maxY, Math.max(-maxY, panRef.current.y));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.imageSmoothingQuality = 'high';
    ctx.translate(cw / 2 + panRef.current.x, ch / 2 + panRef.current.y);
    ctx.scale(scale, scale);
    ctx.rotate(angle);
    ctx.drawImage(bitmap, -bitmap.width / 2, -bitmap.height / 2);
  }, [bitmap, item, zoom]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [draw]);

  if (!item) return null;
  const mark = { rating: item.rating, flag: item.flag };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-well/[0.985]" data-testid="loupe">
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-mono text-xs text-dim">
            {index + 1} / {items.length}
          </span>
          <span className="truncate font-mono text-xs text-paper">{item.name}</span>
          {item.exif?.dateTimeOriginal && (
            <span className="hidden truncate font-mono text-xs text-faint md:inline">
              {formatExifDate(item.exif.dateTimeOriginal)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onZoomToggle}
            className={`rounded border px-2 py-0.5 font-mono text-xs transition-colors ${
              zoom ? 'border-amber text-amber' : 'border-line text-dim hover:text-paper'
            }`}
          >
            {zoom ? '1:1' : 'fit'}
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded border border-line px-2 py-0.5 text-xs text-dim transition-colors hover:text-paper"
          >
            esc
          </button>
        </div>
      </div>

      <div
        ref={boxRef}
        className={`relative flex-1 overflow-hidden ${zoom ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'}`}
        onClick={(e) => {
          if (!dragRef.current && Math.abs(e.movementX) < 3) onZoomToggle();
        }}
        onPointerDown={(e) => {
          if (!zoom) return;
          dragRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!dragRef.current) return;
          panRef.current = {
            x: e.clientX - dragRef.current.x,
            y: e.clientY - dragRef.current.y,
          };
          draw();
        }}
        onPointerUp={() => {
          // Let the click handler know a drag just happened.
          setTimeout(() => (dragRef.current = null), 0);
        }}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />
        {(loading || item.status !== 'ready') && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-mono text-xs text-faint">
              {item.status === 'error' ? 'no preview available' : 'developing…'}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label="Previous"
          onClick={(e) => {
            e.stopPropagation();
            onIndex(Math.max(0, index - 1));
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 px-3 py-10 text-2xl text-faint transition-colors hover:text-paper"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label="Next"
          onClick={(e) => {
            e.stopPropagation();
            onIndex(Math.min(items.length - 1, index + 1));
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 px-3 py-10 text-2xl text-faint transition-colors hover:text-paper"
        >
          ›
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line bg-panel/80 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-4">
          {item.histogram && <Histogram bins={item.histogram} />}
          <span className="truncate font-mono text-xs text-dim">{exifLine(item.exif)}</span>
          {item.clippedShare !== undefined && item.clippedShare > 0.015 && (
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-reject">
              clipped
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Stars rating={item.rating} onRate={(n) => onMark(item.id, { ...mark, rating: n })} />
          <button
            type="button"
            onClick={() => onMark(item.id, { ...mark, flag: mark.flag === 'pick' ? null : 'pick' })}
            className={`rounded border px-2.5 py-1 text-xs font-semibold transition-colors ${
              item.flag === 'pick'
                ? 'border-pick bg-pick text-ink'
                : 'border-line text-dim hover:border-pick hover:text-pick'
            }`}
          >
            pick · P
          </button>
          <button
            type="button"
            onClick={() =>
              onMark(item.id, { ...mark, flag: mark.flag === 'reject' ? null : 'reject' })
            }
            className={`rounded border px-2.5 py-1 text-xs font-semibold transition-colors ${
              item.flag === 'reject'
                ? 'border-reject bg-reject text-ink'
                : 'border-line text-dim hover:border-reject hover:text-reject'
            }`}
          >
            reject · X
          </button>
          <FlagBadge flag={item.flag} />
        </div>
      </div>
    </div>
  );
}

function Histogram({ bins }: { bins: number[] }) {
  const max = Math.max(...bins, 1);
  const points = bins
    .map((v, i) => `${(i / (bins.length - 1)) * 72},${22 - Math.pow(v / max, 0.42) * 22}`)
    .join(' ');
  return (
    <svg width="72" height="22" className="shrink-0 opacity-80" aria-hidden>
      <polyline points={points} fill="none" stroke="var(--color-amber)" strokeWidth="1" />
    </svg>
  );
}
