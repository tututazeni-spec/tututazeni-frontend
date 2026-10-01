// components/executive-reports/kpiFormat.ts
// Formatação e semáforo dos KPIs executivos. "Sem dados" nunca é convertido
// em zero (docs/Executive_Reports.md §12.3).

import type { TopBarTone } from '@/components/ui/TopBarCard';
import type { ExecutiveKpi, KpiState } from './dashboardTypes';

export function formatKpiValue(
  value: number | null,
  unit: ExecutiveKpi['unit'],
): string {
  if (value === null) return 'Sem dados';
  const n = value.toLocaleString('pt-PT', { maximumFractionDigits: 1 });
  return unit === '%' ? `${n}%` : n;
}

export const STATE_LABEL: Record<KpiState, string> = {
  ON_TARGET: 'Dentro da meta',
  WARNING: 'Em alerta',
  CRITICAL: 'Crítico',
  NO_TARGET: 'Sem meta',
  NO_DATA: 'Sem dados',
};

export const STATE_TONE: Record<KpiState, TopBarTone> = {
  ON_TARGET: 'green',
  WARNING: 'gold',
  CRITICAL: 'red',
  NO_TARGET: 'blue',
  NO_DATA: 'blue',
};

export const STATE_BADGE: Record<KpiState, string> = {
  ON_TARGET: 'bg-success-subtle text-success-ink',
  WARNING: 'bg-warning-subtle text-warning-ink',
  CRITICAL: 'bg-danger-subtle text-danger-ink',
  NO_TARGET: 'bg-info-subtle text-info-ink',
  NO_DATA: 'bg-surface-sunken text-ink-muted',
};

/** A variação é "boa" conforme a direcção do KPI (ex.: rotatividade a descer). */
export function changeIsGood(k: ExecutiveKpi): boolean | null {
  if (k.change === null || k.change === 0 || k.direction === 'NEUTRAL')
    return null;
  return k.direction === 'HIGHER_IS_BETTER' ? k.change > 0 : k.change < 0;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}
