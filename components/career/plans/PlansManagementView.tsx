// components/career/plans/PlansManagementView.tsx
// Separador "Planos de Carreira" (RH/Gestor/Admin) — Módulo Career,
// secção 4. Lista todos os planos (GET /career-plans) e abre
// NewCareerPlanModal para criar um novo. Inclui o roadmap (CareerRoadmap)
// no detalhe de cada plano seleccionado.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { NewCareerPlanModal } from '../NewCareerPlanModal';
import { CareerRoadmap } from './CareerRoadmap';
import type { CareerPlan } from './types';

const STATUS_INTENT: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  DRAFT: 'neutral',
  ACTIVE: 'info',
  COMPLETED: 'success',
  PAUSED: 'warning',
  ARCHIVED: 'neutral',
};

export function PlansManagementView() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<CareerPlan | null>(null);
  const {
    data: resp,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: CareerPlan[] }>(queryKeys.careerPlans.list({}), '/career-plans', {
    staleTime: STALE_TIME.DYNAMIC,
  });
  const plans = resp?.data ?? [];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-body text-sm text-ink-faint">{plans.length} planos</span>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus size={14} strokeWidth={1.75} /> Novo Plano de Carreira
        </Button>
      </div>

      {loading ? (
        <Skeleton rows={4} />
      ) : plans.length === 0 ? (
        <EmptyState
          title="Sem planos de carreira"
          description="Cria o primeiro plano de carreira para um colaborador."
        />
      ) : (
        <div className="grid grid-cols-[1fr_1.2fr] gap-5">
          <div className="space-y-2">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                onClick={() => setSelected(plan)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(plan);
                  }
                }}
                className={`cursor-pointer p-3 transition-shadow duration-150 hover:shadow-hover ${
                  selected?.id === plan.id ? 'border-primary bg-primary-subtle' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={plan.user?.fullName ?? '?'} url={plan.user?.avatarUrl ?? undefined} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm font-medium text-ink">
                      {plan.user?.fullName ?? `Colaborador #${plan.userId}`}
                    </div>
                    <div className="truncate font-body text-xs text-ink-faint">{plan.title}</div>
                  </div>
                  <Badge intent={STATUS_INTENT[plan.status] ?? 'neutral'}>{plan.status}</Badge>
                </div>
              </Card>
            ))}
          </div>

          <div>
            {!selected ? (
              <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
                Selecciona um plano
              </div>
            ) : (
              <Card className="p-5">
                <div className="mb-1 font-display text-lg font-bold text-ink">{selected.title}</div>
                <div className="mb-4 font-body text-xs text-ink-faint">
                  {selected.currentRole?.name ?? '—'} → {selected.targetRole?.name ?? '—'}
                </div>
                {selected.readiness && (
                  <div className="mb-4">
                    <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
                      <span>Prontidão</span>
                      <span>{selected.readiness.score}%</span>
                    </div>
                    <ProgressBar value={selected.readiness.score} />
                  </div>
                )}
                <CareerRoadmap plan={selected} />
                {(selected.mentoringNotes || selected.coachingNotes) && (
                  <div className="mt-4 space-y-2">
                    {selected.mentoringNotes && (
                      <div className="rounded-control bg-surface-sunken p-2.5 font-body text-xs text-ink-muted">
                        <span className="font-semibold text-ink">Mentoring: </span>
                        {selected.mentoringNotes}
                      </div>
                    )}
                    {selected.coachingNotes && (
                      <div className="rounded-control bg-surface-sunken p-2.5 font-body text-xs text-ink-muted">
                        <span className="font-semibold text-ink">Coaching: </span>
                        {selected.coachingNotes}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}

      {showNew && (
        <NewCareerPlanModal
          onClose={() => setShowNew(false)}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
