'use client';

import { useCallback, useState } from 'react';

const STRIP = [
  'canon-5d-mark-iv',
  'canon-eos-r',
  'nikon-z6',
  'sony-a7iii',
  'fujifilm-x-t4',
  'ricoh-gr-iii',
  'om-system-om-1',
  'panasonic-g9',
  'iphone-12-pro',
];

const FORMATS: [string, string][] = [
  ['Canon', 'CR2 · CR3'],
  ['Nikon', 'NEF · NRW'],
  ['Sony', 'ARW'],
  ['Fujifilm', 'RAF'],
  ['Adobe · drones', 'DNG'],
  ['OM System', 'ORF'],
  ['Panasonic', 'RW2'],
  ['Pentax', 'PEF'],
  ['Everything else', 'JPEG · PNG · WebP'],
];

const STEPS: [string, string, string][] = [
  [
    '01',
    'Open a folder',
    'Point OnlineCull at a card or a shoot folder. Previews appear in seconds because nothing is uploaded anywhere: your files are read in place, on your machine.',
  ],
  [
    '02',
    'Cull with the keyboard',
    'Arrows to move, 1 to 5 to rate, P to pick, X to reject, Z to check focus at 1:1. The same muscle memory as Photo Mechanic or Lightroom, with zero setup.',
  ],
  [
    '03',
    'Hand off to your editor',
    'Export XMP sidecars that Lightroom, Bridge and Capture One read on import, copy your picks into a selects folder, or just grab the list of keepers.',
  ],
];

const KEYS: [string, string][] = [
  ['←→', 'move'],
  ['1-5', 'rate'],
  ['P', 'pick'],
  ['X', 'reject'],
  ['Z', '1:1 zoom'],
  ['E', 'export'],
];

import { HOME_FAQ } from '@/lib/faq';

