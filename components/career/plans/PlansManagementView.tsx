// components/career/plans/PlansManagementView.tsx
// Separador "Planos de Carreira" (RH/Gestor/Admin) — Módulo Career,
// secção 4. Lista todos os planos (GET /career-plans) e abre
// NewCareerPlanModal para criar um novo. Inclui o roadmap (CareerRoadmap)
// no detalhe de cada plano seleccionado.

'use client';

import { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { NewCareerPlanModal } from '../NewCareerPlanModal';
import { CareerRoadmap } from './CareerRoadmap';
import type { CareerPlan } from './types';

export function PlansManagementView() {
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<CareerPlan | null>(null);
  const notify = useToast();
  const confirm = useConfirm();
  const {
    data: resp,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: CareerPlan[] }>(
    queryKeys.careerPlans.list({}),
    '/career-plans',
    {
      staleTime: STALE_TIME.DYNAMIC,
    },
  );
  const plans = resp?.data ?? [];

  const deletePlan = useApiMutation(
    (id: number) => apiClient.delete(`/career-plans/${id}`),
    {
      onSuccess: () => {
        setSelected(null);
        refetch();
        notify({ title: 'Plano de carreira apagado', intent: 'success' });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleDelete = async (plan: CareerPlan) => {
    const ok = await confirm({
      title: 'Apagar plano de carreira',
      message: `Tem a certeza que quer apagar "${plan.title}"? O plano deixa de aparecer na lista.`,
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) deletePlan.mutate(plan.id);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <span className="font-body text-sm text-ink-faint">
          {plans.length} planos
        </span>
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
              <div
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
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-[18px] p-3.5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)] transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50',
                  'bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57]',
                  selected?.id === plan.id && 'ring-2 ring-[#0D6EFD] ring-offset-2',
                )}
              >
                  <Avatar
                    name={plan.user?.fullName ?? '?'}
                    url={plan.user?.avatarUrl ?? undefined}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm font-semibold">
                      {plan.user?.fullName ?? `Colaborador #${plan.userId}`}
                    </div>
                    <div className="truncate font-body text-xs text-white/80">
                      {plan.title}
                    </div>
                  </div>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 font-body text-xs font-semibold text-white">
                    {plan.status}
                  </span>
              </div>
            ))}
          </div>

          <div>
            {!selected ? (
              <div className="flex h-48 items-center justify-center rounded-card border border-dashed border-border-strong font-body text-sm text-ink-faint">
                Selecciona um plano
              </div>
            ) : (
              <div className="overflow-hidden rounded-[18px] border border-[#D6E4F5] bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
                <div className="flex items-start justify-between gap-3 bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] px-6 py-4 text-white">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <ClipboardList size={20} strokeWidth={1.75} />
                      <h3 className="truncate font-body text-sm font-semibold uppercase tracking-wider">
                        {selected.title}
                      </h3>
                    </div>
                    <div className="mt-2 font-body text-xs text-white/85">
                      {selected.currentRole?.name ?? '—'} →{' '}
                      {selected.targetRole?.name ?? '—'}
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={deletePlan.isPending}
                    onClick={() => handleDelete(selected)}
                    className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-white/15 px-3 font-body text-xs font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} strokeWidth={1.75} /> Apagar
                  </button>
                </div>
                <div className="p-6">
                  {selected.readiness && (
                    <div className="mb-4 rounded-xl bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] px-4 py-3 text-white">
                      <div className="mb-1 flex justify-between font-body text-xs font-semibold uppercase tracking-widest text-white">
                        <span>Prontidão</span>
                        <span className="tabular-nums">
                          {selected.readiness.score}%
                        </span>
                      </div>
                      <ProgressBar
                        value={selected.readiness.score}
                        color="#F97316"
                        className="bg-white/20"
                      />
                    </div>
                  )}
                  <CareerRoadmap plan={selected} />
                  {(selected.mentoringNotes || selected.coachingNotes) && (
                    <div className="mt-4 space-y-2 rounded-xl bg-gradient-to-br from-[#0F1F3D] via-[#0B3A75] to-[#0A2A57] px-4 py-3 font-body text-xs text-white">
                      {selected.mentoringNotes && (
                        <div>
                          <span className="font-semibold">Mentoria: </span>
                          <span className="whitespace-pre-line">{selected.mentoringNotes}</span>
                        </div>
                      )}
                      {selected.coachingNotes && (
                        <div>
                          <span className="font-semibold">
                            Acompanhamento personalizado:{' '}
                          </span>
                          <span className="whitespace-pre-line">{selected.coachingNotes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
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
