'use client';

import { useMemo, useState } from 'react';
import type { PhotoItem } from '@/lib/session';
import { buildZip } from '@/lib/zip';
import { formatBytes } from '@/lib/format';
import { sidecarName, xmpSidecar } from '@/lib/xmp';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function resolveDir(
  root: FileSystemDirectoryHandle,
  relPath: string,
): Promise<FileSystemDirectoryHandle> {
  const parts = relPath.split('/').slice(0, -1);
  let dir = root;
  for (const part of parts) dir = await dir.getDirectoryHandle(part);
  return dir;
}

export function ExportPanel({
  items,
  folderName,
  dirHandle,
  onClose,
}: {
  items: PhotoItem[];
  folderName: string;
  dirHandle: FileSystemDirectoryHandle | null;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [workingOn, setWorkingOn] = useState<string | null>(null);

  const marked = useMemo(() => items.filter((i) => i.rating > 0 || i.flag), [items]);
  const picks = useMemo(() => items.filter((i) => i.flag === 'pick'), [items]);
  const rejects = useMemo(() => items.filter((i) => i.flag === 'reject'), [items]);
  const picksSize = picks.reduce((a, i) => a + i.file.size, 0);

  const zipSidecars = () => {
    const encoder = new TextEncoder();
    const entries = marked.map((i) => ({
      name: sidecarName(i.relPath),
      data: encoder.encode(xmpSidecar({ rating: i.rating, flag: i.flag })),
    }));
    download(buildZip(entries), `${folderName || 'photos'}-xmp.zip`);
    setStatus(`Downloaded ${entries.length} XMP sidecars. Unzip them next to your RAW files, then import the folder: Lightroom, Bridge and Capture One read the ratings automatically.`);
  };

  const writeSidecars = async () => {
    if (!dirHandle) return;
    setWorkingOn('write');
    try {
      const permission = await dirHandle.requestPermission?.({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setStatus('Write permission was declined. You can still download the sidecars as a ZIP.');
        setWorkingOn(null);
        return;
      }
      let n = 0;
      for (const item of marked) {
        const dir = await resolveDir(dirHandle, item.relPath);
        const handle = await dir.getFileHandle(sidecarName(item.name), { create: true });
        const writable = await handle.createWritable();
        await writable.write(xmpSidecar({ rating: item.rating, flag: item.flag }));
        await writable.close();
        n++;
        setStatus(`Writing sidecars… ${n} / ${marked.length}`);
      }
      setStatus(`Wrote ${n} XMP sidecars next to your files. Import the folder in Lightroom or Bridge: ratings, picks (green label) and rejects (red label) come with it.`);
    } catch (err) {
      setStatus(`Could not write sidecars: ${err instanceof Error ? err.message : String(err)}`);
    }
    setWorkingOn(null);
  };

  const copySelects = async () => {
    if (!dirHandle) return;
    setWorkingOn('copy');
    try {
      const permission = await dirHandle.requestPermission?.({ mode: 'readwrite' });
      if (permission !== 'granted') {
        setStatus('Write permission was declined.');
        setWorkingOn(null);
        return;
      }
      const target = await dirHandle.getDirectoryHandle('onlinecull-selects', { create: true });
      let n = 0;
      for (const item of picks) {
        const out = await target.getFileHandle(item.name, { create: true });
        const writable = await out.createWritable();
        await item.file.stream().pipeTo(writable);
        if (item.jpegSibling) {
          const outJpeg = await target.getFileHandle(item.jpegSibling.name, { create: true });
          const writableJpeg = await outJpeg.createWritable();
          await item.jpegSibling.stream().pipeTo(writableJpeg);
        }
        n++;
        setStatus(`Copying picks… ${n} / ${picks.length}`);
      }
      setStatus(`Copied ${n} picks into "${folderName}/onlinecull-selects". Originals untouched.`);
    } catch (err) {
      setStatus(`Could not copy: ${err instanceof Error ? err.message : String(err)}`);
    }
    setWorkingOn(null);
  };

  const copyList = async () => {
    const text = picks.map((i) => i.name).join('\n');
    await navigator.clipboard.writeText(text);
    setStatus(`Copied ${picks.length} filenames to the clipboard.`);
  };

  const downloadCsv = () => {
    const rows = [
      'filename,rating,flag',
      ...items
        .filter((i) => i.rating > 0 || i.flag)
        .map((i) => `"${i.relPath.replaceAll('"', '""')}",${i.rating},${i.flag ?? ''}`),
    ];
    download(new Blob([rows.join('\n')], { type: 'text/csv' }), `${folderName || 'photos'}-culling.csv`);
    setStatus('CSV downloaded.');
  };

  const actionClass =
    'w-full rounded-lg border border-line bg-card px-4 py-3 text-left transition-colors hover:border-amber disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-well/80 p-4"
      onClick={onClose}
      data-testid="export-panel"
    >
      <div
        className="fade-up w-full max-w-lg rounded-xl border border-line bg-panel p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-display text-2xl text-paper">Export your cull</h2>
          <button type="button" onClick={onClose} className="text-sm text-faint hover:text-paper">
            esc
          </button>
        </div>
        <p className="mb-5 font-mono text-xs text-dim">
          <span className="text-pick">{picks.length} pick{picks.length === 1 ? '' : 's'}</span>
          {' · '}
          <span className="text-reject">{rejects.length} reject{rejects.length === 1 ? '' : 's'}</span>
          {' · '}
          {marked.length} marked of {items.length}
          {picks.length > 0 && ` · ${formatBytes(picksSize)} selected`}
        </p>

        <div className="space-y-2.5">
          {dirHandle && (
            <>
              <button
                type="button"
                className={actionClass}
                disabled={marked.length === 0 || workingOn !== null}
                onClick={writeSidecars}
              >
                <span className="block text-sm font-semibold text-paper">
                  Write XMP sidecars next to the files
                </span>
                <span className="block text-xs text-dim">
                  Lightroom, Bridge and Capture One pick the ratings up on import. Your photos are not modified.
                </span>
              </button>
              <button
                type="button"
                className={actionClass}
                disabled={picks.length === 0 || workingOn !== null}
                onClick={copySelects}
              >
                <span className="block text-sm font-semibold text-paper">
                  Copy the {picks.length} picks into a selects folder
                </span>
                <span className="block text-xs text-dim">
                  Duplicates the keepers into "onlinecull-selects" inside your folder.
                </span>
              </button>
            </>
          )}
          <button
            type="button"
            className={actionClass}
            disabled={marked.length === 0}
            onClick={zipSidecars}
          >
            <span className="block text-sm font-semibold text-paper">Download XMP sidecars (.zip)</span>
            <span className="block text-xs text-dim">
              Unzip next to your RAW files; every catalog app reads them.
            </span>
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              className={actionClass}
              disabled={picks.length === 0}
              onClick={copyList}
            >
              <span className="block text-sm font-semibold text-paper">Copy picks list</span>
              <span className="block text-xs text-dim">Filenames to clipboard.</span>
            </button>
            <button
              type="button"
              className={actionClass}
              disabled={marked.length === 0}
              onClick={downloadCsv}
            >
              <span className="block text-sm font-semibold text-paper">Download CSV</span>
              <span className="block text-xs text-dim">Filename, rating, flag.</span>
            </button>
          </div>
        </div>

        {!dirHandle && (
          <p className="mt-4 text-xs text-faint">
            Tip: in Chrome or Edge, open the folder with the "Open a folder" button and OnlineCull can
            also write sidecars directly next to your files and copy picks into a selects folder.
          </p>
        )}
        {status && (
          <p className="mt-4 rounded-lg border border-line bg-card px-3 py-2 text-xs text-dim" data-testid="export-status">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
