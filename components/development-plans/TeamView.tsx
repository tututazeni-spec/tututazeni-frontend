// components/development-plans/TeamView.tsx
// Vista "Equipa": lista de PDIs activos dos colaboradores da equipa.
// Extraído de app/(platform)/development-plans/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlanCard } from './PlanCard';
import type { TeamPlanSummary } from './types';

interface TeamViewProps {
  onSelect: (id: number) => void;
}

export function TeamView({ onSelect }: TeamViewProps) {
  const { data: plans = [], isLoading } = useApiQuery<TeamPlanSummary[]>(
    queryKeys.developmentPlans.teamDashboard(),
    '/development-plans/team/dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={3} />;

  return (
    <div>
      <div className="mb-4 font-body text-xs text-ink-faint">
        {plans.length} planos activos na equipa
      </div>
      {plans.length === 0 ? (
        <EmptyState
          title="Sem PDIs activos na equipa"
          description="Ainda não há planos de desenvolvimento activos para os teus colaboradores."
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {plans.map((p) => (
            <PlanCard
              key={p.id}
              onClick={() => onSelect(p.id)}
              plan={{
                id: p.id,
                name: p.name,
                status: p.pendingApproval
                  ? 'PENDING_APPROVAL'
                  : (p.status ?? 'ACTIVE'),
                priority: p.priority,
                goal: p.goal,
                period: p.period,
                endDate: p.endDate,
                imageUrl: p.imageUrl,
                actionProgress: p.progress,
                overdueActions: p.overdueActions,
                user: p.user,
                _count: {
                  actions: p.actionCount ?? 0,
                  goals: p.goalCount ?? 0,
                  checkpoints: 0,
                },
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
