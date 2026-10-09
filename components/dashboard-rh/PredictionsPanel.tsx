// components/dashboard-rh/PredictionsPanel.tsx
// Painel "Previsões" — risco de saída projectado a partir de performance +
// tenure. Dados próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TurnoverPanel.tsx.
//
// NavyStatCard (cabeçalho azul-marinho + ícone circular), padrão partilhado
// com os restantes painéis do dashboard-rh.

'use client';

import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, MessageSquare, TrendingDown } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
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
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={AlertTriangle}
          label="Em Risco de Saída"
          value={data?.summary?.atRiskCount ?? 0}
          tone="red"
        />
        <NavyStatCard
          icon={TrendingDown}
          label="Baixa Performance"
          value={data?.summary?.lowPerfCount ?? 0}
          tone="orange"
        />
        <NavyStatCard
          icon={MessageSquare}
          label="Respostas de Engajamento (mês)"
          value={data?.summary?.engagementResponses ?? 0}
          tone="blue"
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
                <Avatar
                  name={r.user?.fullName ?? '?'}
                  url={r.user?.avatarUrl}
                />
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
