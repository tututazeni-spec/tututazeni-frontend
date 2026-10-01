// components/executive-reports/charts/ProgressBars.tsx
// Realizado vs. meta com identificação do desvio (docs/Executive_Reports.md
// §6.4): barra de progresso com marca da meta.

import { cn } from '@/lib/cn';

export interface ProgressRow {
  label: string;
  /** Valor realizado, na mesma unidade da meta (ex.: %). */
  actual: number | null;
  target?: number | null;
  /** Texto auxiliar (ex.: "12 de 40"). */
  detail?: string;
  /** Define se "acima da meta" é bom ou mau. */
  direction?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  suffix?: string;
}

export function ProgressBars({ rows }: { rows: ProgressRow[] }) {
  return (
    <ul className="space-y-4">
      {rows.map((r) => {
        const scale = Math.max(100, r.actual ?? 0, r.target ?? 0);
        const hasTarget = r.target !== null && r.target !== undefined;
        const deviation =
          r.actual !== null && hasTarget
            ? Math.round((r.actual - (r.target as number)) * 10) / 10
            : null;
        const good =
          deviation === null || !r.direction
            ? null
            : r.direction === 'HIGHER_IS_BETTER'
              ? deviation >= 0
              : deviation <= 0;
        const suffix = r.suffix ?? '%';

        return (
          <li key={r.label}>
            <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-body text-sm text-ink">{r.label}</span>
              <span className="font-body text-xs text-ink-muted">
                {r.actual === null ? 'Sem dados' : `${r.actual}${suffix}`}
                {hasTarget && ` · meta ${r.target}${suffix}`}
                {deviation !== null && (
                  <span
                    className={cn(
                      'ml-2 font-medium',
                      good === null
                        ? 'text-ink-muted'
                        : good
                          ? 'text-success-ink'
                          : 'text-danger-ink',
                    )}
                  >
                    {deviation > 0 ? '+' : ''}
                    {deviation}
                    {suffix} desvio
                  </span>
                )}
                {r.detail && ` · ${r.detail}`}
              </span>
            </div>
            <div className="relative h-3 rounded-full bg-surface-sunken">
              {r.actual !== null && (
                <div
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    good === null
                      ? 'bg-info'
                      : good
                        ? 'bg-success'
                        : 'bg-danger',
                  )}
                  style={{ width: `${(r.actual / scale) * 100}%` }}
                />
              )}
              {hasTarget && (
                <span
                  aria-hidden
                  className="absolute -inset-y-1 w-0.5 bg-ink"
                  style={{ left: `${((r.target as number) / scale) * 100}%` }}
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
