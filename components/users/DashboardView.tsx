// components/users/DashboardView.tsx
// Vista "Dashboard": KPIs de RH + distribuição por departamento.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { MetricCard, Skeleton } from './shared';
import type { AdminDashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.users.adminDashboard(),
    '/users/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Total colaboradores" value={data.users.total} />
        <MetricCard
          label="Activos"
          value={data.users.active}
          color="text-emerald-600"
        />
        <MetricCard label="Inactivos" value={data.users.inactive} />
        <MetricCard
          label="Pendentes"
          value={data.users.pending}
          color="text-blue-600"
        />
        <MetricCard
          label="Suspensos"
          value={data.users.suspended}
          color={data.users.suspended > 0 ? 'text-amber-600' : undefined}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
          Distribuição por departamento
        </div>
        {data.byDepartment.map((dept) => {
          const max = data.byDepartment[0]?.count ?? 1;
          const pct = Math.round((dept.count / max) * 100);
          return (
            <div
              key={dept.id}
              className="flex items-center gap-4 px-4 py-2.5 border-b border-gray-100 last:border-0"
            >
              <div className="w-36 text-xs text-gray-700 truncate">
                {dept.name}
              </div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-right text-xs font-mono text-gray-500">
                {dept.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
