// components/competencies/DashboardView.tsx
// Separador "Dashboard RH" — métricas globais, gaps críticos e top
// competências. Dados próprios + apresentação. Extraído de
// app/(platform)/competencies/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton } from './atoms';
import { CATEGORY_CFG } from './constants';
import type { CompetencyCategory, OrgDashboard, TopCompetency } from './types';

export function DashboardView() {
  const dataQ = useApiQuery<OrgDashboard>(
    queryKeys.competencies.dashboardGaps(),
    '/competencies/dashboard/gaps',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const topQ = useApiQuery<TopCompetency[]>(
    queryKeys.competencies.top(),
    '/competencies/top',
    { params: { limit: 8 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = dataQ.data ?? null;
  const top = topQ.data ?? [];
  const loading = dataQ.isLoading;

  if (loading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total colaboradores', value: data.totalUsers },
          {
            label: 'Com competências',
            value: data.usersWithCompetencies,
            color: 'text-emerald-600',
          },
          {
            label: 'Sem competências',
            value: data.totalUsers - data.usersWithCompetencies,
            color: 'text-amber-600',
          },
          {
            label: 'Gaps identificados',
            value: data.totalGaps,
            color: data.totalGaps > 0 ? 'text-red-600' : undefined,
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Gaps críticos */}
      {data.criticalGaps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Competências críticas — mais gaps
          </div>
          {data.criticalGaps.map((c) => {
            const pct =
              data.totalUsers > 0
                ? Math.round((c.usersWithGap / data.totalUsers) * 100)
                : 0;
            return (
              <div
                key={c.id}
                className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {c.name}
                  </div>
                  <StatusBadge
                    value={c.category as CompetencyCategory}
                    map={CATEGORY_CFG}
                  />
                </div>
                <div className="w-40">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{c.usersWithGap} utilizadores</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-1.5 bg-red-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top competências */}
      {top.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Competências mais comuns na organização
          </div>
          {top.map((t, idx) => (
            <div
              key={t.competencyId}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {t.competency?.name ?? '—'}
                </div>
                <StatusBadge
                  value={
                    (t.competency?.category ??
                      'HARD_SKILL') as CompetencyCategory
                  }
                  map={CATEGORY_CFG}
                />
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-gray-700">
                  {t._count.competencyId} utilizadores
                </div>
                <div className="text-xs text-gray-400">
                  Nível médio: {t.avgLevel}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
