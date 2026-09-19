// components/live-classes/SessionsView.tsx
// Separador "Sessões" (docs/aulas-ao-vivo.md secção 5) — tabela global de
// sessões de todas as aulas recorrentes. Sessões só existem para aulas com
// recurrence != ONCE (ver live-classes.service.ts#buildSessionDates); a
// sala ao vivo/chat continuam ao nível da Aula (ClassCard/[id]/page.tsx),
// aqui só se agenda/regista (data/formador/sala/link/estado).

'use client';

import { useState } from 'react';
import { Clock, MapPin, Plus, Trash2, User } from 'lucide-react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { STATUS_CFG } from './constants';
import type { LiveClassSession, LiveClassStatus, PaginatedSessions } from './types';

interface SessionFormState {
  liveClassId: string;
  sessionDate: string;
  durationMinutes: string;
  location: string;
  meetingUrl: string;
  notes: string;
}

const EMPTY: SessionFormState = {
  liveClassId: '',
  sessionDate: '',
  durationMinutes: '60',
  location: '',
  meetingUrl: '',
  notes: '',
};

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...(Object.keys(STATUS_CFG) as LiveClassStatus[]).map((s) => ({ value: s, label: STATUS_CFG[s].label })),
];

function useLiveClassOptions() {
  const params = { limit: 100 };
  const query = useApiQuery<{ data: { id: number; topic: string }[] }>(
    queryKeys.liveClasses.list({ picker: 'sessions', ...params }),
    '/live-classes',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const options = (query.data?.data ?? []).map((c) => ({ value: String(c.id), label: c.topic }));
  return { options, loading: query.isLoading };
}

export function SessionsView({ canManage }: { canManage: boolean }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { options: liveClassOptions } = useLiveClassOptions();

  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<LiveClassSession | 'new' | null>(null);
  const [form, setForm] = useState<SessionFormState>(EMPTY);

  const params: Record<string, string | number | boolean | null | undefined> = { page, limit: 20 };
  if (status !== 'ALL') params.status = status;

  const { data, isLoading } = useApiQuery<PaginatedSessions>(
    queryKeys.liveClasses.allSessions(params),
    '/live-classes/sessions',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const sessions = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (s: LiveClassSession) => {
    setForm({
      liveClassId: String(s.liveClassId),
      sessionDate: s.sessionDate.slice(0, 16),
      durationMinutes: String(s.durationMinutes),
      location: s.location ?? '',
      meetingUrl: s.meetingUrl ?? '',
      notes: s.notes ?? '',
    });
    setEditing(s);
  };

  const invalidateKeys = [queryKeys.liveClasses.all];

  const save = useApiMutation(
    () => {
      const payload = {
        sessionDate: new Date(form.sessionDate).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
        notes: form.notes || undefined,
      };
      return editing !== 'new' && editing
        ? apiClient.put(`/live-classes/${editing.liveClassId}/sessions/${editing.id}`, payload)
        : apiClient.post(`/live-classes/${form.liveClassId}/sessions`, payload);
    },
    {
      invalidateKeys,
      onSuccess: () => {
        toast({ title: 'Sessão guardada.', intent: 'success' });
        setEditing(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const remove = useApiMutation(
    (s: LiveClassSession) => apiClient.delete(`/live-classes/${s.liveClassId}/sessions/${s.id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Sessão eliminada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(s: LiveClassSession) {
    const ok = await confirm({
      title: `Eliminar sessão de ${formatDateTime(s.sessionDate)}?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(s);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          className="w-48"
        />
        {canManage && (
          <Button size="sm" onClick={openNew}>
            <Plus size={14} strokeWidth={1.75} />
            Nova sessão
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : sessions.length === 0 ? (
        <EmptyState
          title="Sem sessões"
          description="As sessões aparecem aqui para aulas recorrentes (semanais/diárias/personalizadas)."
        />
      ) : (
        <>
          <Card className="divide-y divide-border">
            {sessions.map((s) => (
              <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">
                    {s.liveClass?.topic ?? `Aula #${s.liveClassId}`} · Sessão {s.seq}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 font-body text-xs text-ink-faint">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} strokeWidth={1.75} /> {formatDateTime(s.sessionDate)} ({s.durationMinutes}min)
                    </span>
                    {s.instructor && (
                      <span className="inline-flex items-center gap-1">
                        <User size={12} strokeWidth={1.75} /> {s.instructor.name}
                      </span>
                    )}
                    {s.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={12} strokeWidth={1.75} /> {s.location}
                      </span>
                    )}
                    {s.liveClass?.course && <span>{s.liveClass.course.title}</span>}
                    <span>{s._count?.attendances ?? 0} presenças</span>
                  </div>
                </div>
                <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[s.status]?.cls ?? ''}`}>
                  {STATUS_CFG[s.status]?.label ?? s.status}
                </span>
                {canManage && (
                  <>
                    <Button intent="ghost" size="sm" onClick={() => openEdit(s)}>
                      Editar
                    </Button>
                    <Button
                      intent="danger"
                      size="sm"
                      onClick={() => onDelete(s)}
                      loading={remove.isPending && remove.variables?.id === s.id}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button intent="ghost" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                ← Anterior
              </Button>
              <span className="py-2 px-3 text-sm text-ink-muted">
                {page} / {totalPages}
              </span>
              <Button intent="ghost" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Seguinte →
              </Button>
            </div>
          )}
        </>
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent title={editing === 'new' ? 'Nova sessão' : 'Editar sessão'}>
            <div className="mt-4 space-y-4">
              {editing === 'new' && (
                <FormField label="Aula *" htmlFor="sv-liveclass">
                  <Combobox
                    items={liveClassOptions}
                    value={form.liveClassId}
                    onValueChange={(v) => setForm((f) => ({ ...f, liveClassId: v }))}
                    placeholder="Selecionar aula…"
                    searchPlaceholder="Escreva para filtrar…"
                  />
                </FormField>
              )}
              <FormField label="Data e hora *" htmlFor="sv-date">
                <Input
                  id="sv-date"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Duração (min) *" htmlFor="sv-duration">
                <Input
                  id="sv-duration"
                  type="number"
                  min={15}
                  value={form.durationMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Local/sala" htmlFor="sv-location">
                <Input
                  id="sv-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Link da reunião" htmlFor="sv-meetingUrl">
                <Input
                  id="sv-meetingUrl"
                  value={form.meetingUrl}
                  onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Notas" htmlFor="sv-notes">
                <Textarea
                  id="sv-notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button intent="secondary" className="flex-1 justify-center" onClick={() => setEditing(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => save.mutate(undefined)}
                loading={save.isPending}
                disabled={!form.sessionDate || (editing === 'new' && !form.liveClassId)}
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
