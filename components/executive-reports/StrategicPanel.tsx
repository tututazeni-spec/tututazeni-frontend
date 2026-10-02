// components/executive-reports/StrategicPanel.tsx
// Separador "Indicadores Estratégicos" (docs/Executive_Reports.md §2, §3.1):
// KPIs com meta, resultado, desvio, limiares, fórmula e origem — a definição
// única de cada indicador fica visível ao utilizador.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { ProgressBars } from './charts/ProgressBars';
import { SourcesMatrix } from './SourcesMatrix';
import type {
  ExecutiveFilters,
  ExecutiveKpisResponse,
  GoalChartsResponse,
} from './dashboardTypes';
import { filtersToParams } from './filtersToParams';
import {
  STATE_BADGE,
  STATE_LABEL,
  changeIsGood,
  formatDateTime,
  formatKpiValue,
} from './kpiFormat';

export interface StrategicPanelProps {
  filters: ExecutiveFilters;
}

export function StrategicPanel({ filters }: StrategicPanelProps) {
  const params = filtersToParams(filters);
  const q = useApiQuery<ExecutiveKpisResponse>(
    queryKeys.executiveReports.kpis(params),
    '/executive-reports/kpis',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const goalsQ = useApiQuery<GoalChartsResponse>(
    queryKeys.executiveReports.chartsGoals(params),
    '/executive-reports/charts/goals',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-20 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const goals = goalsQ.data;

  return (
    <div className="space-y-5">
      {goals && goals.vsTarget.length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Realizado vs. meta
          </h3>
          <ProgressBars
            rows={goals.vsTarget.map((g) => ({
              label: g.label,
              actual: g.actual,
              target: g.target,
              direction: g.direction === 'NEUTRAL' ? undefined : g.direction,
            }))}
          />
        </div>
      )}

      {goals && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Execução de planos
          </h3>
          <ProgressBars
            rows={goals.execution.map((e) => ({
              label: e.label,
              actual: e.pct,
              detail: `${e.done} de ${e.total}`,
            }))}
          />
        </div>
      )}

      <div className="space-y-3">
        {q.data.kpis.map((k) => {
          const good = changeIsGood(k);
          return (
            <div
              key={k.code}
              className="rounded-card border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="font-display text-base font-semibold text-ink">
                    {k.name}
                  </h4>
                  <p className="mt-0.5 font-body text-xs text-ink-muted">
                    {k.description}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 font-body text-xs font-medium ${STATE_BADGE[k.state]}`}
                >
                  {STATE_LABEL[k.state]}
                </span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
                <Stat label="Resultado" value={formatKpiValue(k.value, k.unit)} />
                <Stat
                  label="Comparação"
                  value={formatKpiValue(k.previousValue, k.unit)}
                />
                <Stat
                  label="Variação"
                  value={
                    k.change === null
                      ? 'Sem dados'
                      : `${k.change > 0 ? '+' : ''}${k.change.toLocaleString('pt-PT')}`
                  }
                  tone={good === null ? undefined : good ? 'good' : 'bad'}
                />
                <Stat label="Meta" value={formatKpiValue(k.target, k.unit)} />
                <Stat
                  label="Desvio"
                  value={
                    k.deviation === null
                      ? '—'
                      : `${k.deviation > 0 ? '+' : ''}${k.deviation.toLocaleString('pt-PT')}`
                  }
                />
              </dl>

              <div className="mt-4 grid gap-1 border-t border-border pt-3 font-body text-xs text-ink-muted">
                <p>
                  <span className="font-medium text-ink">Fórmula: </span>
                  {k.formula}
                </p>
                {k.target !== null && (
                  <p>
                    <span className="font-medium text-ink">Limiares: </span>
                    alerta{' '}
                    {k.direction === 'HIGHER_IS_BETTER' ? '<' : '>'}{' '}
                    {formatKpiValue(k.warningThreshold, k.unit)} · crítico{' '}
                    {k.direction === 'HIGHER_IS_BETTER' ? '<' : '>'}{' '}
                    {formatKpiValue(k.criticalThreshold, k.unit)}
                  </p>
                )}
                <p>
                  <span className="font-medium text-ink">Origem: </span>
                  {k.sourceModules.join(', ')} · actualizado{' '}
                  {formatDateTime(k.lastUpdatedAt)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <SourcesMatrix filters={filters} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: 'good' | 'bad';
}) {
  const color =
    tone === 'good'
      ? 'text-success-ink'
      : tone === 'bad'
        ? 'text-danger-ink'
        : 'text-ink';
  return (
    <div>
      <dt className="font-body text-xs text-ink-muted">{label}</dt>
      <dd className={`mt-0.5 font-display text-lg font-bold ${color}`}>
        {value}
      </dd>
    </div>
  );
}
