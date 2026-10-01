import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 text-center text-paper">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-amber">404</p>
      <h1 className="mt-3 font-display text-4xl">This frame is missing</h1>
      <p className="mt-3 text-dim">The page you were looking for does not exist.</p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-amber px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-amber-bright"
      >
        Back to Lightsift
      </Link>
    </main>
  );
}
