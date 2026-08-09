// components/dashboard-rh/PerformancePanel.tsx
// Painel "Performance" — KPIs, distribuição, score por departamento e
// insights. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

'use client';

import { AlertTriangle, Star, Users, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KPICard, ProgressBar, Skeleton } from './atoms';
import type { PerformanceData } from './types';

export function PerformancePanel() {
  const { data, isLoading: loading } = useApiQuery<PerformanceData>(
    queryKeys.dashboardRh.performance(),
    '/dashboard-rh/performance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;
  const dist = data?.distribution ?? {};
  const total = Object.values(dist as Record<string, number>).reduce(
    (a, b) => a + b,
    0,
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={Star}
          label="Score Médio"
          value={data?.avgScore?.toFixed(1) ?? '–'}
          status={data?.status}
          color="text-amber-600"
          bg="bg-amber-50"
        />
        <KPICard icon={Users} label="Avaliados" value={data?.total ?? 0} />
        <KPICard
          icon={Zap}
          label="High Potentials"
          value={data?.hiPos ?? 0}
          sub={`${data?.hiPoRatio ?? 0}% da equipa`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <KPICard
          icon={AlertTriangle}
          label="Em Risco"
          value={data?.atRisk ?? 0}
          color="text-red-500"
          bg="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distribution */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Distribuição de Performance
          </h4>
          {[
            {
              key: 'exceptional',
              label: '⭐ Excepcional',
              color: 'bg-emerald-500',
            },
            { key: 'above', label: '✅ Acima', color: 'bg-teal-400' },
            { key: 'expected', label: '👍 Esperado', color: 'bg-amber-400' },
            { key: 'below', label: '⚠️ Abaixo', color: 'bg-orange-400' },
            { key: 'critical', label: '🔴 Crítico', color: 'bg-red-400' },
          ].map((b) => {
            const val = dist[b.key] ?? 0;
            const pct = total > 0 ? Math.round((val / total) * 100) : 0;
            return (
              <div key={b.key} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-slate-600">{b.label}</span>
                  <span className="font-semibold text-slate-700">
                    {val} ({pct}%)
                  </span>
                </div>
                <ProgressBar value={pct} color={b.color} />
              </div>
            );
          })}
        </div>

        {/* By dept */}
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            Score por Departamento
          </h4>
          {(data?.byDepartment ?? []).slice(0, 6).map((d, i) => (
            <div key={i} className="mb-2">
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-slate-600 truncate">{d.department}</span>
                <span
                  className={`font-bold text-xs ${d.avgScore >= 4 ? 'text-emerald-600' : d.avgScore >= 3 ? 'text-amber-600' : 'text-red-500'}`}
                >
                  {d.avgScore.toFixed(1)}
                </span>
              </div>
              <ProgressBar
                value={(d.avgScore / 5) * 100}
                color={
                  d.avgScore >= 4
                    ? 'bg-emerald-500'
                    : d.avgScore >= 3
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      {(data?.insights?.length ?? 0) > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="text-xs text-violet-800">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
