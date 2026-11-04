// components/trainings/TrainersView.tsx
// Separador "Formadores" (docs/trainings-detalhado.md pt.7) — registo de
// formadores internos e externos, distinto do catálogo de Users. Mesmo
// padrão de plans/PlansView.tsx: lista + modal de criação/edição partilhado.

'use client';

import { useState } from 'react';
import {
  Building2,
  Mail,
  Pencil,
  Plus,
  Tag,
  Trash2,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { INVERT_ON_HOVER } from './buttonStyles';
import { TRAINER_STATUS_CFG, TRAINER_TYPE_LABEL } from './constants';
import type { Trainer } from './types';
import { TrainerDetailModal } from './TrainerDetailModal';
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
  const [viewTrainer, setViewTrainer] = useState<Trainer | null>(null);

  const { data, isLoading } = useApiQuery<TrainersResponse>(
    queryKeys.trainingTrainers.list({ limit: 100 }),
    '/training-trainers',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainingTrainers.all];
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/training-trainers/${id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Formador eliminado.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

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
        <Button className={INVERT_ON_HOVER} onClick={() => setShowCreate(true)}>
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
        <div className="space-y-3">
          {list.map((t) => {
            const active = t.status === 'ACTIVE';
            const deleting = remove.isPending && remove.variables === t.id;
            const meta = [
              { icon: UserCog, text: TRAINER_TYPE_LABEL[t.type] },
              t.entity ? { icon: Building2, text: t.entity } : null,
              t.trainingAreas.length > 0
                ? { icon: Tag, text: t.trainingAreas.join(', ') }
                : null,
              t.email ? { icon: Mail, text: t.email } : null,
            ].filter((m): m is { icon: LucideIcon; text: string } => !!m);
            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewTrainer(t)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && e.key === 'Enter')
                    setViewTrainer(t);
                }}
                className="flex cursor-pointer flex-wrap items-center gap-4 rounded-2xl bg-[var(--color-brand-ink)] px-4 py-3 text-white shadow-sm transition-opacity hover:opacity-95"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  <Avatar
                    name={t.name}
                    url={t.user?.avatarUrl ?? undefined}
                    size="sm"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-semibold">
                      {t.name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-medium ${
                        active
                          ? 'bg-teal-500/80 text-white'
                          : 'bg-white/15 text-white'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          active ? 'bg-emerald-300' : 'bg-white/60'
                        }`}
                      />
                      {TRAINER_STATUS_CFG[t.status].label}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center text-sm text-white/85">
                    {meta.map((m, i) => (
                      <span
                        key={m.text}
                        className={`inline-flex items-center gap-1.5 ${
                          i > 0 ? 'ml-3 border-l border-white/25 pl-3' : ''
                        }`}
                      >
                        <m.icon size={14} strokeWidth={1.75} />
                        {m.text}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className="flex flex-shrink-0 items-center gap-2 border-l border-white/25 pl-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    aria-label={`Editar ${t.name}`}
                    onClick={() => setEditTrainer(t)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[var(--color-brand-ink)]"
                  >
                    <Pencil size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${t.name}`}
                    disabled={deleting}
                    onClick={() => onRemove(t)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[var(--color-brand-ink)] disabled:opacity-50"
                  >
                    <Trash2 size={16} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <TrainerFormModal
          trainer={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            toast({ title: 'Formador criado.', intent: 'success' })
          }
        />
      )}
      {viewTrainer && (
        <TrainerDetailModal
          trainer={viewTrainer}
          onClose={() => setViewTrainer(null)}
          onEdit={(t) => {
            setViewTrainer(null);
            setEditTrainer(t);
          }}
        />
      )}
      {editTrainer && (
        <TrainerFormModal
          trainer={editTrainer}
          onClose={() => setEditTrainer(null)}
          onSuccess={() =>
            toast({ title: 'Formador actualizado.', intent: 'success' })
          }
        />
      )}
    </div>
  );
}
