// components/analytics/ManagerView.tsx
// Separador "Equipa" — alertas, KPIs de gestor e tabs (equipa/9-box/
// gaps de competências). Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, KpiCard, Skeleton } from './atoms';
import { NineBox } from './NineBox';
import type { ManagerDashboard } from './types';

export function ManagerView() {
  const [tab, setTab] = useState<'overview' | 'ninebox' | 'gaps'>('overview');
  const { data, isLoading } = useApiQuery<ManagerDashboard>(
    queryKeys.analyticsPage.manager(),
    '/analytics/manager',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  const { metrics, alerts, competencyGaps, nineBox } = data;

  return (
    <div className="space-y-5">
      {/* Alertas */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="text-sm font-semibold text-amber-800 mb-2">
            ⚠ Alertas da equipa
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="text-xs text-amber-700">
              • {a.message}
            </div>
          ))}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <KpiCard label="Equipa" value={metrics.headcount} />
        <KpiCard
          label="PDIs activos"
          value={`${metrics.pdiAdoptionRate}%`}
          color="text-blue-600"
          sub="adopção"
        />
        <KpiCard
          label="Conclusão cursos"
          value={`${metrics.completionRate}%`}
          color="text-emerald-600"
        />
        <KpiCard
          label="Perf. média"
          value={metrics.avgPerformance}
          color="text-amber-600"
        />
      </div>
      {metrics.overdueActions > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">
          🔴 {metrics.overdueActions} acções de PDI atrasadas na equipa
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(['overview', 'ninebox', 'gaps'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {{ overview: '👥 Equipa', ninebox: '🗃 9-Box', gaps: '📊 Gaps' }[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-2">
          {data.team.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <Avatar name={u.fullName} avatarUrl={u.avatarUrl} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900">
                  {u.fullName}
                </div>
                <div className="text-xs text-gray-400">
                  {u.position?.name} · {u.department?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'ninebox' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            Matriz 9-Box
          </div>
          <NineBox data={nineBox} />
          {nineBox.length === 0 && (
            <div className="text-center text-sm text-gray-400 py-6">
              Sem dados de 9-box para a equipa
            </div>
          )}
        </div>
      )}

      {tab === 'gaps' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
            Top Gaps de Competências
          </div>
          <div className="space-y-3">
            {competencyGaps.map((g) => (
              <div key={g.name} className="flex items-center gap-3">
                <div className="text-xs text-gray-700 w-40 truncate">
                  {g.name}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min(g.avgGap * 20, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-xs font-mono text-red-600 flex-shrink-0 w-12 text-right">
                  Gap: {g.avgGap}
                </div>
                <div className="text-xs text-gray-400 flex-shrink-0">
                  {g.count} pessoas
                </div>
              </div>
            ))}
            {competencyGaps.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-4">
                Sem gaps identificados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
