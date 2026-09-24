// components/events/EventsTab.tsx
// Separador "Eventos" (docs/events.md ponto 2) — lista, filtra e gere os
// eventos do módulo. GET /events (sem @Roles — omitir "Estado" mostra o
// default do backend: publicados + ao vivo; qualquer estado específico,
// incl. Rascunho/Cancelado/Encerrado, pode ser escolhido no filtro).
// Acções de gestão (Publicar/Cancelar/Eliminar) espelham exactamente os
// @Roles de src/events/events.controller.ts: publish/update = ADMIN/RH/
// GESTOR, cancel/remove = ADMIN/RH. Clicar numa linha abre o DetailView
// já existente (join/leave/checkin/feedback) — o "Novo Evento"
// (CreateEventModal) não é tocado por esta aba.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { MoreVertical } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Role } from '@/lib/roles';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MODALITY_CFG, STATUS_CFG, TYPE_CFG } from './constants';
import { DetailView } from './DetailView';
import { useDepartmentOptions, useUnitOptions } from './eventFormData';
import type { Event } from './types';

interface Paginated {
  data: Event[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const PUBLISH_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];
const MODERATE_ROLES: readonly Role[] = ['ADMIN', 'RH'];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Publicados e ao vivo (padrão)' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  ...Object.entries(MODALITY_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function EventsTab() {
  const role = useCurrentRole();
  const canPublish = !!role && PUBLISH_ROLES.includes(role);
  const canModerate = !!role && MODERATE_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState({
    type: 'ALL',
    status: 'ALL',
    modalidade: 'ALL',
    departmentId: 'ALL',
    unitId: 'ALL',
    page: 1,
  });
  const [detailId, setDetailId] = useState<number | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch || undefined,
    type: filters.type === 'ALL' ? undefined : filters.type,
    status: filters.status === 'ALL' ? undefined : filters.status,
    modalidade: filters.modalidade === 'ALL' ? undefined : filters.modalidade,
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated>(
    queryKeys.events.list(params),
    '/events',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );

  const publishMutation = useApiMutation<unknown, number>(
    (id) => apiClient.patch(`/events/${id}/publish`, {}),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => notify({ title: 'Evento publicado', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const cancelMutation = useApiMutation<unknown, number>(
    (id) => apiClient.patch(`/events/${id}/cancel`, {}),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => notify({ title: 'Evento cancelado e participantes notificados', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const deleteMutation = useApiMutation<unknown, number>(
    (id) => apiClient.delete(`/events/${id}`),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => notify({ title: 'Evento eliminado', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  async function handleCancel(id: number, title: string) {
    if (
      await confirm({
        title: `Cancelar "${title}"?`,
        message: 'Os participantes inscritos são notificados automaticamente.',
        confirmLabel: 'Cancelar evento',
        destructive: true,
      })
    )
      cancelMutation.mutate(id);
  }

  async function handleDelete(id: number, title: string) {
    if (
      await confirm({
        title: `Eliminar "${title}"?`,
        message: 'Esta acção não pode ser desfeita.',
        confirmLabel: 'Eliminar',
        destructive: true,
      })
    )
      deleteMutation.mutate(id);
  }

  if (detailId !== null) {
    return <DetailView eventId={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Input
          placeholder="Pesquisar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select items={TYPE_ITEMS} value={filters.type} onValueChange={(v) => updateFilters({ type: v })} />
        <Select items={STATUS_ITEMS} value={filters.status} onValueChange={(v) => updateFilters({ status: v })} />
        <Select items={MODALITY_ITEMS} value={filters.modalidade} onValueChange={(v) => updateFilters({ modalidade: v })} />
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={filters.departmentId}
          onValueChange={(v) => updateFilters({ departmentId: v })}
        />
        <Select
          items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
          value={filters.unitId}
          onValueChange={(v) => updateFilters({ unitId: v })}
        />
        <span className="ml-auto font-body text-sm text-ink-faint">{data?.meta.total ?? 0} eventos</span>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Sem eventos" description="Nenhum evento corresponde aos filtros." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((e) => {
            const typeCfg = TYPE_CFG[e.type] ?? TYPE_CFG.CORPORATE;
            const TypeIcon = typeCfg.icon;
            const isPublishing = publishMutation.isPending && publishMutation.variables === e.id;
            const isCancelling = cancelMutation.isPending && cancelMutation.variables === e.id;
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === e.id;
            const showActions =
              (canPublish && e.status === 'DRAFT') ||
              (canModerate && (e.status === 'PUBLISHED' || e.status === 'LIVE')) ||
              (canModerate && e.status === 'DRAFT');

            return (
              <div
                key={e.id}
                className="flex w-full items-center gap-3 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
              >
                <button
                  type="button"
                  onClick={() => setDetailId(e.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 font-body text-xs ${typeCfg.cls}`}>
                    <TypeIcon size={12} strokeWidth={1.75} /> {typeCfg.label}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm font-medium text-ink">
                      {e.title}
                      {e.code && <span className="ml-1.5 font-mono text-xs text-ink-faint">#{e.code}</span>}
                    </div>
                    <div className="truncate font-body text-xs text-ink-faint">
                      {e.organizer.fullName}
                      {e.department && ` · ${e.department.name}`}
                      {e.unit && ` · ${e.unit.name}`}
                      {' · '}
                      {e.location ?? (e.modalidade === 'ONLINE' ? 'Online' : '—')}
                    </div>
                  </div>
                </button>

                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <Avatar name={e.organizer.fullName} url={e.organizer.avatarUrl ?? undefined} size="sm" />
                </div>

                <div className="shrink-0 font-body text-xs text-ink-faint">{fmtDate(e.startAt)}</div>

                <div className="w-24 shrink-0 text-right font-mono text-xs text-ink-faint">
                  {e.confirmedCount ?? 0}/{e._count.participants} · {e.maxCapacity}
                </div>

                <StatusBadge value={e.status} map={STATUS_CFG} />

                {showActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Acções do evento"
                        className="shrink-0 rounded-control p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                      >
                        <MoreVertical size={16} strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canPublish && e.status === 'DRAFT' && (
                        <DropdownMenuItem
                          disabled={isPublishing}
                          onSelect={() => publishMutation.mutate(e.id)}
                        >
                          {isPublishing ? 'A publicar…' : 'Publicar'}
                        </DropdownMenuItem>
                      )}
                      {canModerate && (e.status === 'PUBLISHED' || e.status === 'LIVE') && (
                        <DropdownMenuItem
                          disabled={isCancelling}
                          onSelect={() => handleCancel(e.id, e.title)}
                        >
                          {isCancelling ? 'A cancelar…' : 'Cancelar'}
                        </DropdownMenuItem>
                      )}
                      {canModerate && e.status === 'DRAFT' && (
                        <DropdownMenuItem
                          disabled={isDeleting}
                          onSelect={() => handleDelete(e.id, e.title)}
                        >
                          {isDeleting ? 'A eliminar…' : 'Eliminar'}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            );
          })}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      )}
    </div>
  );
}
