// components/courses/cardStyles.tsx
// Estilos partilhados das tabelas em cartões (GestaoView + AdminView).

export const PILL =
  'inline-block max-w-full truncate rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase';

export const PANEL =
  'rounded-xl border border-border/60 bg-surface-sunken/40 p-3';

export function ProgressRing({ value }: { value: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative h-14 w-14 shrink-0">
      <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-border" />
        <circle
          cx="28" cy="28" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          className={pct >= 75 ? 'stroke-orange-400' : 'stroke-blue-500'}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xs text-ink">
        {pct}%
      </span>
    </div>
  );
}