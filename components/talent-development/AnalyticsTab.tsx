// components/talent-development/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, Talent Health Score, planos por status e
// top necessidades de formação. Dados próprios (useApiQuery) +
// apresentação. Extraído de app/(platform)/talent-development/page.tsx.

'use client';

import { AlertTriangle, CheckCircle, Target, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard, ProgressBar, Skeleton } from './atoms';
import { STATUS_COLOR } from './constants';
import type { DashboardData, HealthScore } from './types';

export function AnalyticsTab() {
  const dashQuery = useApiQuery<DashboardData>(
    queryKeys.talentDevelopment.analytics(),
    '/talent/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const healthQuery = useApiQuery<HealthScore>(
    queryKeys.talentDevelopment.health(),
    '/talent/analytics/talent-health',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const dash = dashQuery.data ?? null;
  const health = healthQuery.data ?? null;

  if (dashQuery.isLoading || healthQuery.isLoading) return <Skeleton />;

  const GRADE_COLOR: Record<string, string> = {
    A: 'text-emerald-600 border-emerald-500',
    B: 'text-teal-600 border-teal-500',
    C: 'text-amber-600 border-amber-500',
    D: 'text-red-600 border-red-500',
  };

  return (
    <div className="space-y-6">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Colaboradores Activos"
          value={dash?.kpis.totalUsers ?? 0}
        />
        <KpiCard
          icon={Target}
          label="Com PDI Activo"
          value={`${dash?.kpis.pdpCoverage ?? 0}%`}
          sub={`${dash?.kpis.usersWithActivePlan} colaboradores`}
          color="text-indigo-600"
        />
        <KpiCard
          icon={CheckCircle}
          label="Taxa Conclusão Acções"
          value={`${dash?.kpis.actionCompletion ?? 0}%`}
          color="text-emerald-600"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Acções em Atraso"
          value={dash?.kpis.overdueActions ?? 0}
          color="text-red-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talent Health Score */}
        {health && (
          <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center">
            <h3 className="font-semibold text-slate-700 mb-4 self-start">
              Talent Health Score
            </h3>
            <div
              className={`w-28 h-28 rounded-full border-4 ${GRADE_COLOR[health.grade]} flex flex-col
              items-center justify-center mb-4`}
            >
              <span
                className={`text-4xl font-black ${GRADE_COLOR[health.grade].split(' ')[0]}`}
              >
                {health.grade}
              </span>
              <span className="text-xs text-slate-500">
                {health.healthScore}/100
              </span>
            </div>
            <div className="w-full space-y-2">
              {Object.entries(health.metrics).map(([k, v]) => {
                const labels: Record<string, string> = {
                  pdpCoverage: 'Cobertura PDI',
                  skillsAssessment: 'Skills Avaliadas',
                  reviewedRate: 'Avaliados',
                  mentoringRate: 'Mentoring',
                  hiPoRatio: 'HiPo Ratio',
                };
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-500">{labels[k] ?? k}</span>
                      <span className="font-semibold text-slate-700">
                        {v as number}%
                      </span>
                    </div>
                    <ProgressBar
                      value={v as number}
                      color={
                        (v as number) >= 70
                          ? 'bg-emerald-400'
                          : (v as number) >= 40
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Base: {health.total} colaboradores
            </p>
          </div>
        )}

        {/* Plans by status */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">
            Planos por Status
          </h3>
          <div className="space-y-3">
            {dash?.plansByStatus.map((s) => {
              const total = dash.plansByStatus.reduce(
                (sum, x) => sum + x.count,
                0,
              );
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full ${STATUS_COLOR[s.status]}`}
                    >
                      {s.status}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {s.count} ({pct}%)
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Top training needs */}
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-4">
            Top Necessidades de Formação
          </h3>
          <div className="space-y-3">
            {dash?.topTrainingNeeds.map((n, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {n.skill?.name}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {n.count} pessoas
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500 shrink-0">
                  -{n.avgGap}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent completions */}
      {(dash?.recentCompletions.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-700 mb-3">
            Conclusões Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {dash?.recentCompletions.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2"
              >
                <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {c.user.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                    {c.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
