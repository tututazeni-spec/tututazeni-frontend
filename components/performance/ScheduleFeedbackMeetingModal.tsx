// components/performance/ScheduleFeedbackMeetingModal.tsx
// Modal "Agendar reunião de feedback" (secção 19 do formulário) — cria uma
// reunião 1:1 (POST /performance/:id/schedule-meeting → OneOnOneService)
// entre o avaliador e o avaliado de uma avaliação publicada.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface ScheduleFeedbackMeetingModalProps {
  reviewId: number;
  userName: string;
  onClose: () => void;
}

export function ScheduleFeedbackMeetingModal({
  reviewId,
  userName,
  onClose,
}: ScheduleFeedbackMeetingModalProps) {
  const notify = useToast();
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');

  const schedule = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post(`/performance/${reviewId}/schedule-meeting`, body),
    {
      invalidateKeys: [queryKeys.performance.team()],
      onSuccess: () => {
        notify({ title: 'Reunião de feedback agendada', intent: 'success' });
        onClose();
      },
      onError: (e) => setSubmitError(e.message || 'Erro ao agendar a reunião. Tente novamente.'),
    },
  );

  const handleSubmit = () => {
    if (!scheduledAt || schedule.isPending) return;
    setSubmitError('');
    schedule.mutate({
      scheduledAt: new Date(scheduledAt).toISOString(),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={`Agendar reunião de feedback — ${userName}`} className="max-w-md">
        <div className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}
          <FormField label="Data e hora *" htmlFor="sm-date">
            <Input
              id="sm-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </FormField>
          <FormField label="Local / link" htmlFor="sm-location" hint="Opcional.">
            <Input
              id="sm-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Sala 3 ou link da videochamada"
            />
          </FormField>
          <FormField label="Notas / agenda" htmlFor="sm-notes" hint="Opcional.">
            <Textarea id="sm-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={schedule.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!scheduledAt} loading={schedule.isPending}>
            Agendar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
