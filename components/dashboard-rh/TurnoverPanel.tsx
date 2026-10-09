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
import { TopBarCard } from '@/components/ui/TopBarCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { AlertTriangle, Clock } from 'lucide-react';
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
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3 transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
          <GaugeChart
            value={data?.turnoverRate ?? 0}
            label="Taxa de Rotatividade"
            invert
            thresholds={{ warning: 15, danger: 25 }}
            size={120}
          />
        </div>
        <div className="flex flex-col items-center justify-center rounded-card border border-border bg-surface p-3 transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
          <GaugeChart
            value={data?.retentionRate ?? 0}
            label="Taxa de Retenção"
            thresholds={{ warning: 70, danger: 50 }}
            size={120}
          />
        </div>
        <TopBarCard
          label="Saídas (últimos 3 meses)"
          value={data?.leftLast3Months ?? 0}
          tone="red"
          icon={<AlertTriangle className="h-6 w-6" />}
        />
        <TopBarCard
          label="Tempo Médio de Casa"
          value={`${data?.avgTenureYears ?? 0} anos`}
          tone="blue"
          icon={<Clock className="h-6 w-6" />}
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
