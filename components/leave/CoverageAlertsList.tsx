// components/leave/CoverageAlertsList.tsx
// Lista do aviso "Cobertura insuficiente" do calendário de ausências: uma linha
// por dia e departamento, em colunas (data, departamento, ausentes,
// disponibilidade e mínimo). A barra mostra a disponibilidade do dia e uma
// marca no mínimo exigido, para se ver logo quanto falta. Só apresenta.

import { Users } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { WEEKDAY_SHORT } from './constants';
import type { AbsenceCalendarData } from './types';

type CoverageAlert = AbsenceCalendarData['alerts'][number];

/** Colunas partilhadas pelo cabeçalho e pelas linhas (a partir de `sm`). */
const COLUMNS =
  'sm:grid-cols-[7.5rem_minmax(0,1fr)_6rem_minmax(10rem,14rem)_4rem]';

function weekdayOf(day: string): string {
  const index = (new Date(`${day.slice(0, 10)}T00:00:00Z`).getUTCDay() + 6) % 7;
  return WEEKDAY_SHORT[index];
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function AvailabilityBar({ alert: a }: { alert: CoverageAlert }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative h-2 min-w-0 flex-1 rounded-pill bg-surface-sunken"
        role="img"
        aria-label={`Disponibilidade ${a.availabilityPercent}%, mínimo ${a.minAvailabilityPercent}%`}
      >
        <div
          className="h-full rounded-pill bg-danger"
          style={{ width: `${clamp(a.availabilityPercent)}%` }}
        />
        <span
          aria-hidden
          className="absolute -top-1 h-4 w-0.5 rounded-pill bg-brand"
          style={{ left: `${clamp(a.minAvailabilityPercent)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-sm font-bold text-danger-ink">
        {a.availabilityPercent}%
      </span>
    </div>
  );
}

export interface CoverageAlertsListProps {
  alerts: CoverageAlert[];
  /** Quantas linhas mostrar; o resto fica resumido numa nota. */
  limit?: number;
}

export function CoverageAlertsList({
  alerts,
  limit = 15,
}: CoverageAlertsListProps) {
  const shown = alerts.slice(0, limit);
  return (
    <div>
      <div
        className={`hidden gap-3 border-b border-brand/15 px-2 pb-2 text-micro font-bold uppercase tracking-wide text-brand-muted sm:grid ${COLUMNS}`}
      >
        <span>Data</span>
        <span>Departamento</span>
        <span>Ausentes</span>
        <span>Disponibilidade</span>
        <span className="text-right">Mínimo</span>
      </div>
      <ul className="divide-y divide-brand/10">
        {shown.map((a, i) => (
          <li
            key={`${a.date}-${a.departmentId}-${i}`}
            className={`grid grid-cols-1 items-center gap-x-3 gap-y-1 px-2 py-2.5 text-sm ${COLUMNS}`}
          >
            <span className="font-semibold text-brand">
              {formatDate(a.date)}
              <span className="ml-1.5 text-xs font-medium text-brand-muted">
                {weekdayOf(a.date)}
              </span>
            </span>
            <span className="min-w-0 truncate text-ink">
              {a.department ?? 'Sem departamento'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-ink">
              <Users
                size={14}
                strokeWidth={1.75}
                className="shrink-0 text-brand-muted"
              />
              <strong>{a.absent}</strong> de {a.headcount}
            </span>
            <AvailabilityBar alert={a} />
            <span className="text-ink-muted sm:text-right">
              <span className="sm:hidden">Mínimo </span>
              {a.minAvailabilityPercent}%
            </span>
          </li>
        ))}
      </ul>
      {alerts.length > limit && (
        <p className="mt-2 text-xs text-ink-faint">
          +{alerts.length - limit} dia(s) com alerta.
        </p>
      )}
    </div>
  );
}
