// components/trainings/TrainersView.tsx
// Separador "Formadores" (docs/trainings-detalhado.md pt.7) — registo de
// formadores internos e externos, distinto do catálogo de Users. Mesmo
// padrão de plans/PlansView.tsx: lista + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { TRAINER_STATUS_CFG, TRAINER_TYPE_LABEL } from './constants';
import type { Trainer } from './types';
import { TrainerFormModal } from './TrainerFormModal';

interface TrainersResponse {
  data: Trainer[];
  total: number;
}

export function TrainersView() {
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editTrainer, setEditTrainer] = useState<Trainer | null>(null);

  const { data, isLoading } = useApiQuery<TrainersResponse>(
    queryKeys.trainingTrainers.list({ limit: 100 }),
    '/training-trainers',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainingTrainers.all];
  const remove = useApiMutation((id: number) => apiClient.delete(`/training-trainers/${id}`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Formador eliminado.', intent: 'success' }),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });

  async function onRemove(t: Trainer) {
    const ok = await confirm({
      title: `Eliminar "${t.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(t.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Novo formador
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sem formadores registados"
          description="Regista formadores internos ou externos para os atribuir a formações e turmas."
        />
      ) : (
        <Card className="divide-y divide-border">
          {list.map((t) => {
            const statusCfg = TRAINER_STATUS_CFG[t.status];
            return (
              <div key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <Avatar name={t.name} url={t.user?.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{t.name}</div>
                  <div className="text-xs text-ink-faint">
                    {TRAINER_TYPE_LABEL[t.type]}
                    {t.entity ? ` · ${t.entity}` : ''}
                    {t.trainingAreas.length > 0 ? ` · ${t.trainingAreas.join(', ')}` : ''}
                  </div>
                </div>
                <span className={`flex-shrink-0 rounded px-2 py-0.5 font-body text-xs font-medium ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <Button intent="ghost" size="sm" onClick={() => setEditTrainer(t)}>
                    Editar
                  </Button>
                  <Button
                    intent="danger"
                    size="sm"
                    onClick={() => onRemove(t)}
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
        <TrainerFormModal
          trainer={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() => toast({ title: 'Formador criado.', intent: 'success' })}
        />
      )}
      {editTrainer && (
        <TrainerFormModal
          trainer={editTrainer}
          onClose={() => setEditTrainer(null)}
          onSuccess={() => toast({ title: 'Formador actualizado.', intent: 'success' })}
        />
      )}
    </div>
  );
}
