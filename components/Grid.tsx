'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { PhotoItem } from '@/lib/session';
import { FlagBadge, Stars } from './Stars';

/**
 * Hand-rolled row virtualization: thousands of thumbnails scroll at 60 fps
 * because only the visible rows (plus a small overscan) touch the DOM.
 */

const GAP = 10;
const META_H = 30;
const TARGET_CELL = 264;
const OVERSCAN_ROWS = 3;

export function Grid({
  items,
  cursor,
  onCursor,
  onOpen,
  onRate,
}: {
  items: PhotoItem[];
  cursor: number;
  onCursor: (i: number) => void;
  onOpen: (i: number) => void;
  onRate: (id: string, rating: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(800);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
      setViewportH(el.clientHeight);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    setViewportH(el.clientHeight);
    return () => ro.disconnect();
  }, []);

  const inner = width - 24;
  const cols = Math.max(2, Math.min(8, Math.round(inner / TARGET_CELL)));
  const cellW = (inner - GAP * (cols - 1)) / cols;
  const imgH = Math.round((cellW * 2) / 3);
  const rowH = imgH + META_H + GAP;
  const rows = Math.ceil(items.length / cols);
  const totalH = rows * rowH + 24;

  const firstRow = Math.max(0, Math.floor(scrollTop / rowH) - OVERSCAN_ROWS);
  const lastRow = Math.min(rows - 1, Math.ceil((scrollTop + viewportH) / rowH) + OVERSCAN_ROWS);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  // Keep the keyboard cursor on screen.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || cursor < 0) return;
    const row = Math.floor(cursor / cols);
    const top = row * rowH;
    const bottom = top + rowH;
    if (top < el.scrollTop) el.scrollTo({ top: top - 8 });
    else if (bottom > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: bottom - el.clientHeight + 8 });
    }
  }, [cursor, cols, rowH]);

  const visible: React.ReactNode[] = [];
  for (let row = firstRow; row <= lastRow; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      if (i >= items.length) break;
      const item = items[i];
      visible.push(
        <Cell
          key={item.id}
          item={item}
          selected={i === cursor}
          style={{
            position: 'absolute',
            left: 12 + col * (cellW + GAP),
            top: 12 + row * rowH,
            width: cellW,
          }}
          imgH={imgH}
          onClick={() => onCursor(i)}
          onDoubleClick={() => onOpen(i)}
          onRate={(n) => onRate(item.id, n)}
        />,
      );
    }
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="cull-scroll relative flex-1 overflow-y-auto bg-ink"
      data-testid="grid"
    >
      <div style={{ height: totalH, position: 'relative' }}>{visible}</div>
    </div>
  );
}

function Cell({
  item,
  selected,
  style,
  imgH,
  onClick,
  onDoubleClick,
  onRate,
}: {
  item: PhotoItem;
  selected: boolean;
  style: React.CSSProperties;
  imgH: number;
  onClick: () => void;
  onDoubleClick: () => void;
  onRate: (n: number) => void;
}) {
  return (
    <figure
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-testid="cell"
      data-name={item.name}
      className={`group cursor-pointer select-none overflow-hidden rounded-lg border transition-colors ${
        selected
          ? 'border-amber shadow-[0_0_0_1px_var(--color-amber),0_0_24px_-6px_color-mix(in_srgb,var(--color-amber)_55%,transparent)]'
          : 'border-line hover:border-faint'
      } ${item.flag === 'reject' ? 'opacity-55' : ''} bg-card`}
    >
      <div
        className="relative flex w-full items-center justify-center overflow-hidden bg-well"
        style={{ height: imgH }}
      >
        {item.status === 'ready' && item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbUrl}
            alt={item.name}
            draggable={false}
            className="thumb-in max-h-full max-w-full object-contain"
          />
        ) : item.status === 'error' ? (
          <span className="px-3 text-center text-xs text-faint">no preview</span>
        ) : (
          <span className="h-full w-full animate-pulse bg-card" />
        )}
        {item.clippedShare !== undefined && item.clippedShare > 0.015 && (
          <span
            title="Blown highlights"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-reject/90"
          />
        )}
        {item.jpegSibling && (
          <span className="absolute left-1.5 top-1.5 rounded bg-ink/70 px-1 py-px font-mono text-[9px] tracking-wide text-dim">
            +JPG
          </span>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-2" style={{ height: META_H }}>
        <span className="truncate font-mono text-[10px] text-dim">{item.name}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          <Stars rating={item.rating} onRate={onRate} size="sm" />
          <FlagBadge flag={item.flag} />
        </span>
      </figcaption>
    </figure>
  );
}
