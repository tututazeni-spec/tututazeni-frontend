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
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
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
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Taxa de Rotatividade"
          value={`${data?.turnoverRate ?? 0}%`}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          label="Taxa de Retenção"
          value={`${data?.retentionRate ?? 0}%`}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Saídas (últimos 3 meses)"
          value={data?.leftLast3Months ?? 0}
          intent="warning"
          className="w-full"
        />
        <KpiCard
          label="Tempo Médio de Casa"
          value={`${data?.avgTenureYears ?? 0} anos`}
          intent="primary"
          className="w-full"
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

      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-black">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
