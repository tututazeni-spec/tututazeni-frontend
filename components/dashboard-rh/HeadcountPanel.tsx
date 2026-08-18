// components/dashboard-rh/HeadcountPanel.tsx
// Painel "Headcount" — KPIs, tempo de casa, evolução mensal e aniversários.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { CheckCircle, Clock, UserMinus, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  AnniversaryUser,
  HeadcountData,
  HeadcountTrendPoint,
} from './types';

export function HeadcountPanel() {
  const dataQ = useApiQuery<HeadcountData>(
    queryKeys.dashboardRh.headcount(),
    '/dashboard-rh/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendQ = useApiQuery<HeadcountTrendPoint[]>(
    queryKeys.dashboardRh.headcountTrend(),
    '/dashboard-rh/headcount-trend',
    { params: { months: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const trend = trendQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Total"
          value={data?.total ?? 0}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={CheckCircle}
          label="Activos"
          value={data?.active ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={UserMinus}
          label="Taxa de Rotatividade"
          value={`${data?.turnoverRate ?? 0}%`}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          icon={Clock}
          label="Tempo Médio de Serviço"
          value={`${data?.avgTenureMonths ?? 0}m`}
          sub={`≈ ${((data?.avgTenureMonths ?? 0) / 12).toFixed(1)} anos`}
          intent="primary"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Tenure buckets */}
        {data?.byTenure && (
          <div className="rounded-card border border-border bg-surface p-5">
            <h4 className="mb-4 font-body font-semibold text-ink-muted">
              Distribuição por Tempo de Casa
            </h4>
            {Object.entries(data.byTenure as Record<string, number>).map(
              ([k, v]) => {
                const max = Math.max(
                  ...Object.values(data.byTenure as Record<string, number>),
                );
                return (
                  <div key={k} className="mb-2">
                    <div className="mb-0.5 flex justify-between font-body text-xs">
                      <span className="text-ink-muted">{k}</span>
                      <span className="font-semibold text-ink">{v}</span>
                    </div>
                    <ProgressBar value={max > 0 ? (v / max) * 100 : 0} />
                  </div>
                );
              },
            )}
          </div>
        )}

        {/* Monthly trend */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Evolução Mensal
          </h4>
          <div className="space-y-2">
            {trend.map((t, i) => {
              const max = Math.max(...trend.map((x) => x.count));
              return (
                <div key={i}>
                  <div className="mb-0.5 flex justify-between font-body text-xs">
                    <span className="text-ink-muted">{t.month}</span>
                    <span className="font-semibold text-ink">{t.count}</span>
                  </div>
                  <ProgressBar value={(t.count / max) * 100} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Anniversaries */}
      <AnniversariesWidget />
    </div>
  );
}

function AnniversariesWidget() {
  const { data = [] } = useApiQuery<AnniversaryUser[]>(
    queryKeys.dashboardRh.anniversaries(),
    '/dashboard-rh/anniversaries',
    { staleTime: STALE_TIME.SEMI_STATIC, retry: false },
  );
  if (!data.length) return null;
  return (
    <div className="rounded-card border border-warning-subtle bg-warning-subtle p-4">
      <h4 className="mb-3 flex items-center gap-2 font-body font-semibold text-warning-ink">
        🎉 Aniversários de Empresa este Mês
      </h4>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {data.slice(0, 6).map((u, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-control bg-surface px-3 py-2"
          >
            <Avatar name={u.fullName} url={u.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate font-body text-xs font-medium text-ink">
                {u.fullName}
              </p>
              <p className="font-body text-[10px] font-semibold text-warning-ink">
                {u.years} {u.years === 1 ? 'ano' : 'anos'} 🏆
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
