// components/evaluation360/GiveFeedbackModal.tsx
// Modal "Dar Feedback" do separador "Feedback" da Avaliação 360º.
//
// NOTA: o módulo evaluation360 corre 100% sobre dados mock (ver
// hooks/useEvaluation360.ts) — não há endpoint POST /evaluation360/feedback.
// Este modal valida a mensagem e devolve um ContinuousFeedback via `onCreate`,
// que a FeedbackTab acrescenta à lista localmente (mesmo padrão
// local-state-only usado em components/scalability/LoadTestModal.tsx).

'use client';

import { useState } from 'react';
import type { ContinuousFeedback } from './types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface GiveFeedbackModalProps {
  onClose: () => void;
  onCreate: (feedback: ContinuousFeedback) => void;
}

const TYPE_ITEMS = [
  { value: 'RECOGNITION', label: 'Reconhecimento' },
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
  { value: 'CHECK_IN', label: 'Check-in 1:1' },
];

export function GiveFeedbackModal({
  onClose,
  onCreate,
}: GiveFeedbackModalProps) {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const [type, setType] =
    useState<ContinuousFeedback['type']>('RECOGNITION');
  const [message, setMessage] = useState('');
  const [competency, setCompetency] = useState('');

  const canSubmit = message.trim().length >= 3;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const feedback: ContinuousFeedback = {
      id: `local-${Date.now()}`,
      fromName: me?.fullName ?? 'Eu',
      type,
      message: message.trim(),
      competency: competency.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    onCreate(feedback);
    notify({ title: 'Feedback enviado.', intent: 'success' });
    onClose();
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Dar Feedback"
        description="Feedback contínuo, fora dos ciclos formais de avaliação."
        className="max-w-lg"
      >
        <div className="mt-5 space-y-4">
          <FormField label="Tipo *" htmlFor="fb-type">
            <Select
              items={TYPE_ITEMS}
              value={type}
              onValueChange={(v) =>
                setType(v as ContinuousFeedback['type'])
              }
              className="w-full"
            />
          </FormField>

          <FormField
            label="Competência"
            htmlFor="fb-competency"
            hint="Opcional — competência a que o feedback se refere."
          >
            <Input
              id="fb-competency"
              value={competency}
              onChange={(e) => setCompetency(e.target.value)}
              placeholder="Ex.: Comunicação"
            />
          </FormField>

          <FormField label="Mensagem *" htmlFor="fb-message">
            <Textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Partilhe exemplos concretos e construtivos..."
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enviar Feedback
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
