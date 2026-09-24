// components/events/ParticipantsTab.tsx
// Separador "Participantes" (docs/events.md ponto 4) — gestão das inscrições
// de UM evento seleccionado (a listagem do spec não traz "Evento" como
// coluna própria, ao contrário de Programação/Comunicação/Check-in/
// Avaliação — por isso o contexto é escolhido primeiro, não misturado entre
// eventos). Distinto do separador "Participantes" do DetailView (leitura
// simples, sem filtros/acções) por trazer filtro por departamento/unidade/
// estado/nome, aprovar/rejeitar/cancelar, adicionar/importar em massa
// (POST /events/:id/participants) e exportação CSV
// (GET /events/:id/participants/export, mesmo padrão âncora de
// components/trainings/manage/ParticipantsTab.tsx).

'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download, MoreVertical, Plus, Users as UsersIcon } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { useDirectoryUsers } from '@/components/enrollments/enrollData';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { PARTICIPANT_STATUS } from './constants';
import { useDepartmentOptions, useEventPickerOptions, useUnitOptions } from './eventFormData';
import type { AddParticipantsResult, EventParticipantRow, ParticipantStatus } from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(PARTICIPANT_STATUS).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function ParticipantsTab() {
  const notify = useToast();
  const confirm = useConfirm();

  const [eventId, setEventId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState({ status: 'ALL', departmentId: 'ALL', unitId: 'ALL', page: 1 });
  const [showAdd, setShowAdd] = useState(false);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();
  const eventOptions = useEventPickerOptions('participants');

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: filters.status === 'ALL' ? undefined : filters.status,
    departmentId: filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated<EventParticipantRow>>(
    queryKeys.events.participants(eventId ?? 0, params),
    `/events/${eventId}/participants`,
    {
      params,
      enabled: !!eventId,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const invalidate = () => refetch();
  const onErr = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const approveMutation = useApiMutation<unknown, number>(
    (userId) => apiClient.patch(`/events/${eventId}/participants/${userId}/approve`, {}),
    {
      onSuccess: () => {
        invalidate();
        notify({ title: 'Inscrição aprovada', intent: 'success' });
      },
      onError: onErr,
    },
  );
  const rejectMutation = useApiMutation<unknown, number>(
    (userId) => apiClient.patch(`/events/${eventId}/participants/${userId}/reject`, {}),
    {
      onSuccess: () => {
        invalidate();
        notify({ title: 'Inscrição rejeitada', intent: 'success' });
      },
      onError: onErr,
    },
  );
  const cancelMutation = useApiMutation<unknown, number>(
    (userId) => apiClient.patch(`/events/${eventId}/participants/${userId}/cancel`, {}),
    {
      onSuccess: () => {
        invalidate();
        notify({ title: 'Inscrição cancelada', intent: 'success' });
      },
      onError: onErr,
    },
  );

  async function handleCancel(userId: number, name: string) {
    if (
      await confirm({
        title: `Cancelar inscrição de ${name}?`,
        message: 'Se houver lista de espera, o próximo é promovido automaticamente.',
        confirmLabel: 'Cancelar inscrição',
        destructive: true,
      })
    )
      cancelMutation.mutate(userId);
  }

  if (!eventId) {
    return (
      <div className="space-y-4">
        <Combobox
          items={eventOptions}
          value={undefined}
          onValueChange={(v) => setEventId(Number(v))}
          placeholder="Selecionar evento"
          searchPlaceholder="Pesquisar evento…"
          emptyText="Nenhum evento encontrado"
          className="max-w-lg"
        />
        <EmptyState
          icon={UsersIcon}
          title="Escolhe um evento"
          description="Selecciona um evento acima para gerir as suas inscrições."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Combobox
          items={eventOptions}
          value={String(eventId)}
          onValueChange={(v) => {
            setEventId(Number(v));
            setFilters((f) => ({ ...f, page: 1 }));
          }}
          placeholder="Selecionar evento"
          searchPlaceholder="Pesquisar evento…"
          emptyText="Nenhum evento encontrado"
          className="max-w-sm"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Adicionar/importar
          </Button>
          <a
            href={`/api/events/${eventId}/participants/export`}
            className={buttonVariants({ intent: 'ghost', size: 'sm' })}
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input
          placeholder="Pesquisar por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-56"
        />
        <Select items={STATUS_ITEMS} value={filters.status} onValueChange={(v) => updateFilters({ status: v })} />
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
        <span className="ml-auto font-body text-sm text-ink-faint">{data?.meta.total ?? 0} inscrições</span>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="Sem participantes" description="Nenhuma inscrição corresponde aos filtros." />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {data.data.map((p) => {
            const isApproving = approveMutation.isPending && approveMutation.variables === p.userId;
            const isRejecting = rejectMutation.isPending && rejectMutation.variables === p.userId;
            const isCancelling = cancelMutation.isPending && cancelMutation.variables === p.userId;
            const canApprove = p.status === 'PENDING' || p.status === 'WAITLIST';
            const canReject = p.status === 'PENDING';
            const canCancel = !(['CANCELLED', 'REJECTED', 'NO_SHOW'] as ParticipantStatus[]).includes(p.status);

            return (
              <div
                key={p.id}
                className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Avatar name={p.user.fullName} url={p.user.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {p.user.fullName}
                    {p.user.employeeNumber && (
                      <span className="ml-1.5 font-mono text-xs text-ink-faint">#{p.user.employeeNumber}</span>
                    )}
                  </div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {p.user.position?.name ?? '—'}
                    {p.user.department && ` · ${p.user.department.name}`}
                    {p.user.unit && ` · ${p.user.unit.name}`}
                  </div>
                </div>

                <div className="hidden w-32 shrink-0 font-body text-xs text-ink-faint sm:block">
                  Inscrito {formatDate(p.registeredAt)}
                </div>
                <div className="hidden w-32 shrink-0 font-body text-xs text-ink-faint md:block">
                  {p.confirmedAt ? `Confirmado ${formatDate(p.confirmedAt)}` : '—'}
                </div>
                <div className="hidden w-32 shrink-0 font-body text-xs text-ink-faint lg:block">
                  {p.checkedInAt ? formatTime(p.checkedInAt) : '—'}
                  {p.checkedOutAt ? ` → ${formatTime(p.checkedOutAt)}` : ''}
                </div>
                <div className="hidden shrink-0 gap-1 xl:flex">
                  {p.hasCertificate && (
                    <span className="rounded bg-success-subtle px-1.5 py-0.5 font-body text-[10px] text-success-ink">
                      Certificado
                    </span>
                  )}
                  {p.hasEvaluation && (
                    <span className="rounded bg-info-subtle px-1.5 py-0.5 font-body text-[10px] text-info-ink">
                      Avaliado
                    </span>
                  )}
                </div>

                <StatusBadge value={p.status} map={PARTICIPANT_STATUS} />

                {(canApprove || canReject || canCancel) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Acções da inscrição"
                        className="shrink-0 rounded-control p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                      >
                        <MoreVertical size={16} strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canApprove && (
                        <DropdownMenuItem disabled={isApproving} onSelect={() => approveMutation.mutate(p.userId)}>
                          {isApproving ? 'A aprovar…' : p.status === 'WAITLIST' ? 'Confirmar' : 'Aprovar'}
                        </DropdownMenuItem>
                      )}
                      {canReject && (
                        <DropdownMenuItem disabled={isRejecting} onSelect={() => rejectMutation.mutate(p.userId)}>
                          {isRejecting ? 'A rejeitar…' : 'Rejeitar'}
                        </DropdownMenuItem>
                      )}
                      {canCancel && (
                        <DropdownMenuItem
                          disabled={isCancelling}
                          onSelect={() => handleCancel(p.userId, p.user.fullName)}
                        >
                          {isCancelling ? 'A cancelar…' : 'Cancelar inscrição'}
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

      {showAdd && (
        <AddParticipantsModal eventId={eventId} onClose={() => setShowAdd(false)} onDone={invalidate} />
      )}
    </div>
  );
}

// ─── Modal "Adicionar/importar participantes" ──────────────────────────────
// Cobre as duas acções do spec ("Adicionar participante" e "Importar
// participantes") com um único fluxo de selecção múltipla — mesmo padrão de
// BulkEnrollModal/trainings ParticipantsTab; um só colaborador seleccionado
// já cobre "adicionar", vários cobrem "importar".

function AddParticipantsModal({
  eventId,
  onClose,
  onDone,
}: {
  eventId: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const notify = useToast();
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [selected, setSelected] = useState<Map<number, { id: number; fullName: string; avatarUrl: string | null }>>(
    new Map(),
  );
  const [result, setResult] = useState<AddParticipantsResult | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { users, loading: usersLoading } = useDirectoryUsers(
    userSearch,
    deptFilter === 'ALL' ? '' : deptFilter,
    !result,
  );

  const selectedIds = useMemo(() => [...selected.keys()], [selected]);

  const toggle = (u: { id: number; fullName: string; avatarUrl?: string | null }) =>
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(u.id)) next.delete(u.id);
      else next.set(u.id, { id: u.id, fullName: u.fullName, avatarUrl: u.avatarUrl ?? null });
      return next;
    });

  const addMutation = useApiMutation<AddParticipantsResult, void>(
    () => apiClient.post<AddParticipantsResult>(`/events/${eventId}/participants`, { userIds: selectedIds }),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: (res) => setResult(res),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const canSubmit = selected.size > 0 && !addMutation.isPending && !result;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Adicionar/importar participantes"
        description="Selecciona um ou mais colaboradores para inscrever directamente no evento (sem passar por aprovação)."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {result ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-card border border-border bg-surface-sunken p-4 text-sm">
              <p className="font-medium text-success-ink">
                {result.success} inscrito{result.success === 1 ? '' : 's'}
              </p>
              <p className="text-ink-muted">
                {result.skipped} já inscrito{result.skipped === 1 ? '' : 's'} · {result.errors} erro
                {result.errors === 1 ? '' : 's'} · {result.total} no total
              </p>
            </div>
            {result.details.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-card border border-danger-subtle bg-danger-subtle p-3 text-xs text-danger-ink">
                {result.details.errors.map((err) => (
                  <div key={err.userId}>
                    ID {err.userId}: {err.error}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end border-t border-border pt-4">
              <Button
                onClick={() => {
                  onDone();
                  onClose();
                }}
              >
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Select
                  items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
                  value={deptFilter}
                  onValueChange={setDeptFilter}
                  className="w-full"
                />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full"
                  placeholder="Nome ou email…"
                  autoComplete="off"
                />
              </div>

              {selected.size > 0 && (
                <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto rounded-card border border-border bg-info-subtle px-3 py-2">
                  {[...selected.values()].map((u) => (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-ink"
                    >
                      {u.fullName}
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-card border border-border">
                {usersLoading ? (
                  <div className="p-3">
                    <Skeleton rows={4} />
                  </div>
                ) : users.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-ink-faint">Nenhum colaborador encontrado</div>
                ) : (
                  users.map((u) => (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 border-b border-border px-3 py-2 last:border-0 hover:bg-surface-sunken"
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(u.id)}
                        onChange={() => toggle(u)}
                        className="h-4 w-4 rounded border-border-strong accent-primary"
                      />
                      <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-ink">{u.fullName}</div>
                        <div className="truncate text-xs text-ink-faint">{u.department?.name ?? u.email ?? '—'}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                disabled={!canSubmit}
                loading={addMutation.isPending}
                onClick={() => addMutation.mutate(undefined)}
              >
                Inscrever {selected.size > 0 ? `(${selected.size})` : ''}
              </Button>
            </div>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
