// components/trainings/manage/SessionsTab.tsx
// Gestão de sessões de uma formação — criar/editar/eliminar. Espelha
// CreateTrainingSessionDto/UpdateTrainingSessionDto (trainings.dto.ts).

'use client';

import { useState } from 'react';
import {
  CalendarClock,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { INVERT_ON_HOVER } from '../buttonStyles';
import { fmtDate } from '../utils';
import type { Session, Training } from '../types';
import { Checkbox } from '@/components/ui/Checkbox';

const MODALITY_ITEMS = [
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrida' },
];

const MODALITY_LABEL: Record<string, string> = Object.fromEntries(
  MODALITY_ITEMS.map((m) => [m.value, m.label]),
);

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
        <Button size="sm" className={INVERT_ON_HOVER} onClick={openNew}>
          <Plus size={14} strokeWidth={1.75} />
          Nova sessão
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="Sem sessões"
          description="Cria a primeira sessão desta formação."
        />
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const busy = remove.isPending && remove.variables === s.id;
            return (
              <div
                key={s.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-[#2F6FD6] bg-[#F3F7FE] px-4 py-3"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2F7BF5] text-white">
                  <CalendarClock size={26} strokeWidth={1.75} />
                </div>
                <div className="hidden h-14 w-px bg-[#2F6FD6]/40 sm:block" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold text-[#0F1F3D]">
                      {fmtDate(s.sessionDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0A66F5] px-3 py-1 text-sm font-semibold text-white">
                      <span className="h-2 w-2 rounded-full bg-white" />
                      {MODALITY_LABEL[s.modality] ?? s.modality}
                    </span>
                    {s.waitlistEnabled && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E3E9F5] px-3 py-1 text-sm font-semibold text-[#0F1F3D]">
                        <span className="h-2 w-2 rounded-full bg-[#7A869E]" />
                        Lista de espera
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#0F1F3D]">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock size={16} strokeWidth={1.75} />
                      <b>{s.durationMinutes} min</b>
                      <span className="text-[#4B5873]">Duração</span>
                    </span>
                    <span className="h-4 w-px bg-[#2F6FD6]/40" />
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={16} strokeWidth={1.75} />
                      <b>{s.location ?? '—'}</b>
                      <span className="text-[#4B5873]">Local</span>
                    </span>
                    <span className="h-4 w-px bg-[#2F6FD6]/40" />
                    <span className="inline-flex items-center gap-1.5">
                      <Users size={16} strokeWidth={1.75} />
                      <b>
                        {s.maxParticipants > 0
                          ? `${s._count.participants}/${s.maxParticipants}`
                          : s._count.participants}
                      </b>
                      <span className="text-[#4B5873]">inscritos</span>
                    </span>
                  </div>
                </div>
                <div className="hidden h-14 w-px bg-[#2F6FD6]/40 sm:block" />
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A66F5] text-white transition hover:bg-[#0F1F3D]"
                    aria-label={`Editar sessão de ${fmtDate(s.sessionDate)}`}
                    title="Editar"
                    onClick={() => openEdit(s)}
                  >
                    <Pencil size={18} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0A66F5] text-white transition hover:bg-red-500 disabled:opacity-50"
                    aria-label={`Eliminar sessão de ${fmtDate(s.sessionDate)}`}
                    title="Eliminar"
                    disabled={busy}
                    onClick={() => onDelete(s)}
                  >
                    <Trash2 size={18} strokeWidth={1.75} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && (
        <Modal open onOpenChange={(open) => !open && setEditing(null)}>
          <ModalContent
            title={editing === 'new' ? 'Nova sessão' : 'Editar sessão'}
          >
            <div className="mt-4 space-y-4">
              <FormField label="Data e hora" htmlFor="st-date">
                <Input
                  id="st-date"
                  type="datetime-local"
                  value={form.sessionDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sessionDate: e.target.value }))
                  }
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
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        durationMinutes: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </FormField>
                <FormField label="Modalidade" htmlFor="st-modality">
                  <Select
                    items={MODALITY_ITEMS}
                    value={form.modality}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, modality: v }))
                    }
                    className="w-full"
                  />
                </FormField>
              </div>
              <FormField label="Local/sala" htmlFor="st-location">
                <Input
                  id="st-location"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  className="w-full"
                />
              </FormField>
              <FormField
                label="Link da reunião (online/híbrida)"
                htmlFor="st-meetingUrl"
              >
                <Input
                  id="st-meetingUrl"
                  value={form.meetingUrl}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, meetingUrl: e.target.value }))
                  }
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
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        maxParticipants: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </FormField>
                <FormField label=" " htmlFor="st-waitlist">
                  <label className="flex items-center gap-2 pt-2 text-sm text-ink">
                    <Checkbox
                      id="st-waitlist"

                      checked={form.waitlistEnabled}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          waitlistEnabled: e.target.checked,
                        }))
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
            <div className="mt-6 flex gap-3 border-t border-border pt-4">
              <Button
                intent="secondary"
                className="flex-1 justify-center"
                onClick={() => setEditing(null)}
              >
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
