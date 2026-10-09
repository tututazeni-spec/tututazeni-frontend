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
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ACTION_CFG,
  STATUS_CFG as PLAN_STATUS_CFG,
} from '@/components/development-plans/constants';
import type {
  ActionType,
  PlanStatus,
} from '@/components/development-plans/types';
import type { PDIAnalytics } from './types';
import type { LucideIcon } from 'lucide-react';
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
  'PAUSED',
  'AT_RISK',
  'OVERDUE',
  'COMPLETED',
  'PARTIALLY_COMPLETED',
  'CANCELLED',
];

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
      </div>
    </div>
  );
}

export function PDIAnalyticsView() {
  const { data, isLoading } = useApiQuery<PDIAnalytics>(
    queryKeys.analyticsPage.pdi(),
    '/analytics/pdi',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const totalPlans = Object.values(data.byStatus).reduce((a, b) => a + b, 0);
  const pct = (n: number) =>
    totalPlans > 0 ? Math.round((n / totalPlans) * 100) : 0;
  const statuses = [
    ...STATUS_ORDER,
    ...Object.keys(data.byStatus).filter(
      (k) => !STATUS_ORDER.includes(k as PlanStatus),
    ),
  ] as PlanStatus[];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <TopBarKpiCard
          icon={TrendingUp}
          label="Progresso médio (PDIs activos)"
          value={`${data.avgProgress}%`}
          tone="blue"
        />
        <TopBarKpiCard
          icon={AlertTriangle}
          label="Acções atrasadas"
          value={data.overdueActions}
          tone="red"
        />
        <TopBarKpiCard
          icon={CheckCircle2}
          label="Concluídos este mês"
          value={data.completedThisMonth}
          tone="green"
        />
        <TopBarKpiCard
          icon={Percent}
          label="Taxa de conclusão (excl. rascunhos e cancelados)"
          value={`${data.completionRate}%`}
          tone="green"
        />
        <TopBarKpiCard
          icon={Clock}
          label="PDIs activos com prazo ultrapassado"
          value={data.overduePlans}
          tone="red"
        />
        <TopBarKpiCard
          icon={FileClock}
          label="Rascunhos parados há mais de 30 dias"
          value={data.staleDrafts}
          tone="gold"
        />
      </div>

      {/* Estado dos PDIs */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="h-1.5 w-full bg-[#2B6CC4]" />
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
                  className={`flex items-center gap-2 rounded-full border border-border bg-surface-sunken px-3 py-1.5 ${count === 0 ? 'opacity-50' : ''}`}
                >
                  <StatusBadge
                    value={status as PlanStatus}
                    map={PLAN_STATUS_CFG}
                    variant="dot"
                  />
                  <span className="font-data text-sm font-bold text-ink">
                    {count}
                  </span>
                  <span className="font-body text-xs text-ink-muted">
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
            {data.actionsByType.map((a) => (
              <div
                key={a.type}
                className="flex items-center gap-2 rounded-card bg-surface-sunken px-3 py-2"
              >
                <StatusBadge
                  value={a.type as ActionType}
                  map={ACTION_CFG}
                  variant="plain"
                />
                <span className="font-data text-sm font-bold text-black">
                  {a.count}
                </span>
              </div>
            ))}
            {data.actionsByType.length === 0 && (
              <div className="text-sm text-ink-faint py-2">
                Sem acções registadas
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
