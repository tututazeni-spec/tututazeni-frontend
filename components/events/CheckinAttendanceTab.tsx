// components/events/CheckinAttendanceTab.tsx
// Separador "Check-in & Presença" (docs/events.md secção 9) — controla quem
// realmente participou no evento. "Evento" É coluna própria no spec
// ("Participante, evento, data, hora de entrada…") — listagem cross-evento
// sobre GET /events/checkins, mesmo critério de Programação/Comunicação.
// "Duração" e o "estado" de apresentação (Presente/Ausente/Entrada
// registada/Saída registada) são sempre calculados no backend, nunca
// persistidos — ver EventsService#computeCheckinState/computeDurationMinutes.
// Presença por sessão (quando o evento tem Programação) é gerida à parte,
// num modal por evento seleccionado — não herda regras de assiduidade de
// formação (nota explícita do spec), por isso usa EventSessionAttendance,
// nunca AttendanceRecord.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  CalendarCheck,
  Download,
  LogIn,
  LogOut,
  MoreVertical,
  QrCode,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
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
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  CHECKIN_METHOD_CFG,
  CHECKIN_STATE_CFG,
  PARTICIPANT_STATUS,
} from './constants';
import {
  useDepartmentOptions,
  useEventPickerOptions,
  useUnitOptions,
} from './eventFormData';
import type {
  EventCheckinMethod,
  EventCheckinRow,
  EventSession,
  EventSessionAttendanceRow,
} from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(PARTICIPANT_STATUS).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];
const METHOD_ITEMS = [
  { value: 'ALL', label: 'Todos os métodos' },
  ...Object.entries(CHECKIN_METHOD_CFG).map(([value, cfg]) => ({
    value,
    label: cfg.label,
  })),
];

