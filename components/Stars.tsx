'use client';

export function Stars({
  rating,
  onRate,
  size = 'md',
}: {
  rating: number;
  onRate?: (n: number) => void;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'sm' ? 'text-[11px]' : 'text-base';
  return (
    <span className={`inline-flex gap-px ${cls} leading-none`} aria-label={`${rating} stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          tabIndex={-1}
          className={`${n <= rating ? 'text-amber' : 'text-faint/60'} ${
            onRate ? 'cursor-pointer hover:text-amber-bright' : 'cursor-default'
          } transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            onRate?.(n === rating ? 0 : n);
          }}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: 'pick' | 'reject' | null }) {
  if (!flag) return null;
  return flag === 'pick' ? (
    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-pick text-[11px] font-bold text-ink">
      P
    </span>
  ) : (
    <span className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full bg-reject text-[11px] font-bold text-ink">
      ✕
    </span>
  );
}
