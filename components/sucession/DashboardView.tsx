// components/sucession/DashboardView.tsx
// Vista "Dashboard": KPIs de sucessão e alertas críticos. Extraído de
// app/(platform)/sucession/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RISK_CFG } from './constants';
import type { Dashboard } from './types';

export function DashboardView() {
  const { data, isLoading: loading } = useApiQuery<Dashboard>(
    queryKeys.succession.dashboard(),
    '/succession/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={3} />;
  if (!data) return null;

  const { kpis, criticalAlerts } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {/* Readiness Index */}
        <Card className="p-5">
          <div className="mb-2 font-body text-xs text-ink-faint">
            Índice de Prontidão
          </div>
          <div className="mb-2 flex items-end gap-2">
            <div className="font-display text-4xl font-bold text-info-ink">
              {kpis.readinessIndex}%
            </div>
            <div className="mb-1 font-body text-xs text-ink-faint">
              meta &gt;80%
            </div>
          </div>
          <ProgressBar value={kpis.readinessIndex} />
        </Card>

        {/* Coverage */}
        <Card className="p-5">
          <div className="mb-2 font-body text-xs text-ink-faint">
            Cobertura de Sucessão
          </div>
          <div className="mb-2 flex items-end gap-2">
            <div
              className={`font-display text-4xl font-bold ${kpis.coverageRate >= 80 ? 'text-success-ink' : 'text-warning-ink'}`}
            >
              {kpis.coverageRate}%
            </div>
            <div className="mb-1 font-body text-xs text-ink-faint">
              meta &gt;80%
            </div>
          </div>
          <ProgressBar value={kpis.coverageRate} />
        </Card>

        {/* Match score médio */}
        <Card className="p-5">
          <div className="mb-2 font-body text-xs text-ink-faint">
            Score de Match Médio
          </div>
          <div className="mb-2 font-display text-4xl font-bold text-ink">
            {kpis.avgMatchScore}%
          </div>
          <ProgressBar value={kpis.avgMatchScore} />
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Cargos críticos', value: kpis.totalCriticalPositions },
          {
            label: 'Sem sucessores',
            value: kpis.withoutSuccessor,
            color: kpis.withoutSuccessor > 0 ? 'text-danger-ink' : 'text-ink',
          },
          {
            label: 'Risco alto/crítico',
            value: kpis.highRiskPositions,
            color: kpis.highRiskPositions > 0 ? 'text-warning-ink' : 'text-ink',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-card bg-surface-sunken p-4">
            <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
            <div
              className={`font-display text-2xl font-semibold ${color ?? 'text-ink'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Alertas críticos */}
      {criticalAlerts.length > 0 && (
        <Card>
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-muted">
            Alertas críticos
          </div>
          {criticalAlerts.map((alert) => (
            <div
              key={alert.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3.5 last:border-0"
            >
              <span
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  alert.exitRisk === 'CRITICAL'
                    ? 'bg-danger'
                    : alert.exitRisk === 'HIGH'
                      ? 'bg-warning'
                      : 'bg-warning/60'
                }`}
              />
              <div className="flex-1">
                <div className="font-body text-sm font-medium text-ink">
                  {alert.position}
                </div>
                {alert.alert && (
                  <div className="mt-0.5 font-body text-xs text-ink-muted">
                    {alert.alert}
                  </div>
                )}
              </div>
              <StatusBadge value={alert.exitRisk} map={RISK_CFG} />
              {alert.daysUntilExit !== null && alert.daysUntilExit <= 180 && (
                <div
                  className={`font-mono text-xs ${alert.daysUntilExit <= 30 ? 'font-bold text-danger-ink' : 'text-warning-ink'}`}
                >
                  {alert.daysUntilExit}d
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
