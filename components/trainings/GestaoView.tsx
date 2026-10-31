// components/trainings/GestaoView.tsx
// Separador "Gestão" — só visível a ADMIN/RH/GESTOR/INSTRUCTOR/DIRECTOR/
// LIDER (ver CAN_MANAGE_TRAININGS_ROLES em constants.ts; a autorização real
// é sempre feita no backend via GET /trainings/manage, que já devolve só as
// formações que o utilizador pode gerir — ADMIN/RH vêem todas, os restantes
// só as que criaram). Mesmo padrão de components/courses/GestaoView.tsx:
// lista + acções de ciclo de vida + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Archive, Pencil, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { NAVY_ACTION } from '@/components/courses/NavyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { INVERT_ON_HOVER } from './buttonStyles';
import { TrainingCard } from './TrainingCard';
import type { Training } from './types';

const TrainingFormModal = dynamic(() =>
  import('./TrainingFormModal').then((m) => m.TrainingFormModal),
);

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
  const toastError = (e: Error) =>
    toast({ title: e.message, intent: 'danger' });

  const publish = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/publish`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação publicada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const archive = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/archive`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação arquivada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/trainings/${id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação eliminada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const cancelTraining = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/cancel`, {}),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação cancelada.', intent: 'success' }),
      onError: toastError,
    },
  );
  const complete = useApiMutation(
    (id: number) => apiClient.patch(`/trainings/${id}/complete`, {}),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formação concluída.', intent: 'success' }),
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
    const ok = await confirm({
      title: `Arquivar "${t.title}"?`,
      confirmLabel: 'Arquivar',
    });
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
    const ok = await confirm({
      title: `Concluir "${t.title}"?`,
      confirmLabel: 'Concluir',
    });
    if (ok) complete.mutate(t.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className={INVERT_ON_HOVER} onClick={() => setShowCreate(true)}>
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
        <div className="grid grid-cols-3 gap-4">
          {list.map((t) => {
            const busy = rowBusy(t.id);
            const closed =
              t.status === 'ARCHIVED' ||
              t.status === 'CANCELLED' ||
              t.status === 'COMPLETED';
            return (
              <TrainingCard
                key={t.id}
                training={t}
                showStatus
                onClick={() => onManage(t.id)}
                actions={
                  <>
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="sm"
                      aria-label={`Editar ${t.title}`}
                      title="Editar"
                      disabled={busy}
                      onClick={() => setEditTraining(t)}
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Button>
                    {!closed && (
                      <Button
                        type="button"
                        intent="onDarkGhost"
                        size="sm"
                        aria-label={`Arquivar ${t.title}`}
                        title="Arquivar"
                        disabled={busy}
                        onClick={() => onArchive(t)}
                      >
                        <Archive size={15} strokeWidth={1.75} />
                      </Button>
                    )}
                    <button
                      type="button"
                      className={`${NAVY_ACTION} hover:!bg-red-500 hover:!text-white`}
                      aria-label={`Eliminar ${t.title}`}
                      title="Eliminar"
                      disabled={busy}
                      onClick={() => onDelete(t)}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </>
                }
                footer={
                  <>
                    <Button
                      type="button"
                      intent="onDark"
                      size="md"
                      onClick={() => onManage(t.id)}
                    >
                      Gerir
                    </Button>
                    {t.status === 'DRAFT' && (
                      <Button
                        type="button"
                        intent="onDark"
                        size="md"
                        disabled={busy}
                        onClick={() => publish.mutate(t.id)}
                      >
                        Publicar
                      </Button>
                    )}
                    {t.status === 'PUBLISHED' && (
                      <>
                        <Button
                          type="button"
                          intent="onDark"
                          size="md"
                          disabled={busy}
                          onClick={() => onComplete(t)}
                        >
                          Concluir
                        </Button>
                        <button
                          type="button"
                          className={`${NAVY_ACTION} h-9 border border-white/25 px-4 text-sm`}
                          disabled={busy}
                          onClick={() => onCancel(t)}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </>
                }
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <TrainingFormModal
          training={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            toast({ title: 'Formação criada.', intent: 'success' })
          }
        />
      )}
      {editTraining && (
        <TrainingFormModal
          training={editTraining}
          onClose={() => setEditTraining(null)}
          onSuccess={() =>
            toast({ title: 'Formação actualizada.', intent: 'success' })
          }
        />
      )}
    </div>
  );
}
