// components/analytics/PDIAnalyticsView.tsx
// Separador "PDI" — GET /analytics/pdi (organização inteira). Complementa
// components/analytics/ManagerView.tsx, que só mostra PDI à escala da
// equipa do gestor autenticado. Endpoint já existia sem consumidor.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  ACTION_CFG,
  STATUS_CFG as PLAN_STATUS_CFG,
} from '@/components/development-plans/constants';
import type {
  ActionType,
  PlanStatus,
} from '@/components/development-plans/types';
import type { PDIAnalytics } from './types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileClock,
  Percent,
  TrendingUp,
} from 'lucide-react';

// Ordem do ciclo de vida; estados com 0 também aparecem.
const STATUS_ORDER: PlanStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED',
];

export function PDIAnalyticsView() {
  const { data, isLoading } = useApiQuery<PDIAnalytics>(
    queryKeys.analyticsPage.pdi(),
    '/analytics/pdi',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  // Todos os tipos que o formulário de PDI oferece (ACTION_CFG), incluindo 0.
  const countByType = new Map(data.actionsByType.map((a) => [a.type, a.count]));
  const actionsByType = (Object.keys(ACTION_CFG) as ActionType[]).map(
    (type) => ({ type, count: countByType.get(type) ?? 0 }),
  );

  const statuses = STATUS_ORDER;
  const totalPlans = statuses.reduce(
    (sum, status) => sum + (data.byStatus[status] ?? 0),
    0,
  );
  const pct = (n: number) =>
    totalPlans > 0 ? Math.round((n / totalPlans) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={TrendingUp}
          label="Progresso médio (PDIs activos)"
          value={`${data.avgProgress}%`}
          tone="blue"
        />
        <NavyStatCard
          icon={AlertTriangle}
          label="Acções atrasadas"
          value={data.overdueActions}
          tone="red"
        />
        <NavyStatCard
          icon={CheckCircle2}
          label="Concluídos este mês"
          value={data.completedThisMonth}
          tone="green"
        />
        <NavyStatCard
          icon={Percent}
          label="Taxa de conclusão (excl. rascunhos e cancelados)"
          value={`${data.completionRate}%`}
          tone="green"
        />
        <NavyStatCard
          icon={Clock}
          label="PDIs activos com prazo ultrapassado"
          value={data.overduePlans}
          tone="red"
        />
        <NavyStatCard
          icon={FileClock}
          label="Rascunhos parados há mais de 30 dias"
          value={data.staleDrafts}
          tone="orange"
        />
      </div>

      {/* Estado dos PDIs */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="h-1.5 w-full bg-[#0F1F3D]" />
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
            PDIs por estado · {totalPlans} no total
          </div>
          {totalPlans > 0 && (
            <div className="mb-4 flex h-2 w-full overflow-hidden rounded-full bg-surface-sunken">
              {statuses.map((status) => {
                const count = data.byStatus[status] ?? 0;
                if (count === 0) return null;
                return (
                  <div
                    key={status}
                    title={`${PLAN_STATUS_CFG[status]?.label ?? status}: ${count}`}
                    className={`h-full ${PLAN_STATUS_CFG[status]?.cls ?? ''}`}
                    style={{ width: `${(count / totalPlans) * 100}%` }}
                  />
                );
              })}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {statuses.map((status) => {
              const count = data.byStatus[status] ?? 0;
              return (
                <div
                  key={status}
                  className="flex items-center gap-2 rounded-full bg-[#0F1F3D] px-3 py-1.5 opacity-70"
                >
                  <span className="text-xs font-medium text-white">
                    {PLAN_STATUS_CFG[status]?.label ?? status}
                  </span>
                  <span className="font-data text-sm font-bold text-white">
                    {count}
                  </span>
                  <span className="font-body text-xs text-white">
                    {pct(count)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Acções por tipo */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Acções por tipo
          </div>
          <div className="flex flex-wrap gap-2">
            {actionsByType.map((a) => (
              <div
                key={a.type}
                className="flex items-center gap-2 rounded-card bg-[#0F1F3D] px-3 py-2 opacity-70"
              >
                <span className="text-xs font-medium text-white">
                  {ACTION_CFG[a.type].label}
                </span>
                <span className="font-data text-sm font-bold text-white">
                  {a.count}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
