import type { ExifSummary } from './raw/types';
import { RAW_EXTENSIONS, extensionOf, isSupportedFile } from './raw/types';

export interface PhotoItem {
  id: string;
  file: File;
  name: string;
  /** Path relative to the opened folder, for display and selects copying. */
  relPath: string;
  isRaw: boolean;
  /** A JPEG shot alongside the RAW (same base name) that we fold into one card. */
  jpegSibling?: File;
  status: 'pending' | 'ready' | 'error';
  error?: string;
  thumbUrl?: string;
  width?: number;
  height?: number;
  previewRange?: { offset: number; length: number } | null;
  exif?: ExifSummary;
  histogram?: number[];
  clippedShare?: number;
  rating: number;
  flag: 'pick' | 'reject' | null;
}

export function isRawFile(name: string): boolean {
  return (RAW_EXTENSIONS as readonly string[]).includes(extensionOf(name));
}

function baseName(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? name : name.slice(0, i);
}

/**
 * Turns a flat file listing into photo items: unsupported files drop out,
 * RAW+JPEG pairs collapse into the RAW with the JPEG noted as sibling.
 */
export function buildItems(files: { file: File; relPath: string }[]): PhotoItem[] {
  const supported = files.filter((f) => isSupportedFile(f.file.name) && !f.file.name.startsWith('.'));

  const rawBases = new Set<string>();
  for (const f of supported) {
    if (isRawFile(f.file.name)) rawBases.add(dirOf(f.relPath) + baseName(f.file.name).toLowerCase());
  }

  const jpegSiblings = new Map<string, File>();
  const items: PhotoItem[] = [];
  for (const f of supported) {
    const key = dirOf(f.relPath) + baseName(f.file.name).toLowerCase();
    const ext = extensionOf(f.file.name);
    if ((ext === 'jpg' || ext === 'jpeg') && rawBases.has(key)) {
      jpegSiblings.set(key, f.file);
      continue;
    }
    items.push({
      id: `${f.relPath}|${f.file.size}|${f.file.lastModified}`,
      file: f.file,
      name: f.file.name,
      relPath: f.relPath,
      isRaw: isRawFile(f.file.name),
      status: 'pending',
      rating: 0,
      flag: null,
    });
  }
  for (const item of items) {
    const key = dirOf(item.relPath) + baseName(item.name).toLowerCase();
    const sibling = jpegSiblings.get(key);
    if (item.isRaw && sibling) item.jpegSibling = sibling;
  }

  // Capture order: file name within folder, folders grouped.
  items.sort((a, b) => a.relPath.localeCompare(b.relPath, undefined, { numeric: true }));
  return items;
}

function dirOf(relPath: string): string {
  const i = relPath.lastIndexOf('/');
  return i === -1 ? '' : relPath.slice(0, i + 1) + '|';
}

/** Recursively lists a directory handle (File System Access API). */
export async function listDirectory(
  dir: FileSystemDirectoryHandle,
  prefix = '',
  depth = 0,
): Promise<{ file: File; relPath: string }[]> {
  if (depth > 6) return [];
  const out: { file: File; relPath: string }[] = [];
  for await (const [name, handle] of dir as unknown as AsyncIterable<
    [string, FileSystemHandle]
  >) {
    if (name.startsWith('.')) continue;
    if (handle.kind === 'file') {
      if (!isSupportedFile(name)) continue;
      const file = await (handle as FileSystemFileHandle).getFile();
      out.push({ file, relPath: prefix + name });
    } else if (handle.kind === 'directory') {
      out.push(...(await listDirectory(handle as FileSystemDirectoryHandle, `${prefix}${name}/`, depth + 1)));
    }
  }
  return out;
}

/** Lists dropped DataTransfer items (works in every engine). */
export async function listDropped(items: DataTransferItemList): Promise<{ file: File; relPath: string }[]> {
  const out: { file: File; relPath: string }[] = [];

  async function walkEntry(entry: FileSystemEntry, prefix: string): Promise<void> {
    if (entry.isFile) {
      if (!isSupportedFile(entry.name)) return;
      const file = await new Promise<File>((resolve, reject) =>
        (entry as FileSystemFileEntry).file(resolve, reject),
      );
      out.push({ file, relPath: prefix + entry.name });
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((resolve, reject) =>
          reader.readEntries(resolve, reject),
        );
        for (const child of batch) {
          if (!child.name.startsWith('.')) await walkEntry(child, `${prefix}${entry.name}/`);
        }
      } while (batch.length > 0);
    }
  }

  const entries: (FileSystemEntry | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    entries.push(items[i].webkitGetAsEntry?.() ?? null);
  }
  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const f = items[i].getAsFile?.();
    if (f) files.push(f);
  }
  if (entries.some(Boolean)) {
    for (const entry of entries) {
      if (entry) await walkEntry(entry, '');
    }
  } else {
    for (const f of files) {
      if (isSupportedFile(f.name)) out.push({ file: f, relPath: f.name });
    }
  }
  return out;
}
