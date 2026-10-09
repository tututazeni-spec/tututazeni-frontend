// components/users/DashboardView.tsx
// Vista "Dashboard": KPIs de RH + distribuição por departamento.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { Ban, Clock, UserCheck, UserMinus, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AdminDashboard } from './types';

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
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Total colaboradores"
          value={data.users.total}
        />
        <NavyStatCard
          icon={UserCheck}
          tone="green"
          label="Activos"
          value={data.users.active}
        />
        <NavyStatCard
          icon={UserMinus}
          tone="orange"
          label="Inactivos"
          value={data.users.inactive}
        />
        <NavyStatCard
          icon={Clock}
          tone="blue"
          label="Pendentes"
          value={data.users.pending}
        />
        <NavyStatCard
          icon={Ban}
          tone={data.users.suspended > 0 ? 'red' : 'blue'}
          label="Suspensos"
          value={data.users.suspended}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
          Distribuição por departamento
        </div>
        <div className="p-4 space-y-3">
          {data.byDepartment.map((dept) => {
            const max = data.byDepartment[0]?.count ?? 1;
            const pct = Math.round((dept.count / max) * 100);
            return (
              <div key={dept.id} className="flex items-center gap-4">
                <div className="w-36 text-xs text-ink truncate">
                  {dept.name}
                </div>
                <ProgressBar
                  value={pct}
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
