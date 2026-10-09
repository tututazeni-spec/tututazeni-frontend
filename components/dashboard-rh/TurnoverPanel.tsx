// components/dashboard-rh/TurnoverPanel.tsx
// Painel "Rotatividade" — turnover/retenção e colaboradores em risco de
// saída. Dados próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/PerformancePanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertTriangle, Clock, TrendingDown, UserCheck } from 'lucide-react';
import { rateTone } from './rateTone';
import type { TurnoverData } from './types';

export function TurnoverPanel() {
  const { data, isLoading: loading } = useApiQuery<TurnoverData>(
    queryKeys.dashboardRh.turnover(),
    '/dashboard-rh/turnover',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={TrendingDown}
          tone={rateTone(data?.turnoverRate ?? 0, { warning: 15, danger: 25 }, true)}
          label="Taxa de Rotatividade"
          value={`${Math.round(data?.turnoverRate ?? 0)}%`}
        />
        <NavyStatCard
          icon={UserCheck}
          tone={rateTone(data?.retentionRate ?? 0, { warning: 70, danger: 50 })}
          label="Taxa de Retenção"
          value={`${Math.round(data?.retentionRate ?? 0)}%`}
        />
        <NavyStatCard
          label="Saídas (últimos 3 meses)"
          value={data?.leftLast3Months ?? 0}
          tone="red"
          icon={AlertTriangle}
        />
        <NavyStatCard
          label="Tempo Médio de Casa"
          value={`${data?.avgTenureYears ?? 0} anos`}
          tone="blue"
          icon={Clock}
        />
      </div>

      {(data?.atRiskUsers ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Colaboradores em Risco de Saída
          </h4>
          <div className="space-y-2">
            {(data?.atRiskUsers ?? []).map((u, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <Avatar name={u.user?.fullName ?? '?'} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {u.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {u.user?.position?.name} · {u.user?.department?.name}
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-ink-muted">
                  {u.score?.toFixed(1)}/5
                </span>
                <Badge intent={u.risk === 'HIGH' ? 'danger' : 'warning'}>
                  {u.risk === 'HIGH' ? 'Risco Alto' : 'Risco Médio'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
