// components/events/CommunicationTab.tsx
// Separador "Comunicação" (docs/events.md secção 8) — histórico de
// convites, confirmações, lembretes e outras comunicações do evento. O
// spec traz "Evento" como coluna própria (#8 lista "Evento, destinatários,
// tipo de comunicação…") — por isso a listagem é cross-evento sobre
// GET /events/communications (com filtro opcional por evento), mesmo
// padrão de ScheduleTab.tsx. Criação continua aninhada em
// /events/:id/communications porque uma comunicação pertence sempre a um
// evento concreto. Envio real (não decorativo): INNOVA_NOTIFICATION cria
// notificações in-app, EMAIL/SMS/WHATSAPP despacham via SMTP/Twilio já
// usados pelo módulo Notifications — melhor esforço, ver
// EventsService#createCommunication.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { MessageSquare, Plus } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Role } from '@/lib/roles';
import { formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
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
import { COMMUNICATION_CHANNEL_CFG, COMMUNICATION_STATUS_CFG, COMMUNICATION_TYPE_CFG, PARTICIPANT_STATUS } from './constants';
import { useEventPickerOptions } from './eventFormData';
import type {
  EventCommunication,
  EventCommunicationChannel,
  EventCommunicationType,
  ParticipantStatus,
} from './types';

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const MANAGE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(COMMUNICATION_TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];
const CHANNEL_ITEMS = [
  { value: 'ALL', label: 'Todos os canais' },
  ...Object.entries(COMMUNICATION_CHANNEL_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

export function CommunicationTab() {
  const role = useCurrentRole();
  const canManage = !!role && MANAGE_ROLES.includes(role);
  const eventOptions = useEventPickerOptions('communications');

  const [eventFilter, setEventFilter] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [channel, setChannel] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showNew, setShowNew] = useState(false);

  const params = {
    page,
    limit: 20,
    eventId: eventFilter === 'ALL' ? undefined : eventFilter,
    type: type === 'ALL' ? undefined : type,
    channel: channel === 'ALL' ? undefined : channel,
  };

  const { data, isLoading, error, refetch } = useApiQuery<Paginated<EventCommunication>>(
    queryKeys.events.allCommunications(params),
    '/events/communications',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const communications = data?.data ?? [];

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
            items={TYPE_ITEMS}
            value={type}
            onValueChange={(v) => {
              setType(v);
              setPage(1);
            }}
          />
          <Select
            items={CHANNEL_ITEMS}
            value={channel}
            onValueChange={(v) => {
              setChannel(v);
              setPage(1);
            }}
          />
        </div>
        {canManage && (
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Nova comunicação
          </Button>
        )}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={5} />
      ) : communications.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Sem comunicações"
          description="Envia a primeira comunicação a participantes de um evento."
        />
      ) : (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          {communications.map((c) => (
            <div
              key={c.id}
              className="flex w-full flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-sm font-medium text-ink">{c.subject}</div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {c.event.title} · {COMMUNICATION_TYPE_CFG[c.type].label} · {c.recipientCount} destinatário
                  {c.recipientCount === 1 ? '' : 's'}
                </div>
              </div>
              <div className="hidden w-32 shrink-0 font-body text-xs text-ink-faint sm:block">
                {COMMUNICATION_CHANNEL_CFG[c.channel].label}
              </div>
              <div className="hidden w-40 shrink-0 font-body text-xs text-ink-faint md:block">
                {c.sentAt ? `${formatDate(c.sentAt)} · ${formatTime(c.sentAt)}` : '—'}
              </div>
              <StatusBadge value={c.status} map={COMMUNICATION_STATUS_CFG} />
            </div>
          ))}
        </div>
      )}

      {data && data.meta.totalPages > 1 && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} onPageChange={setPage} />
      )}

      {showNew && <NewCommunicationModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

// ─── Modal "Nova comunicação" ───────────────────────────────────────────────
// Destinatários resolvidos a partir dos participantes já inscritos no
// evento, filtrados por estado de inscrição (omitido = todos) — evita
// duplicar um picker de utilizadores; uma comunicação de evento destina-se
// sempre a quem já está (ou esteve) inscrito.

interface CommFormState {
  eventId: string;
  type: EventCommunicationType;
  channel: EventCommunicationChannel;
  subject: string;
  message: string;
  participantStatuses: ParticipantStatus[];
}

const EMPTY_COMM_FORM: CommFormState = {
  eventId: '',
  type: 'INVITATION',
  channel: 'INNOVA_NOTIFICATION',
  subject: '',
  message: '',
  participantStatuses: [],
};

function NewCommunicationModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const eventOptions = useEventPickerOptions('communications-new');
  const [form, setForm] = useState<CommFormState>(EMPTY_COMM_FORM);

  const send = useApiMutation(
    () =>
      apiClient.post(`/events/${form.eventId}/communications`, {
        type: form.type,
        subject: form.subject,
        message: form.message,
        channel: form.channel,
        participantStatuses: form.participantStatuses.length ? form.participantStatuses : undefined,
      }),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => {
        notify({ title: 'Comunicação enviada', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  function toggleStatus(status: ParticipantStatus) {
    setForm((f) => ({
      ...f,
      participantStatuses: f.participantStatuses.includes(status)
        ? f.participantStatuses.filter((s) => s !== status)
        : [...f.participantStatuses, status],
    }));
  }

  const canSubmit = !!form.eventId && !!form.subject && !!form.message;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova comunicação"
        description="Envia a participantes já inscritos no evento — pelo canal escolhido."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          <FormField label="Evento *" htmlFor="comm-event">
            <Combobox
              items={eventOptions}
              value={form.eventId}
              onValueChange={(v) => setForm((f) => ({ ...f, eventId: v }))}
              placeholder="Selecionar evento…"
              searchPlaceholder="Pesquisar evento…"
              emptyText="Nenhum evento encontrado"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Tipo *" htmlFor="comm-type">
              <Select
                items={Object.entries(COMMUNICATION_TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                value={form.type}
                onValueChange={(v) => setForm((f) => ({ ...f, type: v as EventCommunicationType }))}
                className="w-full"
              />
            </FormField>
            <FormField label="Canal *" htmlFor="comm-channel">
              <Select
                items={Object.entries(COMMUNICATION_CHANNEL_CFG).map(([value, cfg]) => ({ value, label: cfg.label }))}
                value={form.channel}
                onValueChange={(v) => setForm((f) => ({ ...f, channel: v as EventCommunicationChannel }))}
                className="w-full"
              />
            </FormField>
          </div>
          <FormField label="Assunto *" htmlFor="comm-subject">
            <Input
              id="comm-subject"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className="w-full"
            />
          </FormField>
          <FormField label="Mensagem *" htmlFor="comm-message">
            <Textarea
              id="comm-message"
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              className="w-full resize-none"
            />
          </FormField>
          <div>
            <div className="mb-2 font-body text-xs font-medium text-ink">
              Destinatários — filtrar por estado de inscrição (vazio = todos os inscritos)
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PARTICIPANT_STATUS) as Array<[ParticipantStatus, { label: string }]>).map(
                ([value, cfg]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-ink hover:bg-surface-sunken has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={form.participantStatuses.includes(value)}
                      onChange={() => toggleStatus(value)}
                      className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                    />
                    {cfg.label}
                  </label>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            disabled={!canSubmit}
            loading={send.isPending}
            onClick={() => send.mutate(undefined)}
          >
            Enviar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
