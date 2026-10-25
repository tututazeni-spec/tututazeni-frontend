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
import {
  NAVY_ACTION,
  NavyBadge,
  NavyCard,
} from '@/components/courses/NavyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { INVERT_ON_HOVER } from '../buttonStyles';
import { fmtDate } from '../utils';
import type { Session, Training } from '../types';

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
              <NavyCard
                key={s.id}
                compact
                seed={training.colorIndex ?? training.id}
                image={training.thumbnailUrl}
                kicker="Sessão"
                kickerIcon={CalendarClock}
                title={fmtDate(s.sessionDate)}
                badge={
                  <>
                    <NavyBadge tone="info">
                      {MODALITY_LABEL[s.modality] ?? s.modality}
                    </NavyBadge>
                    {s.waitlistEnabled && (
                      <NavyBadge tone="neutral">Lista de espera</NavyBadge>
                    )}
                  </>
                }
                infos={[
                  {
                    icon: Clock,
                    value: `${s.durationMinutes} min`,
                    label: 'Duração',
                  },
                  {
                    icon: MapPin,
                    value: s.location ?? '—',
                    label: 'Local',
                  },
                  {
                    icon: Users,
                    value:
                      s.maxParticipants > 0
                        ? `${s._count.participants}/${s.maxParticipants}`
                        : String(s._count.participants),
                    label: 'Inscritos',
                  },
                ]}
                actions={
                  <>
                    <Button
                      type="button"
                      intent="onDarkGhost"
                      size="sm"
                      aria-label={`Editar sessão de ${fmtDate(s.sessionDate)}`}
                      title="Editar"
                      onClick={() => openEdit(s)}
                    >
                      <Pencil size={15} strokeWidth={1.75} />
                    </Button>
                    <button
                      type="button"
                      className={`${NAVY_ACTION} hover:!bg-red-500 hover:!text-white`}
                      aria-label={`Eliminar sessão de ${fmtDate(s.sessionDate)}`}
                      title="Eliminar"
                      disabled={busy}
                      onClick={() => onDelete(s)}
                    >
                      <Trash2 size={15} strokeWidth={1.75} />
                    </button>
                  </>
                }
              />
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
                    <input
                      id="st-waitlist"
                      type="checkbox"
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
