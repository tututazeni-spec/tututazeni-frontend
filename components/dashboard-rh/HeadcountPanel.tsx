// components/dashboard-rh/HeadcountPanel.tsx
// Painel "Headcount" — KPIs, tempo de casa, evolução mensal e aniversários.
// Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

'use client';

import { CheckCircle, Clock, UserMinus, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KPICard, ProgressBar, Skeleton } from './atoms';
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

  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={Users} label="Total" value={data?.total ?? 0} />
        <KPICard
          icon={CheckCircle}
          label="Activos"
          value={data?.active ?? 0}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={UserMinus}
          label="Turnover"
          value={`${data?.turnoverRate ?? 0}%`}
          color="text-red-500"
          bg="bg-red-50"
        />
        <KPICard
          icon={Clock}
          label="Tenure Médio"
          value={`${data?.avgTenureMonths ?? 0}m`}
          sub={`≈ ${((data?.avgTenureMonths ?? 0) / 12).toFixed(1)} anos`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tenure buckets */}
        {data?.byTenure && (
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h4 className="font-semibold text-slate-700 mb-4">
              Distribuição por Tempo de Casa
            </h4>
            {Object.entries(data.byTenure as Record<string, number>).map(
              ([k, v]) => {
                const max = Math.max(
                  ...Object.values(data.byTenure as Record<string, number>),
                );
                return (
                  <div key={k} className="mb-2">
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-600">{k}</span>
                      <span className="font-semibold text-slate-700">{v}</span>
                    </div>
                    <ProgressBar value={max > 0 ? (v / max) * 100 : 0} />
                  </div>
                );
              },
            )}
          </div>
        )}

        {/* Monthly trend */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">Evolução Mensal</h4>
          <div className="space-y-2">
            {trend.map((t, i) => {
              const max = Math.max(...trend.map((x) => x.count));
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{t.month}</span>
                    <span className="font-semibold text-slate-700">
                      {t.count}
                    </span>
                  </div>
                  <ProgressBar
                    value={(t.count / max) * 100}
                    color="bg-indigo-400"
                  />
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
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
        🎉 Aniversários de Empresa este Mês
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {data.slice(0, 6).map((u, i) => (
          <div
            key={i}
            className="flex items-center gap-2 bg-white rounded-lg px-3 py-2"
          >
            <Avatar name={u.fullName} url={u.avatarUrl} size={7} />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-700 truncate">
                {u.fullName}
              </p>
              <p className="text-[10px] text-amber-600 font-semibold">
                {u.years} {u.years === 1 ? 'ano' : 'anos'} 🏆
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
