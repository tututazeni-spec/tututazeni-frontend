// components/live-classes/PostponeModal.tsx
// Modal mínima para a ação "Adiar" (docs/aulas-ao-vivo.md secção 2) — exige
// nova data, motivo opcional.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import type { LiveClass } from './types';

export interface PostponeModalProps {
  lc: LiveClass;
  onClose: () => void;
}

export function PostponeModal({ lc, onClose }: PostponeModalProps) {
  const notify = useToast();
  const [scheduledAt, setScheduledAt] = useState('');
  const [reason, setReason] = useState('');

  const postpone = useApiMutation(
    () =>
      apiClient.post(`/live-classes/${lc.id}/postpone`, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        reason: reason.trim() || undefined,
      }),
    {
      invalidateKeys: [queryKeys.liveClasses.all],
      onSuccess: () => {
        notify({ title: 'Aula adiada', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent title={`Adiar "${lc.topic}"`} className="max-w-md">
        <div className="mt-4 space-y-4">
          <FormField label="Nova data e hora *" htmlFor="pm-date">
            <Input
              id="pm-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Motivo" htmlFor="pm-reason">
            <Textarea
              id="pm-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>
        <div className="mt-6 flex gap-3">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose} disabled={postpone.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => postpone.mutate(undefined)}
            loading={postpone.isPending}
            disabled={!scheduledAt}
          >
            Adiar aula
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
