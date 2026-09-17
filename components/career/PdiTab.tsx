// components/career/PdiTab.tsx
// Separador "PDI & Desenvolvimento" — o PDI continua um módulo próprio
// (src/development-plans), esta vista só resume o(s) plano(s) activo(s) do
// colaborador e liga para lá para gestão completa (abrir/criar PDI,
// adicionar objectivo/acção). Nenhum endpoint novo: reutiliza
// GET /development-plans/my.

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ClipboardList } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Plan } from '@/components/development-plans/types';

const STATUS_INTENT: Record<string, 'success' | 'warning' | 'info' | 'neutral' | 'danger'> = {
  DRAFT: 'neutral',
  PENDING_APPROVAL: 'warning',
  ACTIVE: 'info',
  PAUSED: 'warning',
  AT_RISK: 'danger',
  COMPLETED: 'success',
  PARTIALLY_COMPLETED: 'success',
  CANCELLED: 'neutral',
  OVERDUE: 'danger',
};

export function PdiTab() {
  const router = useRouter();
  const { data: plans = [], isLoading: loading } = useApiQuery<Plan[]>(
    queryKeys.developmentPlans.my(),
    '/development-plans/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading) return <Skeleton rows={3} />;

  const active = plans.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status));

  if (plans.length === 0) {
    return (
      <EmptyState
        title="Sem PDI activo"
        description="Cria um Plano de Desenvolvimento Individual — pode nascer ligado a este plano de carreira."
        action={{ label: 'Criar PDI', onClick: () => router.push('/development-plans') }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-body text-sm font-semibold text-ink">
          <ClipboardList size={16} strokeWidth={1.75} className="text-primary" />
          Planos de Desenvolvimento Individual
        </div>
        <Link href="/development-plans">
          <Button intent="secondary" size="sm">
            Abrir módulo PDI <ArrowUpRight size={14} strokeWidth={1.75} />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(active.length > 0 ? active : plans).map((plan) => (
          <Link key={plan.id} href="/development-plans">
            <Card className="p-4 transition-shadow duration-150 hover:shadow-hover">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-semibold text-ink">
                    {plan.name}
                  </div>
                  <div className="mt-0.5 truncate font-body text-xs text-ink-faint">
                    {plan.goal}
                  </div>
                </div>
                <Badge intent={STATUS_INTENT[plan.status] ?? 'neutral'}>{plan.status}</Badge>
              </div>
              <ProgressBar value={plan.overallProgress} className="mb-2" />
              <div className="flex items-center justify-between font-body text-xs text-ink-faint">
                <span>{plan.overallProgress}% concluído</span>
                <span>
                  {plan._count.actions} acções · {plan._count.goals} objectivos
                </span>
              </div>
              {plan.careerPlan && (
                <div
                  className={cn(
                    'mt-3 rounded-control bg-primary-subtle px-2.5 py-1.5 font-body text-xs text-primary',
                  )}
                >
                  Ligado ao plano de carreira: {plan.careerPlan.title}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
