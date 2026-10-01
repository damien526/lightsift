import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Privacy',
  description:
    'Lightsift processes your photos entirely in your browser. Nothing is uploaded. Here is exactly what the site does and does not collect.',
  alternates: { canonical: `${SITE_URL}/privacy/` },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-ink text-paper">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <nav className="mb-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-block h-3 w-3 rounded-full bg-amber" />
            <span className="font-display text-xl">Lightsift</span>
          </Link>
        </nav>
        <h1 className="font-display text-4xl">Privacy</h1>
        <div className="mt-6 space-y-5 leading-relaxed text-dim">
          <p>
            <strong className="text-paper">Your photos never leave your device.</strong> Lightsift
            opens, parses and previews your files entirely inside your browser. There is no upload
            endpoint; the site could not receive your photos even if it wanted to. You can verify
            this in your browser&apos;s network inspector: no image data is ever transmitted.
          </p>
          <p>
            <strong className="text-paper">Ratings stay on your device too.</strong> Stars and flags
            are stored in your browser&apos;s local database (IndexedDB) so a reopened folder
            remembers your work. Clearing site data removes them.
          </p>
          <p>
            <strong className="text-paper">What is collected:</strong> anonymous page analytics
            (Vercel Analytics: page views, country, device type). No cookies for tracking, no ads,
            no fingerprinting, no account system.
          </p>
          <p>
            <strong className="text-paper">File system access:</strong> when you open a folder,
            the browser grants Lightsift read access to it for the session, and asks you separately
            if you choose an export that writes XMP sidecars or copies picks. Lightsift never
            modifies or deletes your original image files.
          </p>
          <p>
            Questions: open an issue on the project&apos;s GitHub repository.
          </p>
        </div>
      </div>
    </main>
  );
}
