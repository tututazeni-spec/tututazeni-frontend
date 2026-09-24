// components/events/ScheduleTab.tsx
// Separador "Programação" (docs/events.md secção 5) — agenda de sessões/
// actividades para eventos com várias actividades (ex.: "09:00 — Abertura",
// "09:30 — Apresentação institucional"…). O spec traz "Evento" como coluna
// própria (ao contrário de Participantes/Locais & Logística), por isso a
// listagem é cross-evento sobre GET /events/sessions (com filtro opcional
// por evento) em vez de exigir seleccionar um evento primeiro — mesmo
// padrão de components/live-classes/SessionsView.tsx. Criar/editar/eliminar
// continua aninhado em /events/:id/sessions.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { ListOrdered, MoreVertical, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Role } from '@/lib/roles';
import { formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { SESSION_STATUS_CFG } from './constants';
import { useDepartmentOptions, useEventPickerOptions, useUnitOptions } from './eventFormData';
import type { EventSession, EventSessionStatus } from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const MANAGE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(SESSION_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

interface SessionFormState {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
  location: string;
  room: string;
  speaker: string;
  capacity: string;
  status: EventSessionStatus;
}

const EMPTY_FORM: SessionFormState = {
  title: '',
  description: '',
  startAt: '',
  endAt: '',
  location: '',
  room: '',
  speaker: '',
  capacity: '',
  status: 'SCHEDULED',
};

export function ScheduleTab() {
  const role = useCurrentRole();
  const canManage = !!role && MANAGE_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();
  const eventOptions = useEventPickerOptions('sessions');

  const [eventFilter, setEventFilter] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [unitId, setUnitId] = useState('ALL');
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EventSession | 'new' | null>(null);
  const [form, setForm] = useState<SessionFormState>(EMPTY_FORM);
  const [formEventId, setFormEventId] = useState('');

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const params = {
    page,
    limit: 20,
    eventId: eventFilter === 'ALL' ? undefined : eventFilter,
    status: status === 'ALL' ? undefined : status,
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    unitId: unitId === 'ALL' ? undefined : unitId,
    responsibleId: responsible ? responsible.id : undefined,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated<EventSession>>(
    queryKeys.events.allSessions(params),
    '/events/sessions',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const sessions = data?.data ?? [];

  const invalidateKeys = [queryKeys.events.all];

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormEventId('');
    setEditing('new');
  };
  const openEdit = (s: EventSession) => {
    setForm({
      title: s.title,
      description: s.description ?? '',
      startAt: s.startAt.slice(0, 16),
      endAt: s.endAt.slice(0, 16),
      location: s.location ?? '',
      room: s.room ?? '',
      speaker: s.speaker ?? '',
      capacity: s.capacity ? String(s.capacity) : '',
      status: s.status,
    });
    setFormEventId(String(s.eventId));
    setEditing(s);
  };

  const save = useApiMutation(
    () => {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        location: form.location || undefined,
        room: form.room || undefined,
        speaker: form.speaker || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        status: form.status,
      };
      return editing !== 'new' && editing
        ? apiClient.put(`/events/${editing.eventId}/sessions/${editing.id}`, payload)
        : apiClient.post(`/events/${formEventId}/sessions`, payload);
    },
    {
      invalidateKeys,
      onSuccess: () => {
        notify({ title: 'Sessão guardada', intent: 'success' });
        setEditing(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (s: EventSession) => apiClient.delete(`/events/${s.eventId}/sessions/${s.id}`),
    {
      invalidateKeys,
      onSuccess: () => notify({ title: 'Sessão eliminada', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(s: EventSession) {
    const ok = await confirm({
      title: `Eliminar "${s.title}"?`,
      message: 'Esta acção não pode ser desfeita.',
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(s);
  }

  const canSubmit =
    !!form.title && !!form.startAt && !!form.endAt && (editing !== 'new' || !!formEventId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Combobox
            items={[{ value: 'ALL', label: 'Todos os eventos' }, ...eventOptions]}
            value={eventFilter}
            onValueChange={(v) => {
              setEventFilter(v);
              setPage(1);
            }}
            placeholder="Filtrar por evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="w-64"
          />
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
          <Select
            items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
            value={departmentId}
            onValueChange={(v) => {
              setDepartmentId(v);
              setPage(1);
            }}
          />
          <Select
            items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
            value={unitId}
            onValueChange={(v) => {
              setUnitId(v);
              setPage(1);
            }}
          />
          <div className="w-56">
            <DepartmentUserPicker
              label="Responsável"
              htmlFor="sched-responsible"
              value={responsible}
              onChange={(u) => {
                setResponsible(u);
                setPage(1);
              }}
            />
          </div>
        </div>
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={1.75} />
            Nova sessão
          </Button>
        )}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="Sem sessões"
          description="Cria a primeira sessão de um evento com várias actividades."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">{s.title}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {s.event?.title ?? `Evento #${s.eventId}`}
                  {s.speaker && ` · Orador: ${s.speaker}`}
                  {s.responsible && ` · Resp.: ${s.responsible.fullName}`}
                </div>
              </div>
              <div className="hidden w-40 shrink-0 font-body text-xs text-ink-faint sm:block">
                {formatDate(s.startAt)} · {formatTime(s.startAt)}–{formatTime(s.endAt)}
              </div>
              <div className="hidden w-24 shrink-0 font-body text-xs text-ink-faint md:block">
                {s.durationMinutes}min
              </div>
              <div className="hidden w-32 shrink-0 truncate font-body text-xs text-ink-faint lg:block">
                {[s.location, s.room].filter(Boolean).join(' · ') || '—'}
              </div>
              <StatusBadge value={s.status} map={SESSION_STATUS_CFG} />
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Acções da sessão"
                      className="shrink-0 rounded-control p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                    >
                      <MoreVertical size={16} strokeWidth={1.75} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => openEdit(s)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={remove.isPending && remove.variables?.id === s.id}
                      onSelect={() => onDelete(s)}
                    >
                      {remove.isPending && remove.variables?.id === s.id ? 'A eliminar…' : 'Eliminar'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent title={editing === 'new' ? 'Nova sessão' : 'Editar sessão'}>
            <div className="mt-4 space-y-4">
              {editing === 'new' && (
                <FormField label="Evento *" htmlFor="sched-event">
                  <Combobox
                    items={eventOptions}
                    value={formEventId}
                    onValueChange={setFormEventId}
                    placeholder="Selecionar evento…"
                    searchPlaceholder="Pesquisar evento…"
                    emptyText="Nenhum evento encontrado"
                  />
                </FormField>
              )}
              <FormField label="Título *" htmlFor="sched-title">
                <Input
                  id="sched-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Descrição" htmlFor="sched-description">
                <Textarea
                  id="sched-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Início *" htmlFor="sched-start">
                  <Input
                    id="sched-start"
                    type="datetime-local"
                    value={form.startAt}
                    onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Fim *" htmlFor="sched-end">
                  <Input
                    id="sched-end"
                    type="datetime-local"
                    value={form.endAt}
                    onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Local" htmlFor="sched-location">
                  <Input
                    id="sched-location"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Sala" htmlFor="sched-room">
                  <Input
                    id="sched-room"
                    value={form.room}
                    onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Orador" htmlFor="sched-speaker">
                  <Input
                    id="sched-speaker"
                    value={form.speaker}
                    onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Capacidade" htmlFor="sched-capacity">
                  <Input
                    id="sched-capacity"
                    type="number"
                    min={1}
                    value={form.capacity}
                    onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Estado" htmlFor="sched-status">
                <Select
                  items={Object.entries(SESSION_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventSessionStatus }))}
                  className="w-full"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                disabled={!canSubmit}
                loading={save.isPending}
                onClick={() => save.mutate(undefined)}
              >
                Guardar
              </Button>
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
