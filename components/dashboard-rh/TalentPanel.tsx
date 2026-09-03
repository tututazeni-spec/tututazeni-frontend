// components/dashboard-rh/TalentPanel.tsx
// Painel "Talento" — pipeline de sucessão, high potentials e posições em
// risco. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx; badge de
// prontidão via components/ui/Badge.

'use client';

import { AlertTriangle, Star, Target, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TalentData } from './types';

export function TalentPanel() {
  const { data, isLoading: loading } = useApiQuery<TalentData>(
    queryKeys.dashboardRh.talent(),
    '/dashboard-rh/talent-pipeline',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Posições Cobertas"
          value={`${data?.coverageRate ?? 0}%`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Planos de Sucessão"
          value={data?.successionPlans?.length ?? 0}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Profissionais de Alto Potencial"
          value={data?.hiPoCount ?? 0}
          intent="warning"
          className="w-full"
        />
        <KpiCard
          label="Posições em Risco"
          value={data?.positionsAtRisk?.length ?? 0}
          intent="danger"
          className="w-full"
        />
      </div>

      {/* Succession plans */}
      {(data?.successionPlans ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Planos de Sucessão
          </h4>
          <div className="space-y-2">
            {(data?.successionPlans ?? []).slice(0, 8).map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-3 border-b border-border py-2 last:border-0"
              >
                <Avatar
                  name={p.candidate?.fullName ?? '?'}
                  url={p.candidate?.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm font-medium text-ink">
                    {p.candidate?.fullName}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    → {p.position?.name}
                  </p>
                </div>
                {p.readiness && <Badge intent="info">{p.readiness}</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positions at risk */}
      {(data?.positionsAtRisk ?? []).length > 0 && (
        <div className="rounded-card border border-danger-subtle bg-danger-subtle p-4">
          <h4 className="mb-2 font-body font-semibold text-danger-ink">
            <AlertTriangle
              size={14}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Posições Sem Sucessor
          </h4>
          <div className="space-y-1">
            {(data?.positionsAtRisk ?? []).map((p, i) => (
              <p key={i} className="font-body text-xs text-danger-ink">
                • {p.name} (Nível {p.level})
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
