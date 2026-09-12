// components/evaluation360/GiveFeedbackModal.tsx
// Modal "Dar Feedback" do separador "Feedback" da Avaliação 360º.
//
// Antes: o botão dava sempre feedback ao PRÓPRIO utilizador (toUserId vinha
// fixo do FeedbackTab, sempre "o meu" — ver hooks/useEvaluation360.ts, onde
// participantId é sempre myId). Feedback contínuo é entre colegas, não para
// si mesmo; agora a modal deixa escolher o colega (do mesmo departamento,
// via GET /users/directory) como destinatário real do POST
// /evaluation360/feedback/continuous.

'use client';

import { useState } from 'react';
import type { ContinuousFeedback } from './types';
import type { DirectoryUser } from '@/components/users/types';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface GiveFeedbackModalProps {
  onClose: () => void;
}

const TYPE_ITEMS = [
  { value: 'RECOGNITION', label: 'Reconhecimento' },
  { value: 'DEVELOPMENT', label: 'Desenvolvimento' },
  { value: 'CHECK_IN', label: 'Conversa Individual 1:1' },
];

interface CompetencyOption {
  id: number;
  name: string;
}

export function GiveFeedbackModal({ onClose }: GiveFeedbackModalProps) {
  const notify = useToast();
  const { data: me } = useCurrentUser();
  const [toUserId, setToUserId] = useState('');
  const [type, setType] = useState<ContinuousFeedback['type']>('RECOGNITION');
  const [message, setMessage] = useState('');
  const [competencyId, setCompetencyId] = useState('');

  // Colegas do mesmo departamento do utilizador autenticado. /users/directory
  // não tem restrição de @Roles — qualquer utilizador autenticado pode
  // pesquisar o directório interno para escolher a quem dar feedback.
  const departmentId = me?.department?.id;
  const { data: colleaguesData } = useApiQuery<DirectoryUser[]>(
    queryKeys.users.directory('', departmentId),
    '/users/directory',
    {
      params: { departmentId },
      enabled: !!departmentId,
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  const colleagueItems = (colleaguesData ?? [])
    .filter((u) => u != null && u.id != null && String(u.id) !== String(me?.id))
    .map((u) => ({
      value: String(u.id),
      label: u.position?.name ? `${u.fullName} — ${u.position.name}` : u.fullName,
    }));

  // Banco curado de competências (ver seedFeedbackTagCompetencies em
  // prisma/seed.ts, tags: ['FEEDBACK']) — evita mandar texto livre para um
  // campo que no backend é uma FK (Eval360Feedback.competencyId).
  const { data: competencies } = useApiQuery<CompetencyOption[]>(
    queryKeys.evaluation360.competencies('FEEDBACK'),
    '/evaluation360/competencies',
    { params: { tag: 'FEEDBACK' }, staleTime: STALE_TIME.STATIC },
  );
  const competencyItems = (competencies ?? []).map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  const canSubmit = message.trim().length >= 3 && !!toUserId;

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
          <FormField label="Colega *" htmlFor="fb-colleague" hint="Do teu departamento.">
            <Select
              items={colleagueItems}
              value={toUserId || undefined}
              onValueChange={setToUserId}
              placeholder={departmentId ? 'Escolher colega' : 'A carregar...'}
              className="w-full"
            />
          </FormField>

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
