'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PhotoItem } from '@/lib/session';
import type { Mark } from '@/lib/store';
import { ExportPanel } from './ExportPanel';
import { Grid } from './Grid';
import { Loupe } from './Loupe';

type Filter = 'all' | 'unrated' | 'picks' | 'rejects' | 1 | 2 | 3 | 4 | 5;

const SHORTCUTS: [string, string][] = [
  ['← → ↑ ↓', 'move between photos'],
  ['enter / space', 'open the loupe'],
  ['esc or G', 'back to the grid'],
  ['1 to 5', 'rate'],
  ['0', 'clear the rating'],
  ['P', 'flag as pick'],
  ['X', 'flag as reject'],
  ['U', 'clear the flag'],
  ['Z or click', 'zoom 1:1 and back'],
  ['E', 'export'],
  ['?', 'this overlay'],
];

export function Workspace({
  items,
  folderName,
  dirHandle,
  onMark,
  onReset,
}: {
  items: PhotoItem[];
  folderName: string;
  dirHandle: FileSystemDirectoryHandle | null;
  onMark: (id: string, mark: Mark) => void;
  onReset: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [cursor, setCursor] = useState(0);
  const [loupeOpen, setLoupeOpen] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const visible = useMemo(() => {
    switch (filter) {
      case 'all':
        return items;
      case 'unrated':
        return items.filter((i) => i.rating === 0 && !i.flag);
      case 'picks':
        return items.filter((i) => i.flag === 'pick');
      case 'rejects':
        return items.filter((i) => i.flag === 'reject');
      default:
        return items.filter((i) => i.rating >= filter);
    }
  }, [items, filter]);

  const ready = useMemo(() => items.filter((i) => i.status !== 'pending').length, [items]);
  const picks = useMemo(() => items.filter((i) => i.flag === 'pick').length, [items]);
  const rejects = useMemo(() => items.filter((i) => i.flag === 'reject').length, [items]);
  const clampedCursor = Math.min(cursor, Math.max(0, visible.length - 1));
  const current = visible[clampedCursor];

  const mark = useCallback(
    (patch: Partial<Mark>) => {
      if (!current) return;
      onMark(current.id, {
        rating: patch.rating ?? current.rating,
        flag: patch.flag !== undefined ? patch.flag : current.flag,
      });
    },
    [current, onMark],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (helpOpen || exportOpen) {
        if (e.key === 'Escape' || e.key === '?') {
          setHelpOpen(false);
          setExportOpen(false);
          e.preventDefault();
        }
        return;
      }

      const cols = 1; // vertical step handled by the grid's column count below
      void cols;
      switch (e.key) {
        case 'ArrowRight':
          setCursor((c) => Math.min(visible.length - 1, c + 1));
          e.preventDefault();
          break;
        case 'ArrowLeft':
          setCursor((c) => Math.max(0, c - 1));
          e.preventDefault();
          break;
        case 'ArrowDown':
          if (!loupeOpen) setCursor((c) => Math.min(visible.length - 1, c + gridCols()));
          e.preventDefault();
          break;
        case 'ArrowUp':
          if (!loupeOpen) setCursor((c) => Math.max(0, c - gridCols()));
          e.preventDefault();
          break;
        case 'Enter':
        case ' ':
          setLoupeOpen(true);
          e.preventDefault();
          break;
        case 'Escape':
          if (loupeOpen) setLoupeOpen(false);
          break;
        case 'g':
        case 'G':
          setLoupeOpen(false);
          break;
        case 'z':
        case 'Z':
          if (loupeOpen) setZoom((z) => !z);
          break;
        case 'p':
        case 'P':
          mark({ flag: current?.flag === 'pick' ? null : 'pick' });
          break;
        case 'x':
        case 'X':
          mark({ flag: current?.flag === 'reject' ? null : 'reject' });
          break;
        case 'u':
        case 'U':
          mark({ flag: null });
          break;
        case 'e':
        case 'E':
          setExportOpen(true);
          break;
        case '?':
          setHelpOpen(true);
          break;
        default:
          if (/^[0-5]$/.test(e.key)) {
            mark({ rating: Number(e.key) });
            e.preventDefault();
          }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible.length, loupeOpen, helpOpen, exportOpen, mark, current]);

  // The grid exposes its column count for vertical arrow steps.
  function gridCols(): number {
    const el = document.querySelector('[data-testid="grid"]');
    if (!el) return 4;
    const inner = el.clientWidth - 24;
    return Math.max(2, Math.min(8, Math.round(inner / 264)));
  }

  const chip = (label: string, value: Filter, extra?: string) => (
    <button
      key={String(value)}
      type="button"
      onClick={() => {
        setFilter(value);
        setCursor(0);
      }}
      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
        filter === value
          ? 'border-amber bg-amber/15 text-amber'
          : 'border-line text-dim hover:border-faint hover:text-paper'
      } ${extra ?? ''}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-dvh flex-col bg-ink text-paper">
      <header className="relative z-10 border-b border-line bg-panel">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <button
            type="button"
            onClick={onReset}
            title="Close this folder"
            className="flex items-center gap-2"
          >
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber" />
            <span className="font-display text-lg leading-none text-paper">OnlineCull</span>
          </button>
          <span className="hidden font-mono text-xs text-faint sm:inline" data-testid="session-meta">
            {folderName} · {items.length} photos
            {ready < items.length && ` · ${ready} ready`}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            {chip('all', 'all')}
            {chip('unrated', 'unrated')}
            {chip(`picks ${picks}`, 'picks')}
            {chip(`rejects ${rejects}`, 'rejects')}
            {([1, 2, 3, 4, 5] as const).map((n) => chip(`★${n}+`, n, 'hidden lg:inline-block'))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-label="Keyboard shortcuts"
              className="rounded-full border border-line px-2.5 py-1 text-xs text-dim transition-colors hover:text-paper"
            >
              ?
            </button>
            <button
              type="button"
              data-testid="export-button"
              onClick={() => setExportOpen(true)}
              className="rounded-full bg-amber px-4 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-amber-bright"
            >
              Export
            </button>
          </div>
        </div>
        {ready < items.length && (
          <div className="absolute inset-x-0 bottom-0 h-px bg-line">
            <div
              className="h-px bg-amber transition-[width] duration-300"
              style={{ width: `${(ready / items.length) * 100}%` }}
            />
          </div>
        )}
      </header>

      {visible.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-faint">Nothing matches this filter.</p>
        </div>
      ) : (
        <Grid
          items={visible}
          cursor={clampedCursor}
          onCursor={setCursor}
          onOpen={(i) => {
            setCursor(i);
            setLoupeOpen(true);
          }}
          onRate={(id, rating) => {
            const item = items.find((x) => x.id === id);
            if (item) onMark(id, { rating, flag: item.flag });
          }}
        />
      )}

      {loupeOpen && current && (
        <Loupe
          items={visible}
          index={clampedCursor}
          onIndex={setCursor}
          onClose={() => setLoupeOpen(false)}
          onMark={onMark}
          zoom={zoom}
          onZoomToggle={() => setZoom((z) => !z)}
        />
      )}

      {exportOpen && (
        <ExportPanel
          items={items}
          folderName={folderName}
          dirHandle={dirHandle}
          onClose={() => setExportOpen(false)}
        />
      )}

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-well/80 p-4"
          onClick={() => setHelpOpen(false)}
        >
          <div
            className="fade-up w-full max-w-sm rounded-xl border border-line bg-panel p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-display text-2xl text-paper">Keyboard</h2>
            <dl className="space-y-2">
              {SHORTCUTS.map(([key, what]) => (
                <div key={key} className="flex items-baseline justify-between gap-4">
                  <dt className="font-mono text-xs text-amber">{key}</dt>
                  <dd className="text-right text-xs text-dim">{what}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
