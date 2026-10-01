import type { ExifSummary } from './raw/types';

export function formatShutter(s?: number): string | null {
  if (!s || s <= 0) return null;
  if (s >= 0.4) return `${Number(s.toFixed(1))}s`;
  return `1/${Math.round(1 / s)}`;
}

export function formatAperture(f?: number): string | null {
  if (!f || f <= 0) return null;
  return `f/${Number(f.toFixed(1))}`;
}

export function formatFocal(mm?: number): string | null {
  if (!mm || mm <= 0) return null;
  return `${Number(mm.toFixed(mm < 10 ? 1 : 0))}mm`;
}

export function formatIso(iso?: number): string | null {
  if (!iso || iso <= 0) return null;
  return `ISO ${iso}`;
}

/** "2019:11:29 17:14:04" (EXIF) to "29 Nov 2019 17:14". */
export function formatExifDate(d?: string): string | null {
  if (!d) return null;
  const m = d.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return d;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(m[3])} ${months[Number(m[2]) - 1] ?? m[2]} ${m[1]} ${m[4]}:${m[5]}`;
}

export function exifLine(e?: ExifSummary): string {
  if (!e) return '';
  const parts = [
    e.model,
    formatFocal(e.focalLength),
    formatAperture(e.fNumber),
    formatShutter(e.exposureTime),
    formatIso(e.iso),
  ].filter(Boolean);
  return parts.join(' · ');
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(n / 1024)} kB`;
}
