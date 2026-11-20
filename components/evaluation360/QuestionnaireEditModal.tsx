// components/evaluation360/QuestionnaireEditModal.tsx
// Modal "Editar questionário" — só para questionários em rascunho (o backend
// recusa edições a publicados/arquivados). Edita nome, código, escala,
// descrição e instruções; as perguntas editam-se no detalhe do questionário.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Skeleton } from '@/components/ui/Skeleton';
import type { QuestionnaireDetail } from './types';

export interface QuestionnaireEditModalProps {
  questionnaireId: string;
  onClose: () => void;
}

export function QuestionnaireEditModal({
  questionnaireId,
  onClose,
}: QuestionnaireEditModalProps) {
  const { data, isLoading } = useApiQuery<QuestionnaireDetail>(
    queryKeys.evaluation360.questionnaireDetail(questionnaireId),
    `/evaluation360/questionnaires/${questionnaireId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Editar questionário"
        description="Só é possível editar questionários que ainda não foram publicados."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {isLoading || !data ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : (
          <EditForm questionnaire={data} onClose={onClose} />
        )}
      </ModalContent>
    </Modal>
  );
}

function EditForm({
  questionnaire,
  onClose,
}: {
  questionnaire: QuestionnaireDetail;
  onClose: () => void;
}) {
  const notify = useToast();
  const [name, setName] = useState(questionnaire.name);
  const [code, setCode] = useState(questionnaire.code);
  const [description, setDescription] = useState(
    questionnaire.description ?? '',
  );
  const [instructions, setInstructions] = useState(
    questionnaire.instructions ?? '',
  );
  const [scaleMin, setScaleMin] = useState(String(questionnaire.scaleMin));
  const [scaleMax, setScaleMax] = useState(String(questionnaire.scaleMax));
  const [error, setError] = useState('');

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.patch(`/evaluation360/questionnaires/${questionnaire.id}`, body),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        notify({ title: 'Questionário actualizado', intent: 'success' });
        onClose();
      },
      onError: () =>
        setError(
          'Não foi possível guardar. Confirma que o código ainda não existe e que o questionário continua em rascunho.',
        ),
    },
  );

  const handleSubmit = () => {
    setError('');
    const min = Number(scaleMin);
    const max = Number(scaleMax);
    if (!name.trim()) return setError('Indica o nome do questionário.');
    if (!code.trim()) return setError('Indica o código do questionário.');
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1)
      return setError('A escala tem de usar números inteiros a partir de 1.');
    if (max < 2 || max > 10 || max <= min)
      return setError(
        'O máximo da escala tem de ficar entre 2 e 10 e ser maior que o mínimo.',
      );
    save.mutate({
      name: name.trim(),
      code: code.trim(),
      scaleMin: min,
      scaleMax: max,
      description: description.trim(),
      instructions: instructions.trim(),
    });
  };

  return (
    <>
      <div className="mt-5 space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <FormField label="Nome *" htmlFor="qe-name">
          <Input
            id="qe-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full"
            maxLength={150}
          />
        </FormField>

        <FormField label="Código *" htmlFor="qe-code">
          <Input
            id="qe-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full"
            maxLength={60}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Escala — mínimo" htmlFor="qe-min">
            <Input
              id="qe-min"
              type="number"
              min={1}
              value={scaleMin}
              onChange={(e) => setScaleMin(e.target.value)}
              className="w-full"
            />
          </FormField>
          <FormField label="Escala — máximo" htmlFor="qe-max">
            <Input
              id="qe-max"
              type="number"
              min={2}
              max={10}
              value={scaleMax}
              onChange={(e) => setScaleMax(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <FormField label="Descrição" htmlFor="qe-description">
          <Textarea
            id="qe-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full"
            rows={2}
          />
        </FormField>

        <FormField
          label="Instruções para quem responde"
          htmlFor="qe-instructions"
        >
          <Textarea
            id="qe-instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full"
            rows={2}
          />
        </FormField>
      </div>

      <div className="mt-6 flex gap-3 border-t border-border pt-4">
        <Button
          intent="secondary"
          className="flex-1 justify-center"
          onClick={onClose}
        >
          Cancelar
        </Button>
        <Button
          className="flex-1 justify-center"
          onClick={handleSubmit}
          loading={save.isPending}
        >
          {save.isPending ? 'A guardar...' : 'Guardar alterações'}
        </Button>
      </div>
    </>
  );
}
