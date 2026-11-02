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
import {
  BookOpen,
  Building2,
  CalendarCheck,
  CalendarDays,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
  Users,
  Video,
  Wrench,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RESOURCE_STATUS_CFG } from '../trainings/constants';
import { ResourceFormModal } from '../trainings/ResourceFormModal';
import type { TrainingResourceItem } from '../trainings/types';
import { STATUS_CFG } from './constants';
import { tabBtn } from './utils';
import {
  ROW_BTN_ICON,
  ROW_BTN_OUTLINE,
  ROW_BTN_PRIMARY,
  RowCard,
} from './RowCard';
import type { PaginatedMeta, VirtualRoom } from './types';
import { safeHref } from '@/lib/safeHref';

type RoomsTab = 'physical' | 'virtual';

interface ResourcesResponse {
  data: TrainingResourceItem[];
  total: number;
}

export function RoomsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState<RoomsTab>('physical');
  const [editing, setEditing] = useState<TrainingResourceItem | 'new' | null>(
    null,
  );

  const { data, isLoading } = useApiQuery<ResourcesResponse>(
    queryKeys.trainingResources.list({ kind: 'ROOM', limit: 100 }),
    '/training-resources',
    {
      params: { kind: 'ROOM', limit: 100 },
      staleTime: STALE_TIME.DYNAMIC,
      enabled: tab === 'physical' && canManage,
    },
  );
  const rooms = data?.data ?? [];

  const remove = useApiMutation(
    (r: TrainingResourceItem) =>
      apiClient.delete(`/training-resources/${r.id}`),
    {
      invalidateKeys: [queryKeys.trainingResources.all],
      onSuccess: () => toast({ title: 'Sala eliminada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onRemove(r: TrainingResourceItem) {
    const ok = await confirm({
      title: `Eliminar "${r.name}"?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(r);
  }

  const virtualParams = { limit: 50 };
  const { data: virtualData, isLoading: virtualLoading } = useApiQuery<
    PaginatedMeta<VirtualRoom>
  >(
    queryKeys.liveClasses.virtualRooms(virtualParams),
    '/live-classes/virtual-rooms',
    {
      params: virtualParams,
      staleTime: STALE_TIME.DYNAMIC,
      enabled: tab === 'virtual',
    },
  );
  const virtualRooms = virtualData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-control bg-surface-sunken p-1 w-fit">
          <button
            onClick={() => setTab('physical')}
            className={tabBtn(tab === 'physical')}
          >
            Salas
          </button>
          <button
            onClick={() => setTab('virtual')}
            className={tabBtn(tab === 'virtual')}
          >
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
          <EmptyState
            title="Sem salas registadas"
            description="Regista salas físicas para as aulas presenciais/híbridas."
          />
        ) : (
          <div className="flex flex-col gap-4">
            {rooms.map((r) => (
              <RowCard
                key={r.id}
                name={r.location ?? 'Sem localização'}
                icon={Building2}
                title={`${r.name}${r.code ? ` · ${r.code}` : ''}`}
                badge={
                  <StatusBadge value={r.status} map={RESOURCE_STATUS_CFG} />
                }
                infos={[
                  {
                    icon: Users,
                    value: r.capacity != null ? String(r.capacity) : '—',
                    label: 'Capacidade',
                  },
                  {
                    icon: Wrench,
                    value:
                      r.equipment.length > 0 ? r.equipment.join(', ') : '—',
                    label: 'Equipamento',
                  },
                  {
                    icon: CalendarCheck,
                    value: String(r._count?.bookings ?? 0),
                    label: 'Reservas activas',
                  },
                ]}
                actions={
                  <>
                    <button
                      type="button"
                      className={ROW_BTN_OUTLINE}
                      onClick={() => setEditing(r)}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                      Editar
                    </button>
                    <button
                      type="button"
                      className={ROW_BTN_ICON}
                      aria-label="Eliminar sala"
                      title="Eliminar sala"
                      disabled={
                        remove.isPending && remove.variables?.id === r.id
                      }
                      onClick={() => onRemove(r)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </button>
                  </>
                }
              />
            ))}
          </div>
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
          <div className="flex flex-col gap-4">
            {virtualRooms.map((v) => (
              <RowCard
                key={v.liveClassId}
                name={v.instructor?.name ?? 'Sem formador'}
                icon={Video}
                title={v.topic}
                subtitle={`${v.platform}${v.meetingId ? ` · ID ${v.meetingId}` : ''}`}
                badge={
                  <span
                    className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[v.status]?.cls ?? ''}`}
                  >
                    {STATUS_CFG[v.status]?.label ?? v.status}
                  </span>
                }
                infos={[
                  {
                    icon: BookOpen,
                    value: v.course?.title ?? '—',
                    label: 'Curso',
                  },
                  {
                    icon: CalendarDays,
                    value: formatDateTime(v.scheduledAt),
                    label: 'Data',
                  },
                ]}
                actions={
                  v.link && (
                    <a
                      href={safeHref(v.link)}
                      target="_blank"
                      rel="noreferrer"
                      className={ROW_BTN_PRIMARY}
                    >
                      Abrir <ExternalLink size={14} strokeWidth={1.75} />
                    </a>
                  )
                }
              />
            ))}
          </div>
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
