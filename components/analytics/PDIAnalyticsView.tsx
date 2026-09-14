// components/analytics/PDIAnalyticsView.tsx
// Separador "PDI" — GET /analytics/pdi (organização inteira). Complementa
// components/analytics/ManagerView.tsx, que só mostra PDI à escala da
// equipa do gestor autenticado. Endpoint já existia sem consumidor.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ACTION_CFG, STATUS_CFG as PLAN_STATUS_CFG } from '@/components/development-plans/constants';
import type { ActionType, PlanStatus } from '@/components/development-plans/types';
import type { PDIAnalytics } from './types';

export function PDIAnalyticsView() {
  const { data, isLoading } = useApiQuery<PDIAnalytics>(
    queryKeys.analyticsPage.pdi(),
    '/analytics/pdi',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Progresso médio (PDIs activos)"
          value={`${data.avgProgress}%`}
          intent="info"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Acções atrasadas"
          value={data.overdueActions}
          intent={data.overdueActions > 0 ? 'danger' : 'primary'}
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Concluídos este mês"
          value={data.completedThisMonth}
          intent="success"
          className="w-full [&_p]:text-black"
        />
      </div>

      {/* Estado dos PDIs */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            PDIs por estado
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-card bg-surface-sunken px-3 py-2"
              >
                <StatusBadge value={status as PlanStatus} map={PLAN_STATUS_CFG} variant="dot" />
                <span className="font-data text-sm font-bold text-black">{count}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Acções por tipo */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Acções por tipo
          </div>
          <div className="flex flex-wrap gap-2">
            {data.actionsByType.map((a) => (
              <div
                key={a.type}
                className="flex items-center gap-2 rounded-card bg-surface-sunken px-3 py-2"
              >
                <StatusBadge value={a.type as ActionType} map={ACTION_CFG} variant="plain" />
                <span className="font-data text-sm font-bold text-black">{a.count}</span>
              </div>
            ))}
            {data.actionsByType.length === 0 && (
              <div className="text-sm text-ink-faint py-2">Sem acções registadas</div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
