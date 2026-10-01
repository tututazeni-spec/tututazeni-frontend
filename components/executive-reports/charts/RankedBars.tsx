// components/executive-reports/charts/RankedBars.tsx
// Barras horizontais com ordenação configurável e marca de meta
// (docs/Executive_Reports.md §6.2). Clicar numa barra abre o detalhe (o
// chamador decide o que "detalhe" significa).

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/cn';
import { Select } from '@/components/ui/Select';

export interface RankedRow {
  id: number | string;
  label: string;
  /** null = sem dados — nunca se desenha como zero (§12.3). */
  value: number | null;
}

export interface RankedBarsProps {
  rows: RankedRow[];
  format?: (v: number) => string;
  /** Meta a comparar (linha vertical). */
  target?: number | null;
  /** Define a cor: dentro/fora da meta. Sem meta → cor neutra. */
  direction?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  onSelect?: (row: RankedRow) => void;
}

type SortKey = 'desc' | 'asc' | 'name';

const SORT_ITEMS: { value: SortKey; label: string }[] = [
  { value: 'desc', label: 'Maior primeiro' },
  { value: 'asc', label: 'Menor primeiro' },
  { value: 'name', label: 'Por nome' },
];

export function RankedBars({
  rows,
  format = String,
  target = null,
  direction,
  onSelect,
}: RankedBarsProps) {
  const [sort, setSort] = useState<SortKey>('desc');

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === 'name')
      return copy.sort((a, b) => a.label.localeCompare(b.label, 'pt'));
    return copy.sort((a, b) => {
      // Sem dados vai sempre para o fim.
      if (a.value === null) return 1;
      if (b.value === null) return -1;
      return sort === 'desc' ? b.value - a.value : a.value - b.value;
    });
  }, [rows, sort]);

  const max = Math.max(1, target ?? 0, ...rows.map((r) => r.value ?? 0));

  const barColor = (v: number) => {
    if (target === null || !direction) return 'bg-info';
    const ok = direction === 'HIGHER_IS_BETTER' ? v >= target : v <= target;
    return ok ? 'bg-success' : 'bg-danger';
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        {target !== null ? (
          <span className="font-body text-xs text-ink-muted">
            Linha vertical = meta ({format(target)})
          </span>
        ) : (
          <span />
        )}
        <Select
          className="min-w-[10rem]"
          items={SORT_ITEMS}
          value={sort}
          onValueChange={(v) => setSort(v as SortKey)}
        />
      </div>
      <ul className="space-y-1.5">
        {sorted.map((r) => {
          const rowClass = cn(
            'grid w-full grid-cols-[9rem_1fr_4.5rem] items-center gap-3 rounded-control px-2 py-1 text-left',
            onSelect &&
              'hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          );
          const content = (
            <>
              <span
                className="truncate font-body text-xs text-ink-muted"
                title={r.label}
              >
                {r.label}
              </span>
              <span className="relative block h-4 rounded-full bg-surface-sunken">
                {r.value !== null && (
                  <span
                    className={cn(
                      'absolute inset-y-0 left-0 rounded-full',
                      barColor(r.value),
                    )}
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                )}
                {target !== null && (
                  <span
                    aria-hidden
                    className="absolute -inset-y-0.5 w-0.5 bg-ink"
                    style={{ left: `${(target / max) * 100}%` }}
                  />
                )}
              </span>
              <span className="text-right font-display text-sm font-semibold text-ink">
                {r.value === null ? 'Sem dados' : format(r.value)}
              </span>
            </>
          );
          return (
            <li key={r.id}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(r)}
                  className={rowClass}
                >
                  {content}
                </button>
              ) : (
                <div className={rowClass}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
