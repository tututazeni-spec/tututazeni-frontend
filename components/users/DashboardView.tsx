// components/users/DashboardView.tsx
// Vista "Dashboard": KPIs de RH + distribuição por departamento.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { AlertTriangle, Clock, Users, UserCheck, UserX } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
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
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Total colaboradores" value={data.users.total} />
        <KpiCard label="Activos" value={data.users.active} intent="success" />
        <KpiCard label="Inactivos" value={data.users.inactive} />
        <KpiCard label="Pendentes" value={data.users.pending} intent="info" />
        <KpiCard
          label="Suspensos"
          value={data.users.suspended}
          intent={data.users.suspended > 0 ? 'warning' : 'primary'}
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
