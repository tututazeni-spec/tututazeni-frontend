// components/trainings/GestaoView.tsx
// Separador "Gestão" — só visível a ADMIN/RH/GESTOR/INSTRUCTOR/DIRECTOR/
// LIDER (ver CAN_MANAGE_TRAININGS_ROLES em constants.ts; a autorização real
// é sempre feita no backend via GET /trainings/manage, que já devolve só as
// formações que o utilizador pode gerir — ADMIN/RH vêem todas, os restantes
// só as que criaram). Mesmo padrão de components/courses/GestaoView.tsx:
// lista + acções de ciclo de vida + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TrainingFormModal } from './TrainingFormModal';
import { STATUS_CFG, TYPE_CFG } from './constants';
import type { Training } from './types';

interface ManageResponse {
  data: Training[];
  total: number;
}

interface GestaoViewProps {
  onManage: (id: number) => void;
}

export function GestaoView({ onManage }: GestaoViewProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editTraining, setEditTraining] = useState<Training | null>(null);

  const { data, isLoading } = useApiQuery<ManageResponse>(
    queryKeys.trainings.manage({ limit: 100 }),
    '/trainings/manage',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainings.all];
  const toastError = (e: Error) => toast({ title: e.message, intent: 'danger' });

  const publish = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/publish`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação publicada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/archive`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação arquivada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/trainings/${id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação eliminada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const cancelTraining = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/cancel`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação cancelada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const complete = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/complete`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Formação concluída.', intent: 'success' }),
      onError: toastError,
    },
  );

  const rowBusy = (id: number) =>
    (publish.isPending && publish.variables === id) ||
    (archive.isPending && archive.variables === id) ||
    (remove.isPending && remove.variables === id) ||
    (cancelTraining.isPending && cancelTraining.variables === id) ||
    (complete.isPending && complete.variables === id);

  async function onDelete(t: Training) {
    const ok = await confirm({
      title: `Eliminar "${t.title}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(t.id);
  }

  async function onArchive(t: Training) {
    const ok = await confirm({ title: `Arquivar "${t.title}"?`, confirmLabel: 'Arquivar' });
    if (ok) archive.mutate(t.id);
  }

  async function onCancel(t: Training) {
    const ok = await confirm({
      title: `Cancelar "${t.title}"?`,
      confirmLabel: 'Cancelar formação',
      destructive: true,
    });
    if (ok) cancelTraining.mutate(t.id);
  }

  async function onComplete(t: Training) {
    const ok = await confirm({ title: `Concluir "${t.title}"?`, confirmLabel: 'Concluir' });
    if (ok) complete.mutate(t.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Nova Formação
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sem formações"
          description="As formações que crias (ou, se fores ADMIN/RH, todas as formações) aparecem aqui."
        />
      ) : (
        <Card className="divide-y divide-border">
          {list.map((t) => {
            const statusCfg = STATUS_CFG[t.status];
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onManage(t.id)}
                >
                  <div className="truncate text-sm font-medium text-ink">{t.title}</div>
                  <div className="text-xs text-ink-faint">
                    {t.code ? `${t.code} · ` : ''}
                    {TYPE_CFG[t.type]?.label}
                    {t.category ? ` · ${t.category}` : ''}
                    {t.createdBy ? ` · criado por ${t.createdBy.fullName}` : ''}
                  </div>
                </button>
                <span
                  className={`flex-shrink-0 rounded px-2 py-0.5 font-body text-xs font-medium ${statusCfg.cls}`}
                >
                  {statusCfg.label}
                </span>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button intent="ghost" size="sm" onClick={() => onManage(t.id)}>
                    Gerir
                  </Button>
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => setEditTraining(t)}
                    disabled={rowBusy(t.id)}
                  >
                    Editar
                  </Button>
                  {t.status !== 'ARCHIVED' && t.status !== 'CANCELLED' && t.status !== 'COMPLETED' && (
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => onArchive(t)}
                      disabled={rowBusy(t.id)}
                    >
                      Arquivar
                    </Button>
                  )}
                  {t.status === 'DRAFT' && (
                    <Button
                      intent="success"
                      size="sm"
                      onClick={() => publish.mutate(t.id)}
                      disabled={rowBusy(t.id)}
                      loading={publish.isPending && publish.variables === t.id}
                    >
                      Publicar
                    </Button>
                  )}
                  {t.status === 'PUBLISHED' && (
                    <>
                      <Button
                        intent="ghost"
                        size="sm"
                        onClick={() => onComplete(t)}
                        disabled={rowBusy(t.id)}
                        loading={complete.isPending && complete.variables === t.id}
                      >
                        Concluir
                      </Button>
                      <Button
                        intent="danger"
                        size="sm"
                        onClick={() => onCancel(t)}
                        disabled={rowBusy(t.id)}
                        loading={cancelTraining.isPending && cancelTraining.variables === t.id}
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                  <Button
                    intent="danger"
                    size="sm"
                    onClick={() => onDelete(t)}
                    disabled={rowBusy(t.id)}
                    loading={remove.isPending && remove.variables === t.id}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {showCreate && (
        <TrainingFormModal
          training={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() => toast({ title: 'Formação criada.', intent: 'success' })}
        />
      )}
      {editTraining && (
        <TrainingFormModal
          training={editTraining}
          onClose={() => setEditTraining(null)}
          onSuccess={() => toast({ title: 'Formação actualizada.', intent: 'success' })}
        />
      )}
    </div>
  );
}
