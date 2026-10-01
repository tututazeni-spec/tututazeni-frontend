// components/executive-reports/charts/ExceptionList.tsx
// Lista de excepções (docs/Executive_Reports.md §6.5): itens vencidos, do mais
// antigo para o mais recente.

import type { RiskException } from '../dashboardTypes';

export interface ExceptionListProps {
  title: string;
  items: RiskException[];
  emptyText: string;
  /** Texto do atraso, ex.: "de atraso" / "pendente". */
  suffix?: string;
}

export function ExceptionList({
  title,
  items,
  emptyText,
  suffix = 'de atraso',
}: ExceptionListProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <h3 className="mb-3 font-body font-semibold text-ink-muted">{title}</h3>
      {items.length === 0 ? (
        <p className="font-body text-sm text-ink-faint">{emptyText}</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((i) => (
            <li
              key={i.id}
              className="flex items-start justify-between gap-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm text-ink">{i.title}</p>
                <p className="truncate font-body text-xs text-ink-muted">
                  {i.person}
                  {i.department ? ` · ${i.department}` : ''}
                </p>
              </div>
              {i.daysOverdue !== null && (
                <span className="shrink-0 rounded-full bg-danger-subtle px-2.5 py-1 font-body text-xs font-medium text-danger-ink">
                  {i.daysOverdue} d {suffix}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
