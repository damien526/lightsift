'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WorkerResult } from '@/lib/extract.worker';
import { ExtractPool } from '@/lib/workerPool';
import { buildItems, listDirectory, listDropped, type PhotoItem } from '@/lib/session';
import { loadMarks, markKey, saveMark, type Mark } from '@/lib/store';
import { Landing } from './Landing';
import { Workspace } from './Workspace';

const DEMO_FILES = [
  'canon-5d-mark-iv.jpg',
  'canon-eos-r.jpg',
  'nikon-z6.jpg',
  'sony-a7iii.jpg',
  'fujifilm-x-t4.jpg',
  'ricoh-gr-iii.jpg',
  'om-system-om-1.jpg',
  'panasonic-g9.jpg',
  'iphone-12-pro.jpg',
];

export function CullApp({ embedded = false }: { embedded?: boolean }) {
  const [items, setItems] = useState<PhotoItem[] | null>(null);
  const [folderName, setFolderName] = useState('');
  const [busy, setBusy] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);
  const dirHandleRef = useRef<FileSystemDirectoryHandle | null>(null);
  const poolRef = useRef<ExtractPool | null>(null);
  const pendingResults = useRef<WorkerResult[]>([]);
  const flushScheduled = useRef(false);

  const flushResults = useCallback(() => {
    flushScheduled.current = false;
    const batch = pendingResults.current;
    if (batch.length === 0) return;
    pendingResults.current = [];
    setItems((prev) => {
      if (!prev) return prev;
      const byId = new Map(batch.map((r) => [r.id, r]));
      return prev.map((item) => {
        const r = byId.get(item.id);
        if (!r) return item;
        if (!r.ok) return { ...item, status: 'error' as const, error: r.error };
        const thumbUrl = URL.createObjectURL(new Blob([r.thumb!], { type: r.thumbType }));
        return {
          ...item,
          status: 'ready' as const,
          thumbUrl,
          width: r.width,
          height: r.height,
          previewRange: r.previewRange,
          exif: r.exif,
          histogram: r.histogram,
          clippedShare: r.clippedShare,
        };
      });
    });
  }, []);

  const onWorkerResult = useCallback(
    (r: WorkerResult) => {
      pendingResults.current.push(r);
      if (!flushScheduled.current) {
        flushScheduled.current = true;
        requestAnimationFrame(flushResults);
      }
    },
    [flushResults],
  );

  const startSession = useCallback(
    async (
      files: { file: File; relPath: string }[],
      name: string,
      handle: FileSystemDirectoryHandle | null,
    ) => {
      const built = buildItems(files);
      if (built.length === 0) {
        setOpenError('No photos found in that folder. Lightsift reads RAW files (CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2, PEF) and JPEG, PNG or WebP.');
        setBusy(false);
        return;
      }
      // Restore marks from a previous session on the same files.
      const marks = await loadMarks(built.map((i) => markKey(i.name, i.file.size, i.file.lastModified)));
      for (const item of built) {
        const m = marks.get(markKey(item.name, item.file.size, item.file.lastModified));
        if (m) {
          item.rating = m.rating;
          item.flag = m.flag;
        }
      }
      dirHandleRef.current = handle;
      setFolderName(name);
      setItems(built);
      setOpenError(null);
      setBusy(false);

      poolRef.current?.destroy();
      poolRef.current = new ExtractPool(onWorkerResult);
      poolRef.current.enqueue(
        built.map((i) => ({ id: i.id, file: i.file, isRaw: i.isRaw })),
      );
    },
    [onWorkerResult],
  );

  const openFolder = useCallback(async () => {
    setOpenError(null);
    if (window.showDirectoryPicker) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'read' });
        setBusy(true);
        const files = await listDirectory(handle);
        await startSession(files, handle.name, handle);
      } catch (err) {
        setBusy(false);
        if ((err as Error)?.name !== 'AbortError') {
          setOpenError('Could not open that folder. Try dragging it onto the page instead.');
        }
      }
      return;
    }
    // Safari and Firefox: fall back to a directory input.
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.multiple = true;
    input.onchange = () => {
      const list = Array.from(input.files ?? []);
      if (list.length === 0) return;
      setBusy(true);
      const files = list.map((file) => ({
        file,
        relPath: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
      }));
      const root = files[0].relPath.split('/')[0];
      const stripped = files.map((f) => ({
        file: f.file,
        relPath: f.relPath.startsWith(`${root}/`) ? f.relPath.slice(root.length + 1) : f.relPath,
      }));
      void startSession(stripped, root || 'photos', null);
    };
    input.click();
  }, [startSession]);

  const openDrop = useCallback(
    async (dt: DataTransfer) => {
      setBusy(true);
      setOpenError(null);
      try {
        const files = await listDropped(dt.items);
        const name =
          files.length > 0 && files[0].relPath.includes('/')
            ? files[0].relPath.split('/')[0]
            : 'dropped photos';
        await startSession(files, name, null);
      } catch {
        setBusy(false);
        setOpenError('Could not read the dropped items.');
      }
    },
    [startSession],
  );

  const openDemo = useCallback(async () => {
    setBusy(true);
    setOpenError(null);
    try {
      const files = await Promise.all(
        DEMO_FILES.map(async (name, i) => {
          const res = await fetch(`/demo/${name}`);
          const blob = await res.blob();
          return {
            file: new File([blob], name, { type: 'image/jpeg', lastModified: 1700000000000 + i }),
            relPath: name,
          };
        }),
      );
      await startSession(files, 'sample shoot', null);
    } catch {
      setBusy(false);
      setOpenError('Could not load the sample photos.');
    }
  }, [startSession]);

  const onMark = useCallback((id: string, mark: Mark) => {
    setItems((prev) => {
      if (!prev) return prev;
      return prev.map((item) => {
        if (item.id !== id) return item;
        void saveMark(markKey(item.name, item.file.size, item.file.lastModified), mark);
        return { ...item, rating: mark.rating, flag: mark.flag };
      });
    });
  }, []);

  const onReset = useCallback(() => {
    poolRef.current?.destroy();
    poolRef.current = null;
    setItems((prev) => {
      prev?.forEach((i) => i.thumbUrl && URL.revokeObjectURL(i.thumbUrl));
      return null;
    });
    dirHandleRef.current = null;
    setFolderName('');
  }, []);

  useEffect(() => () => poolRef.current?.destroy(), []);

  // Hidden multi-file input: drag-free fallback and automation hook.
  const fileInput = (
    <input
      type="file"
      multiple
      data-testid="file-input"
      className="hidden"
      aria-hidden
      tabIndex={-1}
      onChange={(e) => {
        const list = Array.from(e.currentTarget.files ?? []);
        if (list.length === 0) return;
        setBusy(true);
        void startSession(
          list.map((file) => ({ file, relPath: file.name })),
          'selected photos',
          null,
        );
      }}
    />
  );

  if (items === null) {
    if (embedded) {
      return (
        <>
          {fileInput}
          <EmbeddedDropzone
            busy={busy}
            error={openError}
            onOpenFolder={openFolder}
            onDrop={openDrop}
            onDemo={openDemo}
          />
        </>
      );
    }
    return (
      <>
        {fileInput}
        <Landing
          busy={busy}
          error={openError}
          onOpenFolder={openFolder}
          onDrop={openDrop}
          onDemo={openDemo}
        />
      </>
    );
  }

  const workspace = (
    <Workspace
      items={items}
      folderName={folderName}
      dirHandle={dirHandleRef.current}
      onMark={onMark}
      onReset={onReset}
    />
  );
  return embedded ? <div className="fixed inset-0 z-40">{workspace}</div> : workspace;
}

