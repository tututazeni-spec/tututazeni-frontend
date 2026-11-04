// components/trainings/ResourcesView.tsx
// Separador "Recursos & Logística" (docs/trainings-detalhado.md pt.8) —
// salas e recursos/equipamento (um único modelo, TrainingResource.kind — ver
// schema.prisma), com reservas activas por turma/sessão.

'use client';

import { useState } from 'react';
import {
  Boxes,
  CalendarClock,
  MapPin,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { INVERT_ON_HOVER } from './buttonStyles';
import { RESOURCE_KIND_LABEL, RESOURCE_STATUS_CFG } from './constants';
import type { TrainingResourceItem } from './types';
import { ResourceDetailModal } from './ResourceDetailModal';
import { ResourceFormModal } from './ResourceFormModal';

interface ResourcesResponse {
  data: TrainingResourceItem[];
  total: number;
}

export function ResourcesView() {
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editResource, setEditResource] = useState<TrainingResourceItem | null>(
    null,
  );
  const [viewResource, setViewResource] = useState<TrainingResourceItem | null>(
    null,
  );

  const { data, isLoading } = useApiQuery<ResourcesResponse>(
    queryKeys.trainingResources.list({ limit: 100 }),
    '/training-resources',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainingResources.all];
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/training-resources/${id}`),
    {
      invalidateKeys,
      onSuccess: () =>
        toast({ title: 'Recurso eliminado.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(r: TrainingResourceItem) {
    const ok = await confirm({
      title: `Eliminar "${r.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(r.id);
  }

  if (isLoading) return <Skeleton rows={3} />;

  const list = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className={INVERT_ON_HOVER} onClick={() => setShowCreate(true)}>
          <Plus size={14} strokeWidth={1.75} />
          Nova sala / recurso
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="Sem salas ou recursos"
          description="Regista salas, equipamento e outros recursos para os reservar em turmas e sessões."
        />
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const active = r.status === 'AVAILABLE';
            const deleting = remove.isPending && remove.variables === r.id;
            const meta = [
              { icon: Tag, text: RESOURCE_KIND_LABEL[r.kind] },
              r.location ? { icon: MapPin, text: r.location } : null,
              r.capacity
                ? { icon: Users, text: `Capacidade: ${r.capacity}` }
                : null,
              r.kind !== 'ROOM'
                ? { icon: Boxes, text: `Qtd: ${r.quantity}` }
                : null,
              r._count
                ? {
                    icon: CalendarClock,
                    text: `${r._count.bookings} reserva(s) activa(s)`,
                  }
                : null,
            ].filter((m): m is { icon: LucideIcon; text: string } => !!m);
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewResource(r)}
                onKeyDown={(e) => {
                  if (e.target === e.currentTarget && e.key === 'Enter')
                    setViewResource(r);
                }}
                className="flex cursor-pointer flex-wrap items-center gap-4 rounded-2xl bg-[var(--color-brand-ink)] px-4 py-3 text-white shadow-sm transition-opacity hover:opacity-95"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white text-[var(--color-brand-ink)]">
                  {r.kind === 'ROOM' ? (
                    <MapPin size={22} strokeWidth={1.75} />
                  ) : (
                    <Boxes size={22} strokeWidth={1.75} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-semibold">
                      {r.name}
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
                      {RESOURCE_STATUS_CFG[r.status].label}
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
                    aria-label={`Editar ${r.name}`}
                    onClick={() => setEditResource(r)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white transition-colors hover:bg-white hover:text-[var(--color-brand-ink)]"
                  >
                    <Pencil size={16} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Eliminar ${r.name}`}
                    disabled={deleting}
                    onClick={() => onRemove(r)}
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
        <ResourceFormModal
          resource={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            toast({ title: 'Recurso criado.', intent: 'success' })
          }
        />
      )}
      {viewResource && (
        <ResourceDetailModal
          resource={viewResource}
          onClose={() => setViewResource(null)}
          onEdit={(r) => {
            setViewResource(null);
            setEditResource(r);
          }}
        />
      )}
      {editResource && (
        <ResourceFormModal
          resource={editResource}
          onClose={() => setEditResource(null)}
          onSuccess={() =>
            toast({ title: 'Recurso actualizado.', intent: 'success' })
          }
        />
      )}
    </div>
  );
}