export function CheckinAttendanceTab() {
  const notify = useToast();
  const eventOptions = useEventPickerOptions('checkins');
  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [filters, setFilters] = useState({
    eventId: 'ALL',
    status: 'ALL',
    method: 'ALL',
    departmentId: 'ALL',
    unitId: 'ALL',
    page: 1,
  });
  const [manualTarget, setManualTarget] = useState<EventCheckinRow | null>(
    null,
  );
  const [showSessionAttendance, setShowSessionAttendance] = useState(false);

  function updateFilters(patch: Partial<Omit<typeof filters, 'page'>>) {
    setFilters((f) => ({ ...f, ...patch, page: 1 }));
  }

  const params = {
    page: filters.page,
    limit: 20,
    search: debouncedSearch || undefined,
    eventId: filters.eventId === 'ALL' ? undefined : filters.eventId,
    status: filters.status === 'ALL' ? undefined : filters.status,
    method: filters.method === 'ALL' ? undefined : filters.method,
    departmentId:
      filters.departmentId === 'ALL' ? undefined : filters.departmentId,
    unitId: filters.unitId === 'ALL' ? undefined : filters.unitId,
  };

  const { data, isLoading, error, refetch } = useApiQuery<
    Paginated<EventCheckinRow>
  >(queryKeys.events.checkins(params), '/events/checkins', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });
  const rows = data?.data ?? [];

  const onErr = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const checkoutMutation = useApiMutation<unknown, EventCheckinRow>(
    (row) =>
      apiClient.patch(
        `/events/${row.eventId}/participants/${row.userId}/checkout`,
        {},
      ),
    {
      onSuccess: () => {
        refetch();
        notify({ title: 'Check-out registado', intent: 'success' });
      },
      onError: onErr,
    },
  );

  const exportParams = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((acc, [k, v]) => {
      if (v !== undefined) acc[k] = String(v);
      return acc;
    }, {}),
  ).toString();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Combobox
            items={[
              { value: 'ALL', label: 'Todos os eventos' },
              ...eventOptions,
            ]}
            value={filters.eventId}
            onValueChange={(v) => updateFilters({ eventId: v })}
            placeholder="Filtrar por evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="w-64"
          />
          <Input
            placeholder="Pesquisar por nome…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-52"
          />
          <Select
            items={STATUS_ITEMS}
            value={filters.status}
            onValueChange={(v) => updateFilters({ status: v })}
          />
          <Select
            items={METHOD_ITEMS}
            value={filters.method}
            onValueChange={(v) => updateFilters({ method: v })}
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todos os departamentos' },
              ...departmentOptions,
            ]}
            value={filters.departmentId}
            onValueChange={(v) => updateFilters({ departmentId: v })}
          />
          <Select
            items={[
              { value: 'ALL', label: 'Todas as unidades' },
              ...unitOptions,
            ]}
            value={filters.unitId}
            onValueChange={(v) => updateFilters({ unitId: v })}
          />
        </div>
        <div className="flex gap-2">
          {filters.eventId !== 'ALL' && (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => setShowSessionAttendance(true)}
            >
              <CalendarCheck size={14} strokeWidth={1.75} />
              Presença por sessão
            </Button>
          )}
          <a
            href={`/api/events/checkins/export?${exportParams}`}
            className={buttonVariants({ intent: 'ghost', size: 'sm' })}
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar
          </a>
        </div>
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={QrCode}
          title="Sem registos de presença"
          description="Nenhum participante corresponde aos filtros escolhidos."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {rows.map((p) => {
            const isCheckingOut =
              checkoutMutation.isPending &&
              checkoutMutation.variables?.id === p.id;
            const canCheckIn = !p.checkedInAt;
            const canCheckOut = !!p.checkedInAt && !p.checkedOutAt;

            return (
              <div
                key={p.id}
                className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
              >
                <Avatar name={p.user.fullName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-body text-sm font-medium text-ink">
                    {p.user.fullName}
                  </div>
                  <div className="truncate font-body text-xs text-ink-faint">
                    {p.event.title}
                    {p.user.department && ` · ${p.user.department.name}`}
                    {p.user.unit && ` · ${p.user.unit.name}`}
                  </div>
                </div>

                <div className="hidden w-40 shrink-0 font-body text-xs text-ink-faint md:block">
                  {p.checkedInAt ? formatTime(p.checkedInAt) : '—'}
                  {p.checkedOutAt ? ` → ${formatTime(p.checkedOutAt)}` : ''}
                  {p.durationMinutes != null && ` (${p.durationMinutes} min)`}
                </div>
                <div className="hidden w-32 shrink-0 font-body text-xs text-ink-faint lg:block">
                  {p.checkinMethod
                    ? CHECKIN_METHOD_CFG[p.checkinMethod].label
                    : '—'}
                </div>

                <StatusBadge value={p.checkinState} map={CHECKIN_STATE_CFG} />

                {(canCheckIn || canCheckOut) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Acções de presença"
                        className="shrink-0 rounded-control p-1.5 text-ink-faint hover:bg-surface-sunken hover:text-ink"
                      >
                        <MoreVertical size={16} strokeWidth={1.75} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canCheckIn && (
                        <DropdownMenuItem onSelect={() => setManualTarget(p)}>
                          <LogIn
                            size={14}
                            strokeWidth={1.75}
                            className="mr-1 inline"
                          />
                          Registar check-in
                        </DropdownMenuItem>
                      )}
                      {canCheckOut && (
                        <DropdownMenuItem
                          disabled={isCheckingOut}
                          onSelect={() => checkoutMutation.mutate(p)}
                        >
                          <LogOut
                            size={14}
                            strokeWidth={1.75}
                            className="mr-1 inline"
                          />
                          {isCheckingOut ? 'A registar…' : 'Registar check-out'}
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

      {manualTarget && (
        <ManualCheckInModal
          row={manualTarget}
          onClose={() => setManualTarget(null)}
          onDone={() => refetch()}
        />
      )}
      {showSessionAttendance && filters.eventId !== 'ALL' && (
        <SessionAttendanceModal
          eventId={Number(filters.eventId)}
          onClose={() => setShowSessionAttendance(false)}
        />
      )}
    </div>
  );
}

// ─── Modal "Registar check-in" ──────────────────────────────────────────────

function ManualCheckInModal({
  row,
  onClose,
  onDone,
}: {
  row: EventCheckinRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const notify = useToast();
  const [method, setMethod] = useState<EventCheckinMethod>('MANUAL');
  const [note, setNote] = useState('');

  const checkIn = useApiMutation(
    () =>
      apiClient.patch(
        `/events/${row.eventId}/participants/${row.userId}/checkin`,
        {
          method,
          note: note || undefined,
        },
      ),
    {
      onSuccess: () => {
        onDone();
        notify({ title: 'Check-in registado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Registar check-in"
        description={`${row.user.fullName} — ${row.event.title}`}
      >
        <div className="mt-4 space-y-4">
          <FormField label="Método" htmlFor="checkin-method">
            <Select
              items={Object.entries(CHECKIN_METHOD_CFG).map(([value, cfg]) => ({
                value,
                label: cfg.label,
              }))}
              value={method}
              onValueChange={(v) => setMethod(v as EventCheckinMethod)}
              className="w-full"
            />
          </FormField>
          <FormField label="Observação" htmlFor="checkin-note">
            <Textarea
              id="checkin-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full resize-none"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            loading={checkIn.isPending}
            onClick={() => checkIn.mutate(undefined)}
          >
            Registar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ─── Modal "Presença por sessão" ────────────────────────────────────────────
// Spec (#9): "Se o evento tiver sessões, também pode controlar: presença por
// sessão, hora de entrada/saída por sessão, duração da participação." Lista
// as sessões do evento seleccionado (GET /events/sessions?eventId=) e, ao
// escolher uma, a presença dos participantes confirmados/presentes nessa
// sessão (GET /events/:id/sessions/:sessionId/attendance).

function SessionAttendanceModal({
  eventId,
  onClose,
}: {
  eventId: number;
  onClose: () => void;
}) {
  const notify = useToast();
  const [sessionId, setSessionId] = useState<number | null>(null);

  const { data: sessions, isLoading: sessionsLoading } = useApiQuery<
    Paginated<EventSession>
  >(queryKeys.events.allSessions({ eventId, limit: 100 }), '/events/sessions', {
    params: { eventId, limit: 100 },
    staleTime: STALE_TIME.DYNAMIC,
  });
  const sessionOptions = (sessions?.data ?? []).map((s) => ({
    value: String(s.id),
    label: `${s.title} — ${formatDate(s.startAt)} ${formatTime(s.startAt)}`,
  }));

  const {
    data: attendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    refetch,
  } = useApiQuery<EventSessionAttendanceRow[]>(
    queryKeys.events.sessionAttendance(eventId, sessionId ?? 0),
    `/events/${eventId}/sessions/${sessionId}/attendance`,
    { enabled: !!sessionId, staleTime: STALE_TIME.DYNAMIC },
  );

  const onErr = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const checkIn = useApiMutation<unknown, number>(
    (userId) =>
      apiClient.patch(
        `/events/${eventId}/sessions/${sessionId}/attendance/${userId}/checkin`,
        {
          method: 'MANUAL',
        },
      ),
    { onSuccess: () => refetch(), onError: onErr },
  );
  const checkOut = useApiMutation<unknown, number>(
    (userId) =>
      apiClient.patch(
        `/events/${eventId}/sessions/${sessionId}/attendance/${userId}/checkout`,
        {},
      ),
    { onSuccess: () => refetch(), onError: onErr },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Presença por sessão"
        description="Controla a entrada e saída de cada participante em cada sessão do evento."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {sessionsLoading ? (
            <Skeleton rows={2} />
          ) : sessionOptions.length === 0 ? (
            <EmptyState
              title="Sem sessões"
              description="Este evento ainda não tem sessões na Programação."
            />
          ) : (
            <>
              <Combobox
                items={sessionOptions}
                value={sessionId ? String(sessionId) : undefined}
                onValueChange={(v) => setSessionId(Number(v))}
                placeholder="Selecionar sessão…"
                searchPlaceholder="Pesquisar sessão…"
                emptyText="Nenhuma sessão encontrada"
              />

              {sessionId &&
                (attendanceError ? (
                  <QueryError
                    error={attendanceError}
                    onRetry={() => refetch()}
                  />
                ) : attendanceLoading ? (
                  <Skeleton rows={4} />
                ) : !attendance || attendance.length === 0 ? (
                  <EmptyState
                    title="Sem participantes"
                    description="Nenhum participante confirmado para esta sessão."
                  />
                ) : (
                  <div className="overflow-hidden rounded-card border border-border">
                    {attendance.map((a) => (
                      <div
                        key={a.userId}
                        className="flex items-center gap-3 border-b border-border px-3 py-2 last:border-0"
                      >
                        <div className="min-w-0 flex-1 truncate font-body text-sm text-ink">
                          {a.user.fullName}
                        </div>
                        <div className="hidden w-36 shrink-0 font-body text-xs text-ink-faint sm:block">
                          {a.checkedInAt ? formatTime(a.checkedInAt) : '—'}
                          {a.checkedOutAt
                            ? ` → ${formatTime(a.checkedOutAt)}`
                            : ''}
                        </div>
                        {!a.checkedInAt ? (
                          <Button
                            size="sm"
                            intent="secondary"
                            loading={
                              checkIn.isPending &&
                              checkIn.variables === a.userId
                            }
                            onClick={() => checkIn.mutate(a.userId)}
                          >
                            Check-in
                          </Button>
                        ) : !a.checkedOutAt ? (
                          <Button
                            size="sm"
                            intent="secondary"
                            loading={
                              checkOut.isPending &&
                              checkOut.variables === a.userId
                            }
                            onClick={() => checkOut.mutate(a.userId)}
                          >
                            Check-out
                          </Button>
                        ) : (
                          <span className="font-body text-xs text-ink-faint">
                            {a.durationMinutes != null
                              ? `${a.durationMinutes} min`
                              : '—'}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
            </>
          )}
        </div>
        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <Button intent="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