export function Landing({
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      onDrop(e.dataTransfer);
    },
    [onDrop],
  );

  return (
    <main
      className="min-h-dvh bg-ink text-paper"
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={handleDrop}
    >
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--color-amber) 0%, transparent 65%)',
          }}
        />
        <div className="mx-auto max-w-5xl px-5 pb-16 pt-10">
          <nav className="mb-14 flex items-center justify-between">
            <span className="flex items-center gap-2.5">
              <span className="inline-block h-3 w-3 rounded-full bg-amber" />
              <span className="font-display text-xl">OnlineCull</span>
            </span>
            <div className="flex items-center gap-5 text-sm text-dim">
              <a href="#how" className="hidden transition-colors hover:text-paper sm:inline">
                How it works
              </a>
              <a href="#formats" className="hidden transition-colors hover:text-paper sm:inline">
                Formats
              </a>
              <a href="#faq" className="transition-colors hover:text-paper">
                FAQ
              </a>
            </div>
          </nav>

          <div className="fade-up">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.25em] text-amber">
              free · no upload · no install · no account
            </p>
            <h1 className="max-w-3xl font-display text-5xl leading-[1.04] sm:text-7xl">
              Cull a whole shoot
              <br />
              <em className="text-amber">before your coffee cools.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-dim">
              OnlineCull opens thousands of RAW files straight from your drive, in your browser.
              Rate with your keyboard, zoom to check focus, and export picks that Lightroom
              understands. Your photos never leave your machine.
            </p>
          </div>

          <div
            className={`fade-up mt-10 rounded-2xl border-2 border-dashed p-7 transition-colors sm:p-10 ${
              dragging ? 'border-amber bg-amber/10' : 'border-line bg-panel/60'
            }`}
            data-testid="dropzone"
          >
            <div className="flex flex-col items-center gap-4 text-center">
              <button
                type="button"
                data-testid="open-folder"
                onClick={onOpenFolder}
                disabled={busy}
                className="rounded-full bg-amber px-8 py-3.5 text-base font-semibold text-ink shadow-[0_0_40px_-8px_var(--color-amber)] transition-all hover:bg-amber-bright hover:shadow-[0_0_56px_-8px_var(--color-amber)] disabled:opacity-50"
              >
                {busy ? 'Reading folder…' : 'Open a folder of photos'}
              </button>
              <p className="text-sm text-faint">
                or drop a folder anywhere on this page
                <span className="px-2 text-line">|</span>
                <button
                  type="button"
                  data-testid="open-demo"
                  onClick={onDemo}
                  disabled={busy}
                  className="text-dim underline decoration-faint underline-offset-4 transition-colors hover:text-amber"
                >
                  try the sample shoot
                </button>
              </p>
              <p className="font-mono text-[11px] text-faint">
                CR2 · CR3 · NEF · ARW · RAF · DNG · ORF · RW2 · PEF · JPEG
              </p>
              {error && <p className="max-w-md text-sm text-reject">{error}</p>}
            </div>
          </div>
        </div>

        {/* Contact sheet strip */}
        <div className="border-y border-line bg-well py-4" aria-hidden>
          <div className="flex w-max gap-3 strip-scroll">
            {[...STRIP, ...STRIP].map((name, i) => (
              <div
                key={i}
                className="relative h-20 w-32 shrink-0 overflow-hidden rounded border border-line"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/demo/strip/${name}.jpg`}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80"
                />
                <span className="absolute bottom-0.5 right-1 font-mono text-[8px] text-paper/60">
                  {String((i % STRIP.length) + 1).padStart(4, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="mx-auto grid max-w-5xl grid-cols-2 gap-px overflow-hidden px-5 py-14 sm:grid-cols-4">
        {(
          [
            ['0 bytes', 'uploaded, ever'],
            ['9', 'RAW formats'],
            ['~2 s', 'to first previews'],
            ['0 €', 'no cap, no trial'],
          ] as const
        ).map(([big, small]) => (
          <div key={big} className="px-4 py-2 text-center">
            <div className="font-display text-4xl text-amber">{big}</div>
            <div className="mt-1 text-sm text-dim">{small}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-line bg-panel/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-3xl sm:text-4xl">Three steps, one coffee</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {STEPS.map(([n, title, body]) => (
              <div key={n}>
                <div className="font-mono text-xs text-amber">{n}</div>
                <h3 className="mb-2 mt-1 text-lg font-semibold">{title}</h3>
                <p className="text-sm leading-relaxed text-dim">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-wrap items-center gap-2.5">
            {KEYS.map(([k, label]) => (
              <span key={k} className="flex items-center gap-2 rounded-lg border border-line bg-card px-3 py-2">
                <kbd className="font-mono text-sm text-amber">{k}</kbd>
                <span className="text-xs text-dim">{label}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Why it is fast */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl">
              The Photo Mechanic trick,
              <br />
              without Photo Mechanic
            </h2>
          </div>
          <div className="space-y-4 text-dim">
            <p className="leading-relaxed">
              Every RAW file already contains a full-size JPEG that your camera rendered the moment
              you pressed the shutter. Culling apps that feel instant never decode the sensor data;
              they show you that embedded preview.
            </p>
            <p className="leading-relaxed">
              OnlineCull does exactly this, in the browser: it parses the RAW container, pulls the
              preview out and paints it, in a few milliseconds per file, on a pool of background
              threads. A 48 GB wedding needs zero upload and zero import, because the photos are
              read from your own disk.
            </p>
            <p className="leading-relaxed">
              Cloud culling tools ask you to upload that 48 GB first. Desktop tools ask for an
              install and often a license. Your browser already has everything it needs.
            </p>
          </div>
        </div>
      </section>

      {/* Formats */}
      <section id="formats" className="border-t border-line bg-panel/40">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="font-display text-3xl sm:text-4xl">Reads what your camera writes</h2>
          <p className="mt-3 max-w-xl text-sm text-dim">
            Tested against real files from the raw.pixls.us archive. RAW+JPEG pairs collapse into a
            single card so you cull photos, not duplicates.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FORMATS.map(([brand, exts]) => (
              <div key={brand} className="rounded-lg border border-line bg-card px-4 py-3">
                <div className="text-sm font-semibold">{brand}</div>
                <div className="font-mono text-xs text-amber">{exts}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="font-display text-3xl sm:text-4xl">Where OnlineCull sits</h2>
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="py-3 pr-4 font-medium"></th>
                <th className="py-3 pr-4 font-medium text-amber">OnlineCull</th>
                <th className="py-3 pr-4 font-medium">Desktop culling apps</th>
                <th className="py-3 font-medium">Cloud culling</th>
              </tr>
            </thead>
            <tbody className="text-dim">
              {(
                [
                  ['Price', 'Free, unlimited', '$100+ or subscription', 'Subscription'],
                  ['Install', 'None, it is a web page', 'Download + updates', 'None'],
                  ['Your files', 'Stay on your machine', 'Stay on your machine', 'Uploaded in full'],
                  ['Works on a locked-down laptop', 'Yes', 'Rarely', 'Yes'],
                  ['Time before first preview', 'Seconds', 'Minutes of import', 'Hours of upload'],
                  ['Lightroom handoff', 'XMP sidecars', 'XMP sidecars', 'Varies'],
                ] as const
              ).map(([row, a, b, c]) => (
                <tr key={row} className="border-b border-line/60">
                  <td className="py-3 pr-4 text-paper">{row}</td>
                  <td className="py-3 pr-4">{a}</td>
                  <td className="py-3 pr-4">{b}</td>
                  <td className="py-3">{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-faint">
          AI culling assistants are great at volume; OnlineCull is for photographers who want their
          own eyes on every frame, fast. Both can coexist in one workflow.
        </p>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-panel/40">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <h2 className="font-display text-3xl sm:text-4xl">Questions photographers ask</h2>
          <dl className="mt-8 space-y-7">
            {HOME_FAQ.map(([q, a]) => (
              <div key={q}>
                <dt className="mb-1.5 font-semibold text-paper">{q}</dt>
                <dd className="text-sm leading-relaxed text-dim">{a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl sm:text-5xl">
          Your card reader is the
          <br />
          <em className="text-amber">only import step left.</em>
        </h2>
        <button
          type="button"
          onClick={onOpenFolder}
          disabled={busy}
          className="mt-8 rounded-full bg-amber px-8 py-3.5 text-base font-semibold text-ink shadow-[0_0_40px_-8px_var(--color-amber)] transition-all hover:bg-amber-bright disabled:opacity-50"
        >
          Open a folder of photos
        </button>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 text-sm text-faint md:flex-row md:justify-between">
          <div className="max-w-xs">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber" />
              <span className="font-display text-base text-paper">OnlineCull</span>
            </span>
            <p className="mt-2 leading-relaxed">
              Free in-browser photo culling and RAW viewer. Files stay on your device.
            </p>
          </div>
          <nav className="grid grid-cols-2 gap-x-10 gap-y-2 md:text-right">
            <a href="/photo-culling-online/" className="transition-colors hover:text-paper">Photo culling online</a>
            <a href="/cr2-viewer/" className="transition-colors hover:text-paper">CR2 viewer</a>
            <a href="/photo-mechanic-alternative/" className="transition-colors hover:text-paper">Photo Mechanic alternative</a>
            <a href="/nef-viewer/" className="transition-colors hover:text-paper">NEF viewer</a>
            <a href="/how-to-cull-photos-faster/" className="transition-colors hover:text-paper">How to cull faster</a>
            <a href="/arw-viewer/" className="transition-colors hover:text-paper">ARW viewer</a>
            <a href="/privacy/" className="transition-colors hover:text-paper">Privacy</a>
            <a href="/cr3-viewer/" className="transition-colors hover:text-paper">CR3 viewer</a>
            <a href="/legal/" className="transition-colors hover:text-paper">Legal notice</a>
            <a href="/raw-viewer-online/" className="transition-colors hover:text-paper">RAW viewer online</a>
          </nav>
        </div>
        <div className="border-t border-line/60">
          <p className="mx-auto max-w-5xl px-5 py-4 text-xs text-faint">
            From the maker of{' '}
            <a href="https://www.music-waveform.com" className="underline decoration-line underline-offset-2 hover:text-paper">Waveform</a>,{' '}
            <a href="https://www.squeezevid.app" className="underline decoration-line underline-offset-2 hover:text-paper">SqueezeVid</a> and{' '}
            <a href="https://www.graphmint.app" className="underline decoration-line underline-offset-2 hover:text-paper">Graphmint</a>.
            Sample frames are CC0 test shots from raw.pixls.us.
          </p>
        </div>
      </footer>
    </main>
  );
}
