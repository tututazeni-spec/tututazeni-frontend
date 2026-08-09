// components/evaluation/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, distribuição de performance, top
// performers e score por departamento. Dados próprios (useApiQuery) +
// apresentação. Extraído de app/(platform)/evaluation/page.tsx.

'use client';

import { Activity, BarChart2, CheckCircle, Star, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KpiCard, ProgressBar, Skeleton } from './atoms';
import { SCORE_COLOR } from './constants';
import type { AnalyticsData } from './types';

export function AnalyticsTab() {
  const { data, isLoading: loading } = useApiQuery<AnalyticsData>(
    queryKeys.evaluation.analytics(),
    '/evaluations/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton />;
  if (!data?.hasData)
    return (
      <div className="py-16 text-center text-slate-400">
        <BarChart2 size={40} className="mx-auto mb-3 opacity-30" />
        <p>{data?.message ?? 'Sem dados disponíveis'}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Participantes"
          value={data.kpis.totalParticipants}
        />
        <KpiCard
          icon={Star}
          label="Score Médio"
          value={data.kpis.avgScore?.toFixed(1) ?? '–'}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KpiCard
          icon={CheckCircle}
          label="Taxa Participação"
          value={`${data.kpis.participationRate}%`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KpiCard
          icon={Activity}
          label="Total Avaliações"
          value={data.kpis.totalEvaluations}
        />
      </div>

      {/* Distribution */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="font-semibold text-slate-700 mb-4">
          Distribuição de Performance
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            {
              key: 'exceptional',
              label: 'Excepcional',
              color: 'bg-emerald-500',
              textColor: 'text-emerald-700',
            },
            {
              key: 'above',
              label: 'Acima',
              color: 'bg-teal-500',
              textColor: 'text-teal-700',
            },
            {
              key: 'expected',
              label: 'Esperado',
              color: 'bg-amber-500',
              textColor: 'text-amber-700',
            },
            {
              key: 'below',
              label: 'Abaixo',
              color: 'bg-red-400',
              textColor: 'text-red-700',
            },
          ].map((d) => {
            const total = Object.values(data.distribution).reduce(
              (a, b) => a + b,
              0,
            );
            const pct =
              total > 0
                ? Math.round((data.distribution[d.key] / total) * 100)
                : 0;
            return (
              <div
                key={d.key}
                className="text-center p-3 rounded-xl border bg-white"
              >
                <div
                  className={`w-12 h-12 rounded-full ${d.color} mx-auto mb-2
                  flex items-center justify-center`}
                >
                  <span className="text-white font-bold text-sm">{pct}%</span>
                </div>
                <p className="text-xl font-bold text-slate-800">
                  {data.distribution[d.key]}
                </p>
                <p className={`text-[10px] font-medium ${d.textColor}`}>
                  {d.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top performers */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            🏆 Top Performers
          </h3>
          <div className="space-y-2">
            {(data.topPerformers ?? []).slice(0, 8).map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-5 text-right">
                  #{i + 1}
                </span>
                <Avatar
                  name={p.user?.fullName ?? '?'}
                  url={p.user?.avatarUrl}
                  size={7}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {p.user?.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {p.user?.department?.name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${SCORE_COLOR(p.avgScore)}`}>
                    {p.avgScore.toFixed(1)}
                  </p>
                  <p className="text-[10px] text-slate-400">P{p.percentile}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By department */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">
            Score por Departamento
          </h3>
          <div className="space-y-2">
            {(data.byDepartment ?? []).map((d, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 truncate">
                    {d.department}
                  </span>
                  <span className={`font-bold ${SCORE_COLOR(d.avgScore)}`}>
                    {d.avgScore.toFixed(1)}
                  </span>
                </div>
                <ProgressBar
                  value={(d.avgScore / 5) * 100}
                  color={
                    d.avgScore >= 4
                      ? 'bg-emerald-500'
                      : d.avgScore >= 3
                        ? 'bg-teal-400'
                        : 'bg-amber-400'
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
