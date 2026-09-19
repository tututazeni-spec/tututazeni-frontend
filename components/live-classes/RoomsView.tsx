// components/live-classes/RoomsView.tsx
// Separador "Salas & Links" (docs/aulas-ao-vivo.md secção 8) — duas partes:
// "Salas" (gestão operacional: sala/local/capacidade/equipamentos/estado)
// reutiliza directamente o registo de TrainingResource (kind=ROOM) e o
// ResourceFormModal já existentes no módulo Trainings (mesma sala física
// serve formações presenciais e aulas ao vivo — não faz sentido um segundo
// registo); "Salas virtuais" é derivado só de leitura a partir de
// LiveClass/LiveClassSession (Zoom/link de reunião), que já vivem lá — ver
// live-classes.service.ts#listVirtualRooms.

'use client';

import { useState } from 'react';
import { ExternalLink, Plus, Trash2, Video } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RESOURCE_STATUS_CFG } from '../trainings/constants';
import { ResourceFormModal } from '../trainings/ResourceFormModal';
import type { TrainingResourceItem } from '../trainings/types';
import { STATUS_CFG } from './constants';
import { tabBtn } from './utils';
import type { PaginatedMeta, VirtualRoom } from './types';

type RoomsTab = 'physical' | 'virtual';

interface ResourcesResponse {
  data: TrainingResourceItem[];
  total: number;
}

export function RoomsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<RoomsTab>('physical');
  const [editing, setEditing] = useState<TrainingResourceItem | 'new' | null>(null);

  const { data, isLoading } = useApiQuery<ResourcesResponse>(
    queryKeys.trainingResources.list({ kind: 'ROOM', limit: 100 }),
    '/training-resources',
    { params: { kind: 'ROOM', limit: 100 }, staleTime: STALE_TIME.DYNAMIC, enabled: tab === 'physical' && canManage },
  );
  const rooms = data?.data ?? [];

  const remove = useApiMutation(
    (r: TrainingResourceItem) => apiClient.delete(`/training-resources/${r.id}`),
    {
      invalidateKeys: [queryKeys.trainingResources.all],
      onSuccess: () => toast({ title: 'Sala eliminada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(r: TrainingResourceItem) {
    const ok = await confirm({ title: `Eliminar "${r.name}"?`, confirmLabel: 'Eliminar', destructive: true });
    if (ok) remove.mutate(r);
  }

  const virtualParams = { limit: 50 };
  const { data: virtualData, isLoading: virtualLoading } = useApiQuery<PaginatedMeta<VirtualRoom>>(
    queryKeys.liveClasses.virtualRooms(virtualParams),
    '/live-classes/virtual-rooms',
    { params: virtualParams, staleTime: STALE_TIME.DYNAMIC, enabled: tab === 'virtual' },
  );
  const virtualRooms = virtualData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-surface-sunken p-1 w-fit">
          <button onClick={() => setTab('physical')} className={tabBtn(tab === 'physical')}>
            Salas
          </button>
          <button onClick={() => setTab('virtual')} className={tabBtn(tab === 'virtual')}>
            Salas virtuais
          </button>
        </div>
        {tab === 'physical' && canManage && (
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus size={14} strokeWidth={1.75} />
            Nova sala
          </Button>
        )}
      </div>

      {tab === 'physical' &&
        (!canManage ? (
          <EmptyState
            title="Sem acesso"
            description="A gestão de salas é feita pela administração/RH, no módulo Trainings → Recursos & Logística."
          />
        ) : isLoading ? (
          <Skeleton rows={4} />
        ) : rooms.length === 0 ? (
          <EmptyState title="Sem salas registadas" description="Regista salas físicas para as aulas presenciais/híbridas." />
        ) : (
          <Card className="divide-y divide-border">
            {rooms.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">
                    {r.name}
                    {r.code ? ` · ${r.code}` : ''}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                    <span>{r.location ?? 'Sem localização'}</span>
                    {r.capacity != null && <span>· Capacidade {r.capacity}</span>}
                    {r.equipment.length > 0 && <span>· {r.equipment.join(', ')}</span>}
                    <span>· {r._count?.bookings ?? 0} reserva(s) activa(s)</span>
                  </div>
                </div>
                <StatusBadge value={r.status} map={RESOURCE_STATUS_CFG} />
                <div className="flex gap-2">
                  <Button intent="ghost" size="sm" onClick={() => setEditing(r)}>
                    Editar
                  </Button>
                  <Button
                    intent="danger"
                    size="sm"
                    onClick={() => onRemove(r)}
                    loading={remove.isPending && remove.variables?.id === r.id}
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        ))}

      {tab === 'virtual' &&
        (virtualLoading ? (
          <Skeleton rows={4} />
        ) : virtualRooms.length === 0 ? (
          <EmptyState
            title="Sem salas virtuais"
            description="As salas virtuais aparecem aqui para aulas online/híbridas com Zoom ou link de reunião configurado."
          />
        ) : (
          <Card className="divide-y divide-border">
            {virtualRooms.map((v) => (
              <div key={v.liveClassId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-control bg-info-subtle text-info">
                  <Video size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink">{v.topic}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 font-body text-xs text-ink-faint">
                    <span>{v.platform}</span>
                    {v.meetingId && <span>· ID {v.meetingId}</span>}
                    <span>· {v.course?.title ?? '—'}</span>
                    <span>· {v.instructor?.name ?? 'Sem formador'}</span>
                    <span>· {formatDateTime(v.scheduledAt)}</span>
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[v.status]?.cls ?? ''}`}>
                  {STATUS_CFG[v.status]?.label ?? v.status}
                </span>
                {v.link && (
                  <a
                    href={v.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-body text-xs text-accent"
                  >
                    Abrir <ExternalLink size={12} strokeWidth={1.75} />
                  </a>
                )}
              </div>
            ))}
          </Card>
        ))}

      {editing && (
        <ResourceFormModal
          resource={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSuccess={() => setEditing(null)}
        />
      )}
    </div>
  );
}
