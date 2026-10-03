import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Legal notice',
  description:
    'Legal notice (mentions legales) for OnlineCull: publisher, hosting provider, contact, licensing and warranty information.',
  alternates: { canonical: `${SITE_URL}/legal/` },
  robots: { index: true, follow: true },
};

const CONTACT_EMAIL = 'damienyvert.dev@gmail.com';

export default function LegalPage() {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <nav className="mb-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber" />
            <span className="font-display text-xl">OnlineCull</span>
          </Link>
        </nav>
        <h1 className="font-display text-4xl">Legal notice</h1>
        <p className="mt-2 text-sm text-faint">Mentions legales, as required by the French LCEN.</p>

        <div className="mt-8 space-y-7 leading-relaxed text-dim">
          <section>
            <h2 className="mb-1.5 font-semibold text-paper">Publisher</h2>
            <p>
              This site is published and edited by Damien Yvert (publication director).
              <br />
              Contact:{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline decoration-line underline-offset-2 hover:text-paper"
              >
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-paper">Hosting provider</h2>
            <p>
              Vercel Inc.
              <br />
              440 N Barranca Ave #4133, Covina, CA 91723, United States
              <br />
              <a
                href="https://vercel.com"
                className="underline decoration-line underline-offset-2 hover:text-paper"
              >
                vercel.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-paper">Intellectual property</h2>
            <p>
              The OnlineCull source code is released under the MIT license and available on{' '}
              <a
                href="https://github.com/damien526/onlinecull"
                className="underline decoration-line underline-offset-2 hover:text-paper"
              >
                GitHub
              </a>
              . The sample photographs in the demo shoot are CC0 (public domain) test shots from the
              raw.pixls.us archive. Photos you open with the tool remain yours; OnlineCull claims no
              right over them and never receives them.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-paper">Warranty</h2>
            <p>
              OnlineCull is provided free of charge, as is, without warranty of any kind. It never
              modifies or deletes your original image files, and exports only write new files
              (XMP sidecars, copies of your picks) where you explicitly ask for them. Always keep
              backups of client work regardless of the tools you use.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-semibold text-paper">Reporting a security issue</h2>
            <p>
              Please write to{' '}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline decoration-line underline-offset-2 hover:text-paper"
              >
                {CONTACT_EMAIL}
              </a>{' '}
              (also referenced in{' '}
              <a
                href="/.well-known/security.txt"
                className="underline decoration-line underline-offset-2 hover:text-paper"
              >
                security.txt
              </a>
              ). Reports are welcome and read.
            </p>
          </section>

          <p className="text-sm text-faint">
            See also the <Link href="/privacy/" className="underline decoration-line underline-offset-2 hover:text-paper">privacy page</Link> for what the site does and does not collect.
          </p>
        </div>
      </div>
    </main>
  );
}
