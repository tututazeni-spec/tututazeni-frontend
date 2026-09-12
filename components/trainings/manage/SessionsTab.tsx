// components/trainings/manage/SessionsTab.tsx
// Gestão de sessões de uma formação — criar/editar/eliminar. Espelha
// CreateTrainingSessionDto/UpdateTrainingSessionDto (trainings.dto.ts).

'use client';

import { useState } from 'react';
import { Clock, MapPin, Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { fmtDate } from '../utils';
import type { Session, Training } from '../types';

const MODALITY_ITEMS = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrida' },
];

interface SessionsTabProps {
  training: Training;
}

interface SessionFormState {
  sessionDate: string;
  durationMinutes: string;
  modality: string;
  location: string;
  meetingUrl: string;
  maxParticipants: string;
  waitlistEnabled: boolean;
  notes: string;
}

const EMPTY: SessionFormState = {
  sessionDate: '',
  durationMinutes: '90',
  modality: 'PRESENTIAL',
  location: '',
  meetingUrl: '',
  maxParticipants: '0',
  waitlistEnabled: true,
  notes: '',
};

export function SessionsTab({ training }: SessionsTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [editing, setEditing] = useState<Session | 'new' | null>(null);
  const [form, setForm] = useState<SessionFormState>(EMPTY);

  const invalidateKeys = [queryKeys.trainings.detail(training.id)];

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
  };
  const openEdit = (s: Session) => {
    setForm({
      sessionDate: s.sessionDate.slice(0, 16),
      durationMinutes: String(s.durationMinutes),
      modality: s.modality,
      location: s.location ?? '',
      meetingUrl: s.meetingUrl ?? '',
      maxParticipants: String(s.maxParticipants),
      waitlistEnabled: s.waitlistEnabled,
      notes: '',
    });
    setEditing(s);
  };

  const save = useApiMutation(
    () => {
      const payload = {
        trainingId: training.id,
        sessionDate: new Date(form.sessionDate).toISOString(),
        durationMinutes: Number(form.durationMinutes) || 60,
        modality: form.modality,
        location: form.location || undefined,
        meetingUrl: form.meetingUrl || undefined,
        maxParticipants: Number(form.maxParticipants) || 0,
        waitlistEnabled: form.waitlistEnabled,
        notes: form.notes || undefined,
      };
      return editing !== 'new' && editing
        ? apiClient.put(`/trainings/sessions/${editing.id}`, payload)
        : apiClient.post('/trainings/sessions', payload);
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
    (id: number) => apiClient.delete(`/trainings/sessions/${id}`),
    {
      invalidateKeys,
      onSuccess: () => toast({ title: 'Sessão eliminada.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete(s: Session) {
    const ok = await confirm({
      title: `Eliminar sessão de ${fmtDate(s.sessionDate)}?`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) remove.mutate(s.id);
  }

  const sessions = training.sessions ?? [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus size={14} strokeWidth={1.75} />
          Nova sessão
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState title="Sem sessões" description="Cria a primeira sessão desta formação." />
      ) : (
        <Card className="divide-y divide-border">
          {sessions.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink">{fmtDate(s.sessionDate)}</div>
                <div className="mt-1 flex items-center gap-3 font-body text-xs text-ink-faint">
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} strokeWidth={1.75} /> {s.durationMinutes}min
                  </span>
                  {s.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} strokeWidth={1.75} /> {s.location}
                    </span>
                  )}
                  <span>{s._count.participants} inscritos</span>
                </div>
              </div>
              <Button intent="ghost" size="sm" onClick={() => openEdit(s)}>
                Editar
              </Button>
              <Button
                intent="danger"
                size="sm"
                onClick={() => onDelete(s)}
                loading={remove.isPending && remove.variables === s.id}
              >
                <Trash2 size={14} strokeWidth={1.75} />
              </Button>
            </div>
          ))}
        </Card>
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent title={editing === 'new' ? 'Nova sessão' : 'Editar sessão'}>
            <div className="mt-4 space-y-4">
              <FormField label="Data e hora" htmlFor="st-date">
                <Input
                  id="st-date"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Duração (min)" htmlFor="st-duration">
                  <Input
                    id="st-duration"
                    type="number"
                    min={15}
                    value={form.durationMinutes}
                    onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Modalidade" htmlFor="st-modality">
                  <Select
                    items={MODALITY_ITEMS}
                    value={form.modality}
                    onValueChange={(v) => setForm((f) => ({ ...f, modality: v }))}
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Local/sala" htmlFor="st-location">
                <Input
                  id="st-location"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <FormField label="Link da reunião (online/híbrida)" htmlFor="st-meetingUrl">
                <Input
                  id="st-meetingUrl"
                  value={form.meetingUrl}
                  onChange={(e) => setForm((f) => ({ ...f, meetingUrl: e.target.value }))}
                  className="w-full"
                />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Capacidade (0 = ilimitado)" htmlFor="st-max">
                  <Input
                    id="st-max"
                    type="number"
                    min={0}
                    value={form.maxParticipants}
                    onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
                    className="w-full"
                  />
                </FormField>
                <FormField label=" " htmlFor="st-waitlist">
                  <label className="flex items-center gap-2 pt-2 text-sm text-ink">
                    <input
                      id="st-waitlist"
                      type="checkbox"
                      checked={form.waitlistEnabled}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, waitlistEnabled: e.target.checked }))
                      }
                    />
                    Lista de espera
                  </label>
                </FormField>
              </div>
              <FormField label="Notas" htmlFor="st-notes">
                <Textarea
                  id="st-notes"
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
                disabled={!form.sessionDate}
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
