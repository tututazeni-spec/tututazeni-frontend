// components/trainings/plans/PlansView.tsx
// Separador "Plano de Formação" (docs/trainings-detalhado.md pt.2) — só
// visível a quem pode gerir formações (mesmo CAN_MANAGE_TRAININGS_ROLES do
// separador "Gestão"; ver page.tsx). Mesmo padrão de GestaoView.tsx: lista +
// acções de ciclo de vida + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PLAN_PERIOD_LABEL, PLAN_STATUS_CFG, PRIORITY_CFG } from '../constants';
import type { TrainingPlan } from '../types';
import { PlanFormModal } from './PlanFormModal';

interface PlansResponse {
  data: TrainingPlan[];
  total: number;
}

interface PlansViewProps {
  onOpen: (id: number) => void;
}

export function PlansView({ onOpen }: PlansViewProps) {
  const role = useCurrentRole();
  const isAdminOrRh = role === 'ADMIN' || role === 'RH';
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editPlan, setEditPlan] = useState<TrainingPlan | null>(null);

  const { data, isLoading } = useApiQuery<PlansResponse>(
    queryKeys.trainingPlans.list({ limit: 100 }),
    '/training-plans',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainingPlans.all];
  const toastError = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const submit = useApiMutation((id: number) => apiClient.patch(`/training-plans/${id}/submit`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano submetido para aprovação.', intent: 'success' }),
    onError: toastError,
  });
  const approve = useApiMutation((id: number) => apiClient.patch(`/training-plans/${id}/approve`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano aprovado.', intent: 'success' }),
    onError: toastError,
  });
  const reject = useApiMutation((id: number) => apiClient.patch(`/training-plans/${id}/reject`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano rejeitado.', intent: 'success' }),
    onError: toastError,
  });
  const publish = useApiMutation((id: number) => apiClient.patch(`/training-plans/${id}/publish`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano publicado.', intent: 'success' }),
    onError: toastError,
  });
  const archive = useApiMutation((id: number) => apiClient.patch(`/training-plans/${id}/archive`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano arquivado.', intent: 'success' }),
    onError: toastError,
  });
  const duplicate = useApiMutation((id: number) => apiClient.post(`/training-plans/${id}/duplicate`, {}), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Plano duplicado.', intent: 'success' }),
    onError: toastError,
  });

  const rowBusy = (id: number) =>
    [submit, approve, reject, publish, archive, duplicate].some(
      (m) => m.isPending && m.variables === id,
    );

  async function onSubmit(p: TrainingPlan) {
    const ok = await confirm({ title: `Submeter "${p.name}" para aprovação?`, confirmLabel: 'Submeter' });
    if (ok) submit.mutate(p.id);
  }
  async function onReject(p: TrainingPlan) {
    const ok = await confirm({
      title: `Rejeitar "${p.name}"?`,
      confirmLabel: 'Rejeitar',
      destructive: true,
    });
    if (ok) reject.mutate(p.id);
  }
  async function onArchive(p: TrainingPlan) {
    const ok = await confirm({ title: `Arquivar "${p.name}"?`, confirmLabel: 'Arquivar' });
    if (ok) archive.mutate(p.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Novo Plano de Formação
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sem planos de formação"
          description="Os planos de formação (anuais, trimestrais ou extraordinários) aparecem aqui."
        />
      ) : (
        <Card className="divide-y divide-border">
          {list.map((p) => {
            const statusCfg = PLAN_STATUS_CFG[p.status];
            const priorityCfg = PRIORITY_CFG[p.priority];
            return (
              <div key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onOpen(p.id)}
                >
                  <div className="truncate text-sm font-medium text-ink">{p.name}</div>
                  <div className="text-xs text-ink-faint">
                    {p.code ? `${p.code} · ` : ''}
                    {p.year} · {PLAN_PERIOD_LABEL[p.period]}
                    {p._count ? ` · ${p._count.trainings} formação(ões)` : ''}
                  </div>
                </button>
                <span className={`flex-shrink-0 rounded px-2 py-0.5 font-body text-xs font-medium ${priorityCfg.cls}`}>
                  {priorityCfg.label}
                </span>
                <span className={`flex-shrink-0 rounded px-2 py-0.5 font-body text-xs font-medium ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button intent="ghost" size="sm" onClick={() => onOpen(p.id)}>
                    Ver
                  </Button>
                  {(p.status === 'DRAFT' || p.status === 'REJECTED') && (
                    <>
                      <Button intent="ghost" size="sm" onClick={() => setEditPlan(p)} disabled={rowBusy(p.id)}>
                        Editar
                      </Button>
                      <Button
                        intent="primary"
                        size="sm"
                        onClick={() => onSubmit(p)}
                        disabled={rowBusy(p.id)}
                        loading={submit.isPending && submit.variables === p.id}
                      >
                        Submeter
                      </Button>
                    </>
                  )}
                  {isAdminOrRh && p.status === 'SUBMITTED' && (
                    <>
                      <Button
                        intent="success"
                        size="sm"
                        onClick={() => approve.mutate(p.id)}
                        disabled={rowBusy(p.id)}
                        loading={approve.isPending && approve.variables === p.id}
                      >
                        Aprovar
                      </Button>
                      <Button
                        intent="danger"
                        size="sm"
                        onClick={() => onReject(p)}
                        disabled={rowBusy(p.id)}
                        loading={reject.isPending && reject.variables === p.id}
                      >
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {p.status === 'APPROVED' && (
                    <Button
                      intent="success"
                      size="sm"
                      onClick={() => publish.mutate(p.id)}
                      disabled={rowBusy(p.id)}
                      loading={publish.isPending && publish.variables === p.id}
                    >
                      Publicar
                    </Button>
                  )}
                  {p.status !== 'ARCHIVED' && (
                    <Button intent="ghost" size="sm" onClick={() => onArchive(p)} disabled={rowBusy(p.id)}>
                      Arquivar
                    </Button>
                  )}
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => duplicate.mutate(p.id)}
                    disabled={rowBusy(p.id)}
                    loading={duplicate.isPending && duplicate.variables === p.id}
                  >
                    Duplicar
                  </Button>
                  <a
                    href={`/api/training-plans/${p.id}/export`}
                    className={buttonVariants({ intent: 'ghost', size: 'sm' })}
                  >
                    Exportar
                  </a>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {showCreate && (
        <PlanFormModal
          plan={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() => toast({ title: 'Plano de formação criado.', intent: 'success' })}
        />
      )}
      {editPlan && (
        <PlanFormModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSuccess={() => toast({ title: 'Plano de formação actualizado.', intent: 'success' })}
        />
      )}
    </div>
  );
}
