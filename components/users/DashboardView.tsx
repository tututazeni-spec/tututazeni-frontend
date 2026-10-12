// components/users/DashboardView.tsx
// Vista "Dashboard": KPIs de RH + distribuição por departamento.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { ShareGaugeCard } from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AdminDashboard } from './types';

// Uma cor por departamento (cicla se houver mais departamentos que cores).
const DEPT_COLORS = [
  '#3B82F6',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
  '#F97316',
  '#6366F1',
  '#84CC16',
  '#06B6D4',
  '#A855F7',
];

export function DashboardView() {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.users.adminDashboard(),
    '/users/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <ShareGaugeCard
          label="Total colaboradores"
          value={data.users.total}
          total={data.users.total}
        />
        <DonutStatCard
          label="Activos"
          value={
            data.users.total > 0 ? (data.users.active / data.users.total) * 100 : 0
          }
          sub={`${data.users.active} de ${data.users.total}`}
        />
        <ShareGaugeCard
          label="Inactivos"
          value={data.users.inactive}
          total={data.users.total}
          lowerIsBetter
        />
        <ShareGaugeCard
          label="Pendentes"
          value={data.users.pending}
          total={data.users.total}
          lowerIsBetter
        />
        <ShareGaugeCard
          label="Suspensos"
          value={data.users.suspended}
          total={data.users.total}
          lowerIsBetter
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
          Distribuição por departamento
        </div>
        <div className="p-4 space-y-3">
          {data.byDepartment.map((dept, i) => {
            const max = data.byDepartment[0]?.count ?? 1;
            const pct = Math.round((dept.count / max) * 100);
            return (
              <div key={dept.id} className="flex items-center gap-4">
                <div className="w-36 text-xs text-ink truncate">
                  {dept.name}
                </div>
                <ProgressBar
                  value={pct}
                  color={DEPT_COLORS[i % DEPT_COLORS.length]}
                  className="h-5 flex-1 rounded-control"
                />
                <div className="w-12 text-right text-xs font-mono text-ink-muted">
                  {dept.count}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
