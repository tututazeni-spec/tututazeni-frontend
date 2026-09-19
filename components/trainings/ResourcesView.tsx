// components/trainings/ResourcesView.tsx
// Separador "Recursos & Logística" (docs/trainings-detalhado.md pt.8) —
// salas e recursos/equipamento (um único modelo, TrainingResource.kind — ver
// schema.prisma), com reservas activas por turma/sessão.

'use client';

import { useState } from 'react';
import { Plus, Unlock } from 'lucide-react';
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
import { RESOURCE_KIND_LABEL, RESOURCE_STATUS_CFG } from './constants';
import { fmtDate } from './utils';
import type { TrainingResourceItem } from './types';
import { ResourceFormModal } from './ResourceFormModal';

interface ResourcesResponse {
  data: TrainingResourceItem[];
  total: number;
}

export function ResourcesView() {
  const confirm = useConfirm();
  const toast = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [editResource, setEditResource] = useState<TrainingResourceItem | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data, isLoading } = useApiQuery<ResourcesResponse>(
    queryKeys.trainingResources.list({ limit: 100 }),
    '/training-resources',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: detail } = useApiQuery<TrainingResourceItem>(
    ['training-resources', 'detail', expanded],
    `/training-resources/${expanded}`,
    { enabled: !!expanded, staleTime: STALE_TIME.DYNAMIC },
  );

  const invalidateKeys = [queryKeys.trainingResources.all];
  const remove = useApiMutation((id: number) => apiClient.delete(`/training-resources/${id}`), {
    invalidateKeys,
    onSuccess: () => toast({ title: 'Recurso eliminado.', intent: 'success' }),
    onError: (e) => toast({ title: e.message, intent: 'danger' }),
  });
  const release = useApiMutation(
    (bookingId: number) => apiClient.post(`/training-resources/bookings/${bookingId}/release`, {}),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Recurso libertado.', intent: 'success' }),
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
        <Button onClick={() => setShowCreate(true)}>
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
        <Card className="divide-y divide-border">
          {list.map((r) => {
            const statusCfg = RESOURCE_STATUS_CFG[r.status];
            const isOpen = expanded === r.id;
            return (
              <div key={r.id}>
                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                  >
                    <div className="truncate text-sm font-medium text-ink">{r.name}</div>
                    <div className="text-xs text-ink-faint">
                      {RESOURCE_KIND_LABEL[r.kind]}
                      {r.location ? ` · ${r.location}` : ''}
                      {r.capacity ? ` · Capacidade: ${r.capacity}` : ''}
                      {r.kind !== 'ROOM' ? ` · Qtd: ${r.quantity}` : ''}
                      {r._count ? ` · ${r._count.bookings} reserva(s) activa(s)` : ''}
                    </div>
                  </button>
                  <span className={`flex-shrink-0 rounded px-2 py-0.5 font-body text-xs font-medium ${statusCfg.cls}`}>
                    {statusCfg.label}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    <Button intent="ghost" size="sm" onClick={() => setEditResource(r)}>
                      Editar
                    </Button>
                    <Button
                      intent="danger"
                      size="sm"
                      onClick={() => onRemove(r)}
                      loading={remove.isPending && remove.variables === r.id}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div className="bg-surface-sunken px-4 py-3">
                    <div className="mb-2 font-body text-xs font-semibold text-ink-muted">
                      Reservas activas
                    </div>
                    {(detail?.bookings ?? []).length === 0 ? (
                      <p className="text-xs text-ink-faint">Sem reservas activas.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {(detail?.bookings ?? []).map((b) => (
                          <div key={b.id} className="flex items-center justify-between gap-3 text-xs">
                            <span className="text-ink-muted">
                              {b.training?.title ?? `Sessão #${b.sessionId}`} — {fmtDate(b.startAt)}
                              {' – '}
                              {fmtDate(b.endAt)}
                            </span>
                            <Button
                              intent="ghost"
                              size="sm"
                              onClick={() => release.mutate(b.id)}
                              loading={release.isPending && release.variables === b.id}
                            >
                              <Unlock size={12} strokeWidth={1.75} />
                              Libertar
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {showCreate && (
        <ResourceFormModal
          resource={null}
          onClose={() => setShowCreate(false)}
          onSuccess={() => toast({ title: 'Recurso criado.', intent: 'success' })}
        />
      )}
      {editResource && (
        <ResourceFormModal
          resource={editResource}
          onClose={() => setEditResource(null)}
          onSuccess={() => toast({ title: 'Recurso actualizado.', intent: 'success' })}
        />
      )}
    </div>
  );
}
