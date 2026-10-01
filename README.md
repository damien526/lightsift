# Lightsift

Free photo culling and RAW viewing in the browser. Open a folder of CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2 or PEF files, rate and flag with the keyboard, export XMP sidecars that Lightroom, Bridge and Capture One read. No upload, no install, no account, no photo cap.

**https://lightsift.vercel.app**

## How it works

Every RAW file embeds a full-size JPEG preview rendered by the camera. Lightsift parses the RAW container locally (TIFF/EP walking for CR2, NEF, ARW, DNG, ORF, RW2 and PEF; ISO-BMFF box walking for CR3; header offsets for RAF; a marker-aware scan as fallback) and extracts that preview on a pool of Web Workers. Nothing is ever uploaded: there is no server-side processing at all.

- Virtualized grid that stays at 60 fps with thousands of photos
- Loupe with 1:1 zoom, EXIF, histogram and blown-highlight warning
- Keyboard-first: arrows, 1-5 stars, P pick, X reject, Z zoom, E export
- RAW+JPEG pairs collapse into one card
- Ratings persist in IndexedDB across reloads
- Exports: XMP sidecars (written in place on Chromium, or as a ZIP), copy picks to a selects folder, filename list, CSV

## Develop

```bash
npm install
npm run dev        # dev server
npm run build      # static export to out/
npm run test:extract   # parser tests against real CC0 RAW samples (downloads needed, see below)
node scripts/e2e.mjs   # headless-Chrome end-to-end suite against out/
```

Parser tests expect sample files in `test/samples/` (gitignored). They are CC0 shots from the [raw.pixls.us](https://raw.pixls.us) archive, mirrored by the [revelraw sample set](https://github.com/tellodaniel/revelraw-sample-raw-files/releases/tag/v1): download a few (CR2, CR3, NEF, ARW, RAF, DNG, ORF, RW2) into that folder.

## Stack

Next.js 15 (static export), React 19, Tailwind 4, zero runtime dependencies for the engine: the RAW parsers, ZIP writer and XMP generator are hand-written in `lib/`.

## License

MIT. Sample demo frames are CC0 from raw.pixls.us.
