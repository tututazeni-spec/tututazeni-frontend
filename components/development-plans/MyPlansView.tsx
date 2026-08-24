// components/development-plans/MyPlansView.tsx
// Vista "Os meus PDIs": stats pessoais + grelha de planos. Extraído
// de app/(platform)/development-plans/page.tsx.

'use client';

import { CheckCircle2, ClipboardList, PlayCircle, Target, Zap } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { PlanCard } from './PlanCard';
import type { MyStats, Plan } from './types';

interface MyPlansViewProps {
  onSelect: (id: number) => void;
}

export function MyPlansView({ onSelect }: MyPlansViewProps) {
  const plansQuery = useApiQuery<Plan[]>(
    queryKeys.developmentPlans.my(),
    '/development-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const statsQuery = useApiQuery<MyStats>(
    queryKeys.developmentPlans.myStats(),
    '/development-plans/my/stats',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const plans = plansQuery.data ?? [];
  const stats = statsQuery.data ?? null;

  if (plansQuery.isLoading || statsQuery.isLoading)
    return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          <KpiCard
            icon={ClipboardList}
            label="Total PDIs"
            value={stats.plans.total}
            intent="primary"
          />
          <KpiCard
            icon={PlayCircle}
            label="Activos"
            value={stats.plans.active}
            intent="success"
          />
          <KpiCard
            icon={CheckCircle2}
            label="Concluídos"
            value={stats.plans.completed}
            intent="info"
          />
          <KpiCard
            icon={Zap}
            label="Pontos de experiência ganho"
            value={stats.totalXp}
            intent="warning"
          />
        </div>
      )}

      {/* Plans */}
      {plans.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Sem planos de desenvolvimento"
          description="Ainda não tens nenhum PDI criado."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {plans.map((p) => (
            <PlanCard key={p.id} plan={p} onClick={() => onSelect(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
