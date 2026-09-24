// components/events/SpeakersGuestsTab.tsx
// Separador "Oradores & Convidados" (docs/events.md secção 7) — gestão das
// pessoas que participam como oradores, convidados ou moderadores de UM
// evento seleccionado. O spec não lista "Evento" como coluna própria (ao
// contrário de Programação/Comunicação), mesmo critério de
// ParticipantsTab.tsx/VenuesLogisticsTab.tsx: contexto escolhido primeiro,
// não cross-evento. Nome/organização/cargo/contacto ficam texto livre —
// oradores não são necessariamente utilizadores do sistema. "Sessão" é
// opcional e reutiliza GET /events/sessions?eventId= (mesmo endpoint da
// aba Programação) para o picker.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Mic2, MoreVertical, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Role } from '@/lib/roles';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
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
import { SPEAKER_STATUS_CFG, SPEAKER_TYPE_CFG } from './constants';
import { useEventPickerOptions } from './eventFormData';
import type { EventSession, EventSpeaker, EventSpeakerStatus, EventSpeakerType } from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const MANAGE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(SPEAKER_TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(SPEAKER_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

interface SpeakerFormState {
  name: string;
  type: EventSpeakerType;
  organization: string;
  position: string;
  contact: string;
  bio: string;
  photoUrl: string;
  topic: string;
  sessionId: string;
  schedule: string;
  specialNeeds: string;
  fee: string;
  transport: string;
  accommodation: string;
  status: EventSpeakerStatus;
}

const EMPTY_FORM: SpeakerFormState = {
  name: '',
  type: 'SPEAKER',
  organization: '',
  position: '',
  contact: '',
  bio: '',
  photoUrl: '',
  topic: '',
  sessionId: 'NONE',
  schedule: '',
  specialNeeds: '',
  fee: '',
  transport: '',
  accommodation: '',
  status: 'INVITED',
};

function toForm(s: EventSpeaker | null): SpeakerFormState {
  if (!s) return EMPTY_FORM;
  return {
    name: s.name,
    type: s.type,
    organization: s.organization ?? '',
    position: s.position ?? '',
    contact: s.contact ?? '',
    bio: s.bio ?? '',
    photoUrl: s.photoUrl ?? '',
    topic: s.topic ?? '',
    sessionId: s.sessionId ? String(s.sessionId) : 'NONE',
    schedule: s.schedule ?? '',
    specialNeeds: s.specialNeeds ?? '',
    fee: s.fee !== null ? String(s.fee) : '',
    transport: s.transport ?? '',
    accommodation: s.accommodation ?? '',
    status: s.status,
  };
}

export function SpeakersGuestsTab() {
  const role = useCurrentRole();
  const canManage = !!role && MANAGE_ROLES.includes(role);
  const notify = useToast();
  const confirm = useConfirm();
  const eventOptions = useEventPickerOptions('speakers');

  const [eventId, setEventId] = useState<number | null>(null);
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<EventSpeaker | 'new' | null>(null);
  const [form, setForm] = useState<SpeakerFormState>(EMPTY_FORM);

  const params = {
    page,
    limit: 20,
    type: type === 'ALL' ? undefined : type,
    status: status === 'ALL' ? undefined : status,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated<EventSpeaker>>(
    queryKeys.events.speakers(eventId ?? 0, params),
    `/events/${eventId}/speakers`,
    { params, enabled: !!eventId, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const speakers = data?.data ?? [];

  const { data: sessionsData } = useApiQuery<Paginated<EventSession>>(
    queryKeys.events.allSessions({ eventId: eventId ?? 0, limit: 100 }),
    '/events/sessions',
    { params: { eventId: eventId ?? undefined, limit: 100 }, enabled: !!eventId, staleTime: STALE_TIME.DYNAMIC },
  );
  const sessionOptions = [
    { value: 'NONE', label: 'Sem sessão associada' },
    ...(sessionsData?.data ?? []).map((s) => ({ value: String(s.id), label: s.title })),
  ];

  const invalidateKeys = [queryKeys.events.all];

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
  };
  const openEdit = (s: EventSpeaker) => {
    setForm(toForm(s));
    setEditing(s);
  };

  const save = useApiMutation(
    () => {
      const payload = {
        name: form.name,
        type: form.type,
        organization: form.organization || undefined,
        position: form.position || undefined,
        contact: form.contact || undefined,
        bio: form.bio || undefined,
        photoUrl: form.photoUrl || undefined,
        topic: form.topic || undefined,
        sessionId: form.sessionId !== 'NONE' ? Number(form.sessionId) : null,
        schedule: form.schedule || undefined,
        specialNeeds: form.specialNeeds || undefined,
        fee: form.fee ? Number(form.fee) : undefined,
        transport: form.transport || undefined,
        accommodation: form.accommodation || undefined,
        status: form.status,
      };
      return editing !== 'new' && editing
        ? apiClient.put(`/events/${eventId}/speakers/${editing.id}`, payload)
        : apiClient.post(`/events/${eventId}/speakers`, payload);
    },
    {
      invalidateKeys,
      onSuccess: () => {
        notify({ title: 'Orador/convidado guardado', intent: 'success' });
        setEditing(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (s: EventSpeaker) => apiClient.delete(`/events/${eventId}/speakers/${s.id}`),
    {
      invalidateKeys,
      onSuccess: () => notify({ title: 'Orador/convidado removido', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(s: EventSpeaker) {
    const ok = await confirm({
      title: `Remover "${s.name}"?`,
      message: 'Esta acção não pode ser desfeita.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) remove.mutate(s);
  }

  const canSubmit = !!form.name && !!form.type;

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
          icon={Mic2}
          title="Escolhe um evento"
          description="Selecciona um evento acima para gerir os seus oradores, convidados e moderadores."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Combobox
            items={eventOptions}
            value={String(eventId)}
            onValueChange={(v) => {
              setEventId(Number(v));
              setPage(1);
            }}
            placeholder="Selecionar evento"
            searchPlaceholder="Pesquisar evento…"
            emptyText="Nenhum evento encontrado"
            className="max-w-sm"
          />
          <Select
            items={TYPE_ITEMS}
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          />
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
          />
        </div>
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={1.75} />
            Novo orador/convidado
          </Button>
        )}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : speakers.length === 0 ? (
        <EmptyState
          icon={Mic2}
          title="Sem oradores/convidados"
          description="Adiciona o primeiro orador, convidado ou moderador deste evento."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {speakers.map((s) => (
            <div
              key={s.id}
              className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <Avatar name={s.name} url={s.photoUrl ?? undefined} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">{s.name}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {SPEAKER_TYPE_CFG[s.type].label}
                  {s.organization && ` · ${s.organization}`}
                  {s.position && ` · ${s.position}`}
                </div>
              </div>
              <div className="hidden w-40 shrink-0 truncate font-body text-xs text-ink-faint sm:block">
                {s.topic || '—'}
              </div>
              <div className="hidden w-40 shrink-0 truncate font-body text-xs text-ink-faint md:block">
                {s.session ? s.session.title : s.schedule || '—'}
              </div>
              <StatusBadge value={s.status} map={SPEAKER_STATUS_CFG} />
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label="Acções do orador/convidado"
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
                      {remove.isPending && remove.variables?.id === s.id ? 'A remover…' : 'Remover'}
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
          <ModalContent
            title={editing === 'new' ? 'Novo orador/convidado' : 'Editar orador/convidado'}
            className="max-h-[90vh] max-w-2xl overflow-y-auto"
          >
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Nome *" htmlFor="spk-name">
                  <Input
                    id="spk-name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Tipo *" htmlFor="spk-type">
                  <Select
                    items={Object.entries(SPEAKER_TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventSpeakerType }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Organização" htmlFor="spk-org">
                  <Input
                    id="spk-org"
                    value={form.organization}
                    onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Cargo" htmlFor="spk-position">
                  <Input
                    id="spk-position"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Contacto" htmlFor="spk-contact">
                  <Input
                    id="spk-contact"
                    value={form.contact}
                    onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
                    placeholder="Email ou telefone"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Fotografia (URL)" htmlFor="spk-photo">
                  <Input
                    id="spk-photo"
                    value={form.photoUrl}
                    onChange={(e) => setForm((f) => ({ ...f, photoUrl: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Biografia" htmlFor="spk-bio">
                <Textarea
                  id="spk-bio"
                  value={form.bio}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Tema" htmlFor="spk-topic">
                  <Input
                    id="spk-topic"
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Sessão" htmlFor="spk-session">
                  <Select
                    items={sessionOptions}
                    value={form.sessionId}
                    onValueChange={(v) => setForm((f) => ({ ...f, sessionId: v }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Horário" htmlFor="spk-schedule">
                  <Input
                    id="spk-schedule"
                    value={form.schedule}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    placeholder="Ex.: 09:00–09:30"
                    className="w-full"
                  />
                </FormField>
                <FormField label="Honorários" htmlFor="spk-fee">
                  <Input
                    id="spk-fee"
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.fee}
                    onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Necessidades especiais" htmlFor="spk-needs">
                <Textarea
                  id="spk-needs"
                  value={form.specialNeeds}
                  onChange={(e) => setForm((f) => ({ ...f, specialNeeds: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Transporte" htmlFor="spk-transport">
                  <Input
                    id="spk-transport"
                    value={form.transport}
                    onChange={(e) => setForm((f) => ({ ...f, transport: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Alojamento" htmlFor="spk-accommodation">
                  <Input
                    id="spk-accommodation"
                    value={form.accommodation}
                    onChange={(e) => setForm((f) => ({ ...f, accommodation: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Estado" htmlFor="spk-status">
                <Select
                  items={Object.entries(SPEAKER_STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as EventSpeakerStatus }))}
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
