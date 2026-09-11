// components/evaluation360/GiveFeedbackModal.tsx
// Modal "Dar Feedback" do separador "Feedback" da Avaliação 360º.
//
// Antes: o módulo corria 100% sobre dados mock — este modal só validava a
// mensagem e devolvia um ContinuousFeedback local via `onCreate`, sem
// persistir nada (POST /evaluation360/feedback/continuous não era chamado).
// Agora liga a esse endpoint real; `toUserId` é sempre o participante que
// está a ser visto na página (ver Evaluation360View.tsx).

'use client';

import { useState } from 'react';
import type { ContinuousFeedback } from './types';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface GiveFeedbackModalProps {
  toUserId: string;
  onClose: () => void;
}

const TYPE_ITEMS = [
  { value: 'RECOGNITION', label: 'Reconhecimento' },
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
  { value: 'CHECK_IN', label: 'Check-in 1:1' },
];

interface CompetencyOption {
  id: number;
  name: string;
}

export function GiveFeedbackModal({ toUserId, onClose }: GiveFeedbackModalProps) {
  const notify = useToast();
  const [type, setType] = useState<ContinuousFeedback['type']>('RECOGNITION');
  const [message, setMessage] = useState('');
  const [competencyId, setCompetencyId] = useState('');

  // Banco fixo de 8 competências (ver prisma/seed.ts) — evita mandar texto
  // livre para um campo que no backend é uma FK (Eval360Feedback.competencyId).
  const { data: competencies } = useApiQuery<CompetencyOption[]>(
    queryKeys.evaluation360.competencies(),
    '/evaluation360/competencies',
    { staleTime: STALE_TIME.STATIC },
  );
  const competencyItems = (competencies ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const canSubmit = message.trim().length >= 3;

  const create = useApiMutation(
    () =>
      apiClient.post('/evaluation360/feedback/continuous', {
        tenantId: 'default',
        toUserId,
        type,
        message: message.trim(),
        competencyId: competencyId || undefined,
      }),
    {
      invalidateKeys: [queryKeys.evaluation360.feedbacks(toUserId)],
      onSuccess: () => {
        notify({ title: 'Feedback enviado.', intent: 'success' });
        onClose();
      },
      onError: () =>
        notify({ title: 'Erro ao enviar feedback. Tenta novamente.', intent: 'danger' }),
    },
  );

  const handleSubmit = () => {
    if (!canSubmit) return;
    create.mutate(undefined);
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
              onValueChange={(v) => setType(v as ContinuousFeedback['type'])}
              className="w-full"
            />
          </FormField>

          <FormField
            label="Competência"
            htmlFor="fb-competency"
            hint="Opcional — competência a que o feedback se refere."
          >
            <Select
              items={competencyItems}
              value={competencyId || undefined}
              onValueChange={setCompetencyId}
              placeholder="Nenhuma em especial"
              className="w-full"
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
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={create.isPending}>
            Enviar Feedback
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
