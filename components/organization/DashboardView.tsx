// components/organization/DashboardView.tsx
// Vista "Dashboard": KPIs organizacionais e headcount por
// departamento. Extraído de app/(platform)/organization/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { HeadcountRow, OrgStats } from './types';

export function DashboardView() {
  const statsQuery = useApiQuery<OrgStats>(
    queryKeys.organization.stats(),
    '/organization/stats',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const headcountQuery = useApiQuery<HeadcountRow[]>(
    queryKeys.organization.headcount(),
    '/organization/headcount',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const stats = statsQuery.data ?? null;
  const headcount = headcountQuery.data ?? [];

  if (statsQuery.isLoading || !stats) return <Skeleton rows={4} />;

  const { headcount: hc, kpis } = stats;

  return (
    <div className="space-y-6">
      {/* KPIs principais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total colaboradores', value: hc.total },
          {
            label: 'Vagas abertas',
            value: hc.open,
            color: hc.open > 0 ? 'text-amber-600' : 'text-gray-900',
          },
          { label: 'Departamentos', value: stats.departments },
          { label: 'Unidades', value: stats.units },
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

      {/* KPIs org */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">
            Span of Control médio
          </div>
          <div className="text-3xl font-bold font-mono text-blue-700">
            {kpis.spanOfControl}
          </div>
          <div className="text-xs text-gray-400 mt-1">liderados por gestor</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">Gestores activos</div>
          <div className="text-3xl font-bold font-mono text-gray-900">
            {kpis.managerCount}
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-xs text-gray-400 mb-2">
            Profundidade hierárquica
          </div>
          <div className="text-3xl font-bold font-mono text-gray-900">
            {kpis.maxHierarchyDepth}
          </div>
          <div className="text-xs text-gray-400 mt-1">níveis máximos</div>
        </div>
      </div>

      {/* Headcount por departamento */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Headcount por departamento
        </div>
        {headcount.slice(0, 10).map((dept) => {
          const pct = dept.occupancyPct ?? 0;
          const color =
            pct >= 90
              ? 'bg-red-500'
              : pct >= 70
                ? 'bg-emerald-500'
                : 'bg-amber-500';
          return (
            <div
              key={dept.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="flex items-center gap-2 w-48">
                {dept.color && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: dept.color }}
                  />
                )}
                <div className="text-sm font-medium text-gray-900 truncate">
                  {dept.name}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>{dept.occupied} pessoas</span>
                  <span>{dept.planned > 0 ? `${pct}%` : '—'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-right w-20 flex-shrink-0">
                {dept.open > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    {dept.open} vagas
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
