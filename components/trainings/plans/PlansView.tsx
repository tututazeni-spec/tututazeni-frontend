// components/trainings/plans/PlansView.tsx
// Separador "Plano de Formação" (docs/trainings-detalhado.md pt.2) — só
// visível a quem pode gerir formações (mesmo CAN_MANAGE_TRAININGS_ROLES do
// separador "Gestão"; ver page.tsx). Mesmo padrão de GestaoView.tsx: lista +
// acções de ciclo de vida + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import {
  Archive,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock,
  Copy,
  Download,
  Pencil,
  Plus,
  Users,
  Wallet,
} from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { formatKz } from '@/lib/format';
import { NAVY_ACTION, NavyBadge } from '@/components/courses/NavyCard';
import { PHOTO_CARD_ACTION, PhotoCard } from '@/components/courses/PhotoCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { PLAN_PERIOD_LABEL, PLAN_STATUS_CFG, PRIORITY_CFG } from '../constants';
import type { TrainingPlan } from '../types';
import { INVERT_ON_HOVER } from '../buttonStyles';
import { PlanFormModal } from './PlanFormModal';
import { PLAN_TONE, PRIORITY_TONE } from './planTones';

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
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const submit = useApiMutation(
    (id: number) => apiClient.patch(`/training-plans/${id}/submit`, {}),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Plano submetido para aprovação.', intent: 'success' }),
      onError: toastError,
    },
  );
  const approve = useApiMutation(
    (id: number) => apiClient.patch(`/training-plans/${id}/approve`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Plano aprovado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const reject = useApiMutation(
    (id: number) => apiClient.patch(`/training-plans/${id}/reject`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Plano rejeitado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const publish = useApiMutation(
    (id: number) => apiClient.patch(`/training-plans/${id}/publish`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Plano publicado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/training-plans/${id}/archive`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Plano arquivado.', intent: 'success' }),
      onError: toastError,
    },
  );
  const duplicate = useApiMutation(
    (id: number) => apiClient.post(`/training-plans/${id}/duplicate`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Plano duplicado.', intent: 'success' }),
      onError: toastError,
    },
  );

  const rowBusy = (id: number) =>
    [submit, approve, reject, publish, archive, duplicate].some(
      (m) => m.isPending && m.variables === id,
    );

  async function onSubmit(p: TrainingPlan) {
    const ok = await confirm({
      title: `Submeter "${p.name}" para aprovação?`,
      confirmLabel: 'Submeter',
    });
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
    const ok = await confirm({
      title: `Arquivar "${p.name}"?`,
      confirmLabel: 'Arquivar',
    });
    if (ok) archive.mutate(p.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className={INVERT_ON_HOVER} onClick={() => setShowCreate(true)}>
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
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const busy = rowBusy(p.id);
            const trainingsCount = p._count?.trainings ?? 0;
            return (
              <PhotoCard
                key={p.id}
                seed={p.id}
                onSelect={() => onOpen(p.id)}
                kicker={p.code ?? `Plano ${p.year}`}
                kickerIcon={ClipboardList}
                title={p.name}
                subtitle={p.description}
                image={p.imageUrl}
                fallback={<ClipboardList size={64} strokeWidth={1.25} />}
                badges={
                  <>
                    <NavyBadge tone={PLAN_TONE[p.status]}>
                      {PLAN_STATUS_CFG[p.status].label}
                    </NavyBadge>
                    <NavyBadge tone={PRIORITY_TONE[p.priority]}>
                      {PRIORITY_CFG[p.priority].label}
                    </NavyBadge>
                  </>
                }
                metrics={[
                  {
                    icon: CalendarDays,
                    text: `${p.year} · ${PLAN_PERIOD_LABEL[p.period] ?? p.period}`,
                  },
                  { icon: BookOpen, text: `Formações: ${trainingsCount}` },
                  {
                    icon: Users,
                    text: `Participantes: ${p.expectedParticipants ?? '—'}`,
                  },
                ]}
                rows={[
                  {
                    icon: Wallet,
                    text:
                      p.plannedBudget != null
                        ? `Orçamento · ${formatKz(p.plannedBudget)}`
                        : 'Orçamento · —',
                  },
                  {
                    icon: Clock,
                    text: `Horas previstas · ${p.expectedHours ?? '—'}`,
                  },
                ]}
                actions={
                  <>
                    {(p.status === 'DRAFT' || p.status === 'REJECTED') && (
                      <Button
                        type="button"
                        intent="onDarkGhost"
                        size="icon"
                        aria-label={`Editar ${p.name}`}
                        title="Editar"
                        disabled={busy}
                        onClick={() => setEditPlan(p)}
                      >
                        <Pencil size={15} strokeWidth={1.75} />
                      </Button>
                    )}
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="icon"
                      aria-label={`Duplicar ${p.name}`}
                      title="Duplicar"
                      disabled={busy}
                      onClick={() => duplicate.mutate(p.id)}
                    >
                      <Copy size={15} strokeWidth={1.75} />
                    </Button>
                    <a
                      href={`/api/training-plans/${p.id}/export`}
                      className={PHOTO_CARD_ACTION}
                      aria-label={`Exportar ${p.name}`}
                      title="Exportar"
                    >
                      <Download size={15} strokeWidth={1.75} />
                    </a>
                    {p.status !== 'ARCHIVED' && (
                      <Button
                        type="button"
                        intent="onDarkGhost"
                        size="icon"
                        aria-label={`Arquivar ${p.name}`}
                        title="Arquivar"
                        disabled={busy}
                        onClick={() => onArchive(p)}
                      >
                        <Archive size={15} strokeWidth={1.75} />
                      </Button>
                    )}
                  </>
                }
                footer={
                  <>
                    {(p.status === 'DRAFT' || p.status === 'REJECTED') && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="md"
                        disabled={busy}
                        onClick={() => onSubmit(p)}
                      >
                        Submeter
                      </Button>
                    )}
                    {isAdminOrRh && p.status === 'SUBMITTED' && (
                      <>
                        <Button
                          type="button"
                          intent="onDark"
                          size="md"
                          disabled={busy}
                          onClick={() => approve.mutate(p.id)}
                        >
                          Aprovar
                        </Button>
                        <button
                          type="button"
                          className={`${NAVY_ACTION} h-9 border border-white/25 px-4 text-sm`}
                          disabled={busy}
                          onClick={() => onReject(p)}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {p.status === 'APPROVED' && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="md"
                        disabled={busy}
                        onClick={() => publish.mutate(p.id)}
                      >
                        Publicar
                      </Button>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <PlanFormModal
          plan={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            toast({ title: 'Plano de formação criado.', intent: 'success' })
          }
        />
      )}
      {editPlan && (
        <PlanFormModal
          plan={editPlan}
          onClose={() => setEditPlan(null)}
          onSuccess={() =>
            toast({
              title: 'Plano de formação actualizado.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
