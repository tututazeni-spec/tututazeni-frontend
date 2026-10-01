// components/executive-reports/charts/StackedBars.tsx
// Barras empilhadas horizontais para composição por categoria
// (docs/Executive_Reports.md §6.3). Máximo 4 séries (paleta categórica).

import { CATEGORICAL } from '@/components/ui/charts/palette';

export interface StackedSeries {
  key: string;
  label: string;
  values: number[];
}

export interface StackedBarsProps {
  categories: string[];
  series: StackedSeries[];
}

export function StackedBars({ categories, series }: StackedBarsProps) {
  const totals = categories.map((_, i) =>
    series.reduce((s, x) => s + (x.values[i] ?? 0), 0),
  );
  const max = Math.max(1, ...totals);

  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1">
        {series.map((s, si) => (
          <li
            key={s.key}
            className="flex items-center gap-1.5 font-body text-xs text-ink-muted"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: CATEGORICAL[si % CATEGORICAL.length] }}
            />
            {s.label}
          </li>
        ))}
      </ul>
      <ul className="space-y-1.5">
        {categories.map((c, ci) => (
          <li
            key={c}
            className="grid grid-cols-[9rem_1fr_3rem] items-center gap-3 px-2 py-1"
          >
            <span
              className="truncate font-body text-xs text-ink-muted"
              title={c}
            >
              {c}
            </span>
            <span className="block h-4">
              <span
                className="flex h-full overflow-hidden rounded-full"
                style={{ width: `${(totals[ci] / max) * 100}%`, minWidth: 2 }}
              >
                {series.map((s, si) => {
                  const v = s.values[ci] ?? 0;
                  if (v === 0) return null;
                  return (
                    <span
                      key={s.key}
                      title={`${s.label}: ${v}`}
                      style={{
                        width: `${(v / totals[ci]) * 100}%`,
                        background: CATEGORICAL[si % CATEGORICAL.length],
                      }}
                    />
                  );
                })}
              </span>
            </span>
            <span className="text-right font-display text-sm font-semibold text-ink">
              {totals[ci]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
