// components/development-plans/MyPlansView.tsx
// Vista "Os meus PDIs": stats pessoais + grelha de planos. Extraído
// de app/(platform)/development-plans/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
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

  if (plansQuery.isLoading || statsQuery.isLoading) return <Skeleton />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total PDIs', value: stats.plans.total },
            {
              label: 'Activos',
              value: stats.plans.active,
              color: 'text-emerald-600',
            },
            {
              label: 'Concluídos',
              value: stats.plans.completed,
              color: 'text-blue-600',
            },
            {
              label: 'XP ganho',
              value: `${stats.totalXp}`,
              color: 'text-amber-600',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div
                className={`text-2xl font-bold font-mono ${color ?? 'text-gray-900'}`}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      {plans.length === 0 ? (
        <div className="py-12 text-center border border-dashed border-gray-200 rounded-xl text-sm text-gray-400">
          <div className="text-4xl mb-3">🎯</div>
          Sem planos de desenvolvimento criados ainda
        </div>
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
