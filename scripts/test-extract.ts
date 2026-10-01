/**
 * Runs the preview extractor against the CC0 sample RAWs in test/samples
 * (raw.pixls.us archive, one per format) and prints what came out.
 * Usage: npx tsx scripts/test-extract.ts [outDir]
 */
import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractPreview } from '../lib/raw/extract';
import type { ByteSource } from '../lib/raw/types';

const samplesDir = join(import.meta.dirname, '..', 'test', 'samples');
const outDir = process.argv[2];
if (outDir) mkdirSync(outDir, { recursive: true });

function bufferSource(buf: Buffer): ByteSource {
  return {
    size: buf.byteLength,
    async read(offset, length) {
      return new Uint8Array(buf.subarray(offset, offset + length));
    },
  };
}

/** Reads JPEG SOF dimensions so we know the preview is real and sized right. */
function jpegDimensions(buf: Uint8Array): { w: number; h: number } | null {
  let o = 2;
  while (o + 9 < buf.byteLength) {
    if (buf[o] !== 0xff) return null;
    const marker = buf[o + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: (buf[o + 5] << 8) | buf[o + 6], w: (buf[o + 7] << 8) | buf[o + 8] };
    }
    const len = (buf[o + 2] << 8) | buf[o + 3];
    o += 2 + len;
  }
  return null;
}

let failures = 0;
const files = readdirSync(samplesDir).filter((f) => !f.endsWith('.json') && !f.startsWith('.'));
for (const name of files.sort()) {
  const path = join(samplesDir, name);
  if (!statSync(path).isFile()) continue;
  const buf = readFileSync(path);
  const started = performance.now();
  const result = await extractPreview(bufferSource(buf));
  const ms = (performance.now() - started).toFixed(0);
  if (!result.jpeg && result.via !== 'native') {
    failures++;
    console.log(`FAIL ${name}: no preview found`);
    continue;
  }
  const jpeg = result.jpeg ?? new Uint8Array(buf);
  const dims = jpegDimensions(jpeg);
  const e = result.exif;
  console.log(
    `OK   ${name}: via=${result.via} ${dims ? `${dims.w}x${dims.h}` : '??'} ` +
      `${(jpeg.byteLength / 1024).toFixed(0)}kB in ${ms}ms | ` +
      `${e.make ?? '?'} ${e.model ?? '?'} ISO${e.iso ?? '?'} f/${e.fNumber ?? '?'} ` +
      `${e.exposureTime ? `1/${Math.round(1 / e.exposureTime)}` : '?'}s ${e.focalLength ?? '?'}mm ` +
      `orient=${e.orientation ?? '?'} ${e.dateTimeOriginal ?? ''}`,
  );
  if (!dims || dims.w < 1000) {
    failures++;
    console.log(`     WARN: preview smaller than expected for culling use`);
  }
  if (outDir) writeFileSync(join(outDir, `${name}.jpg`), jpeg);
}

if (failures > 0) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll samples extracted.');
