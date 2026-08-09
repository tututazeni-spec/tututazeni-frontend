// components/avatar-training/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, top cenários, distribuição por categoria e
// conclusões recentes. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/avatar-training/page.tsx.

'use client';

import { Bot, CheckCircle, Play, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar, Skeleton } from './atoms';
import { CATEGORY_CONFIG, SCORE_COLOR } from './constants';
import type { AnalyticsDashboard } from './types';

export function AnalyticsTab() {
  const { data, isLoading } = useApiQuery<AnalyticsDashboard>(
    queryKeys.avatarTraining.analytics(),
    '/avatar-training/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading) return <Skeleton />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Cenários',
            value: data?.kpis.totalScenarios,
            icon: Bot,
            color: 'text-indigo-600',
          },
          {
            label: 'Em Progresso',
            value: data?.kpis.activeSessions,
            icon: Play,
            color: 'text-blue-600',
          },
          {
            label: 'Concluídas',
            value: data?.kpis.completedSessions,
            icon: CheckCircle,
            color: 'text-emerald-600',
          },
          {
            label: 'Score Médio',
            value: data?.kpis.avgScore ?? '–',
            icon: Star,
            color: 'text-amber-600',
          },
        ].map((k) => (
          <div
            key={k.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <k.icon size={15} className={k.color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{k.value ?? 0}</p>
            <p className="text-xs text-slate-500">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top scenarios */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Top Cenários</h3>
          <div className="space-y-3">
            {(data?.topScenarios ?? []).map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-300 font-bold w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {s.scenario?.title}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {s.completions} sessões
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${SCORE_COLOR(s.avgScore ?? 0)}`}
                >
                  {s.avgScore ?? '–'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By category */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">Por Categoria</h3>
          <div className="space-y-2">
            {(data?.categoryBreakdown ?? []).map((c) => {
              const total = (data?.categoryBreakdown ?? []).reduce(
                (a, x) => a + x.count,
                0,
              );
              const pct = total > 0 ? Math.round((c.count / total) * 100) : 0;
              const cat =
                CATEGORY_CONFIG[c.category] ?? CATEGORY_CONFIG.SOFT_SKILLS;
              return (
                <div key={c.category}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600">{cat.label}</span>
                    <span className="font-semibold text-slate-700">
                      {c.count} ({pct}%)
                    </span>
                  </div>
                  <ProgressBar value={pct} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent completions */}
      {(data?.recentCompletions?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-700 mb-3">
            Conclusões Recentes
          </h3>
          <div className="flex flex-wrap gap-2">
            {(data?.recentCompletions ?? []).map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2"
              >
                <CheckCircle size={12} className="text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-slate-700">
                    {s.user?.fullName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {s.scenario?.title}
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
