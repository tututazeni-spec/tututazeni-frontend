// components/development-plans/MyPlansView.tsx
// Vista "Os meus PDIs": stats pessoais + grelha de planos. Extraído
// de app/(platform)/development-plans/page.tsx.

'use client';

import { CheckCircle2, ClipboardList, Target, Trophy } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
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

  const queryClient = useQueryClient();
  const notify = useToast();
  const confirm = useConfirm();
  const role = useCurrentRole();
  const canDelete = role === 'ADMIN' || role === 'RH' || role === 'GESTOR';

  const handleDelete = async (plan: Plan) => {
    const ok = await confirm({
      title: 'Apagar PDI',
      message: `Tem a certeza que quer apagar "${plan.name}"? Esta acção não pode ser desfeita.`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/development-plans/${plan.id}`);
      await queryClient.invalidateQueries({
        queryKey: queryKeys.developmentPlans.all,
      });
      notify({ title: 'PDI apagado', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'MyPlansView.handleDelete' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

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
            label="Total PDIs"
            value={stats.plans.total}
            intent="primary"
            icon={ClipboardList}
          />
          <KpiCard
            label="Activos"
            value={stats.plans.active}
            intent="success"
            icon={Target}
          />
          <KpiCard
            label="Concluídos"
            value={stats.plans.completed}
            intent="info"
            icon={CheckCircle2}
          />
          <KpiCard
            label="Pontos de experiência ganho"
            value={stats.totalXp}
            intent="warning"
            icon={Trophy}
          />
        </div>
      )}

      {/* Plans */}
      <section className="pt-3">
        <h2 className="mb-6 mt-0 inline-block rounded-full bg-[#0F1F3D] px-5 py-1.5 text-sm font-bold uppercase tracking-wide text-white">
          Os meus PDIs
        </h2>
        {plans.length === 0 ? (
          <EmptyState
            title="Sem planos de desenvolvimento"
            description="Ainda não tens nenhum PDI criado."
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {plans.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                onClick={() => onSelect(p.id)}
                onDelete={
                  canDelete && p.status !== 'ACTIVE'
                    ? () => handleDelete(p)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