function EmbeddedDropzone({
  busy,
  error,
  onOpenFolder,
  onDrop,
  onDemo,
}: {
  busy: boolean;
  error: string | null;
  onOpenFolder: () => void;
  onDrop: (dt: DataTransfer) => void;
  onDemo: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-7 transition-colors sm:p-9 ${
        dragging ? 'border-amber bg-amber/10' : 'border-line bg-panel/60'
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        onDrop(e.dataTransfer);
      }}
    >
      <div className="flex flex-col items-center gap-3.5 text-center">
        <button
          type="button"
          onClick={onOpenFolder}
          disabled={busy}
          className="rounded-full bg-amber px-7 py-3 text-base font-semibold text-ink shadow-[0_0_40px_-8px_var(--color-amber)] transition-all hover:bg-amber-bright disabled:opacity-50"
        >
          {busy ? 'Reading folder…' : 'Open a folder of photos'}
        </button>
        <p className="text-sm text-faint">
          or drop files here
          <span className="px-2 text-line">|</span>
          <button
            type="button"
            onClick={onDemo}
            disabled={busy}
            className="text-dim underline decoration-faint underline-offset-4 transition-colors hover:text-amber"
          >
            try the sample shoot
          </button>
        </p>
        <p className="font-mono text-[11px] text-faint">
          Free. No upload: files are read on your device and never sent anywhere.
        </p>
        {error && <p className="max-w-md text-sm text-reject">{error}</p>}
      </div>
    </div>
  );
}
