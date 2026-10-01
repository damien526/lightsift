/** Random-access byte source: a browser File in the app, a Buffer in Node tests. */
export interface ByteSource {
  readonly size: number;
  read(offset: number, length: number): Promise<Uint8Array>;
}

/** A JPEG stream found inside a RAW container, addressed in absolute file offsets. */
export interface PreviewCandidate {
  offset: number;
  length: number;
  /** Where the candidate came from, for debugging and tests. */
  via: string;
}

export interface ExifSummary {
  make?: string;
  model?: string;
  lens?: string;
  iso?: number;
  exposureTime?: number;
  fNumber?: number;
  focalLength?: number;
  dateTimeOriginal?: string;
  orientation?: number;
  rawWidth?: number;
  rawHeight?: number;
}

export interface ParseResult {
  candidates: PreviewCandidate[];
  exif: ExifSummary;
}

export const RAW_EXTENSIONS = [
  'cr2',
  'cr3',
  'nef',
  'nrw',
  'arw',
  'raf',
  'dng',
  'orf',
  'rw2',
  'pef',
  'srw',
] as const;

export const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif'] as const;

export function extensionOf(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

export function isSupportedFile(name: string): boolean {
  const ext = extensionOf(name);
  return (
    (RAW_EXTENSIONS as readonly string[]).includes(ext) ||
    (IMAGE_EXTENSIONS as readonly string[]).includes(ext)
  );
}
