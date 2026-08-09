// components/dashboard/OrgDashboard.tsx
// Separador "Organização" — dados próprios (useApiQuery) + apresentação,
// mesmo padrão auto-contido usado em components/payslips/page.tsx (ListView/
// CompareView/AnnualView). Extraído de app/(platform)/dashboard/page.tsx.

'use client';

import { useState } from 'react';
import { Users, BookOpen, Target, TrendingUp, Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, KPICard, Skeleton } from './atoms';
import type { OrgDashboardData } from './types';

export function OrgDashboard() {
  const [period, setPeriod] = useState('MONTH');

  // A key inclui o período → cada período tem cache própria; voltar a um período
  // já visto é instantâneo. params enxutos via apiClient.
  const { data, isLoading } = useApiQuery<OrgDashboardData>(
    queryKeys.dashboard.organization(period),
    '/dashboard/organization',
    { params: { period }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton count={6} />;

  const k = data?.kpis ?? {};

  return (
    <div className="space-y-6">
      {/* Period filter */}
      <div className="flex gap-2">
        {['WEEK', 'MONTH', 'QUARTER', 'YEAR'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {p === 'WEEK'
              ? 'Semana'
              : p === 'MONTH'
                ? 'Mês'
                : p === 'QUARTER'
                  ? 'Trimestre'
                  : 'Ano'}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400 self-center">
          {new Date().toLocaleDateString('pt')}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Users}
          label="Colaboradores Activos"
          value={k.headcount?.active ?? 0}
          sub={`+${k.headcount?.new ?? 0} no período`}
          trend={k.headcount?.newTrend}
        />
        <KPICard
          icon={BookOpen}
          label="Conclusões de Cursos"
          value={k.learning?.completions ?? 0}
          trend={k.learning?.completionsTrend}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={Target}
          label="PDIs Activos"
          value={k.development?.activePlans ?? 0}
          sub={`Cobertura: ${k.development?.coverage ?? 0}%`}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <KPICard
          icon={TrendingUp}
          label="Score Médio Geral"
          value={k.performance?.avgScore?.toFixed(1) ?? '–'}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Talent metrics */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Talentos</h3>
          <div className="space-y-3">
            {[
              {
                label: 'High Potentials',
                value: k.talent?.hiPos ?? 0,
                icon: '🌟',
              },
              {
                label: 'Sucessão coberta',
                value: `${k.talent?.successionCoverage ?? 0}%`,
                icon: '🔄',
              },
              {
                label: 'Horas de treino',
                value: k.learning?.trainingHours ?? 0,
                icon: '⏱️',
              },
              {
                label: 'Surveys activos',
                value: k.engagement?.activeSurveys ?? 0,
                icon: '📊',
              },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  {m.icon} {m.label}
                </span>
                <span className="font-bold text-slate-800">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Departments */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4">Departamentos</h3>
          <div className="space-y-2">
            {(data?.departments ?? []).slice(0, 6).map((d) => {
              const total = (data?.departments ?? []).reduce(
                (a, x) => a + x.headcount,
                0,
              );
              const pct =
                total > 0 ? Math.round((d.headcount / total) * 100) : 0;
              return (
                <div key={d.id}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate">{d.name}</span>
                    <span className="text-slate-700 font-semibold">
                      {d.headcount}
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <Brain size={15} className="text-violet-500" />
            Insights
          </h3>
          {(data?.insights ?? []).length > 0 ? (
            <div className="space-y-2">
              {(data?.insights ?? []).map((ins, i) => (
                <p
                  key={i}
                  className="text-xs text-slate-600 bg-violet-50 rounded-lg px-3 py-2"
                >
                  {ins}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">
              Sem insights gerados
            </p>
          )}
        </div>
      </div>

      {/* Top content */}
      {(data?.topContent?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            Conteúdos Mais Vistos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(data?.topContent ?? []).map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50"
              >
                <span className="text-xs font-bold text-slate-300 w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {c.content?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {c.content?.type}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600 shrink-0">
                  {c.views} views
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
