// components/analytics/HRDashboardView.tsx
// Separador "RH" — people/learning/PDI analytics e headcount por
// departamento. Dados próprios + apresentação. Extraído de
// app/(platform)/analytics/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard, ProgressBar, Skeleton } from './atoms';
import type { HRDashboard } from './types';

export function HRDashboardView() {
  const { data, isLoading } = useApiQuery<HRDashboard>(
    queryKeys.analyticsPage.hr(),
    '/analytics/hr',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-5">
      {/* People */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          People Analytics
        </div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Activos" value={data.people.total} />
          <KpiCard
            label="Admitidos"
            value={data.people.hired}
            color="text-emerald-600"
          />
          <KpiCard
            label="Saídas"
            value={data.people.terminated}
            color="text-red-600"
          />
          <KpiCard
            label="Turnover"
            value={`${data.people.turnoverRate}%`}
            color={
              data.people.turnoverRate > 10 ? 'text-red-600' : 'text-gray-900'
            }
          />
        </div>
      </div>

      {/* Learning */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Learning Analytics
        </div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard label="Matrículas" value={data.learning.enrollments} />
          <KpiCard
            label="Concluídas"
            value={data.learning.completed}
            color="text-emerald-600"
          />
          <KpiCard
            label="Taxa conclusão"
            value={`${data.learning.completionRate}%`}
            color="text-blue-600"
          />
          <KpiCard
            label="Abandonadas"
            value={data.learning.abandoned}
            color={
              data.learning.abandonRate > 20 ? 'text-red-600' : 'text-gray-900'
            }
          />
        </div>
      </div>

      {/* PDI */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          PDI Analytics
        </div>
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            label="PDIs activos"
            value={data.pdi.active}
            color="text-blue-600"
          />
          <KpiCard
            label="Adopção"
            value={`${data.pdi.adoptionRate}%`}
            color="text-purple-600"
          />
          <KpiCard
            label="Ag. aprovação"
            value={data.pdi.pendingApproval}
            color={
              data.pdi.pendingApproval > 0 ? 'text-amber-600' : 'text-gray-900'
            }
          />
          <KpiCard
            label="Concluídos (mês)"
            value={data.pdi.completed}
            color="text-emerald-600"
          />
        </div>
      </div>

      {/* Headcount por departamento */}
      {(data.headcountByDept?.length ?? 0) > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Headcount por departamento
          </div>
          {(data.headcountByDept ?? []).map((d) => (
            <div
              key={d.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <div className="text-sm font-medium text-gray-900 w-48 truncate">
                {d.name}
              </div>
              <div className="flex-1">
                <ProgressBar
                  pct={Math.round((d.count / data.people.total) * 100)}
                  color="bg-blue-400"
                  h="h-1.5"
                />
              </div>
              <div className="text-sm font-mono font-bold text-gray-900 w-8 text-right">
                {d.count}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
