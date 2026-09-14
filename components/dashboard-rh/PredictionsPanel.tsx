// components/dashboard-rh/PredictionsPanel.tsx
// Painel "Previsões" — risco de saída projectado a partir de performance +
// tenure. Dados próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TurnoverPanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { PredictionsData } from './types';

export function PredictionsPanel() {
  const { data, isLoading: loading } = useApiQuery<PredictionsData>(
    queryKeys.dashboardRh.predictions(),
    '/dashboard-rh/predictions',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-warning-subtle bg-warning-subtle p-3">
        <p className="font-body text-xs text-warning-ink">
          Previsão heurística baseada em performance e tempo de casa — não substitui análise de RH.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <KpiCard
          label="Em Risco de Saída"
          value={data?.summary?.atRiskCount ?? 0}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          label="Baixa Performance"
          value={data?.summary?.lowPerfCount ?? 0}
          intent="warning"
          className="w-full"
        />
        <KpiCard
          label="Respostas de Engagement (mês)"
          value={data?.summary?.engagementResponses ?? 0}
          intent="info"
          className="w-full"
        />
      </div>

      {(data?.turnoverRisk ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Colaboradores Sinalizados
          </h4>
          <div className="space-y-2">
            {(data?.turnoverRisk ?? []).map((r, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <Avatar name={r.user?.fullName ?? '?'} url={r.user?.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {r.user?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {r.user?.department?.name} · {r.tenureMonths} meses de casa
                  </p>
                </div>
                <Badge intent={r.riskLevel === 'HIGH' ? 'danger' : 'warning'}>
                  {r.riskLevel === 'HIGH' ? 'Risco Alto' : 'Risco Médio'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
