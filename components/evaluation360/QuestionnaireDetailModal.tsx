// components/evaluation360/QuestionnaireDetailModal.tsx
// Detalhe de um questionário (docs/evaluation360.md §6): competências e
// perguntas. Em rascunho permite acrescentar/remover perguntas e publicar;
// publicado/arquivado fica só de leitura (o backend recusa alterações).

'use client';

import { useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import type { QuestionnaireQuestionItem, QuestionnaireStatus } from './types';

export interface QuestionnaireDetailModalProps {
  questionnaireId: string;
  canManage: boolean;
  onClose: () => void;
}

// O formulário do avaliador (EvaluationFormTab) trata tudo o que não é
// OPEN_TEXT como pergunta de escala — por isso só se oferecem estes tipos.
const TYPE_LABEL: Record<string, string> = {
  LIKERT: 'Escala de concordância',
  FREQUENCY: 'Escala de frequência (Nunca … Sempre)',
  OPEN_TEXT: 'Resposta livre',
};
const TYPE_ITEMS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));
const NO_COMPETENCY = 'NONE';

const STATUS_LABEL: Record<QuestionnaireStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

// O GET devolve a competência aninhada (competency.name); o tipo partilhado
// guarda o nome à superfície. Aceita as duas formas.
interface DetailCompetency {
  competencyId: number;
  order: number;
  name?: string;
  competency?: { name?: string } | null;
}
interface Detail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  instructions: string | null;
  scaleMin: number;
  scaleMax: number;
  status: QuestionnaireStatus;
  competencies: DetailCompetency[];
  questions: QuestionnaireQuestionItem[];
}

export function QuestionnaireDetailModal({
  questionnaireId,
  canManage,
  onClose,
}: QuestionnaireDetailModalProps) {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<Detail>(
    queryKeys.evaluation360.questionnaireDetail(questionnaireId),
    `/evaluation360/questionnaires/${questionnaireId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const [text, setText] = useState('');
  const [type, setType] = useState('FREQUENCY');
  const [competencyId, setCompetencyId] = useState(NO_COMPETENCY);
  const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState('');

  const isDraft = data?.status === 'DRAFT';
  const competencyName = (c: DetailCompetency) =>
    c.competency?.name ?? c.name ?? `#${c.competencyId}`;
  const competencyLabelById = new Map(
    (data?.competencies ?? []).map((c) => [c.competencyId, competencyName(c)]),
  );
  const competencyItems = [
    { value: NO_COMPETENCY, label: 'Sem competência' },
    ...(data?.competencies ?? []).map((c) => ({
      value: String(c.competencyId),
      label: competencyName(c),
    })),
  ];

  const addQuestion = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post(
        `/evaluation360/questionnaires/${questionnaireId}/questions`,
        body,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        setText('');
        setError('');
      },
      onError: () => setError('Não foi possível adicionar a pergunta.'),
    },
  );

  const removeQuestion = useApiMutation(
    (questionId: string) =>
      apiClient.delete(
        `/evaluation360/questionnaires/${questionnaireId}/questions/${questionId}`,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onError: () =>
        notify({
          title: 'Não foi possível remover a pergunta',
          intent: 'danger',
        }),
    },
  );

  const publish = useApiMutation(
    () =>
      apiClient.post(
        `/evaluation360/questionnaires/${questionnaireId}/publish`,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        notify({ title: 'Questionário publicado', intent: 'success' });
        onClose();
      },
      onError: () =>
        setError(
          'Não foi possível publicar. Confirma que tem pelo menos uma pergunta.',
        ),
    },
  );

  const handleAdd = () => {
    setError('');
    if (!text.trim()) return setError('Escreve o texto da pergunta.');
    addQuestion.mutate({
      text: text.trim(),
      type,
      isRequired,
      order: data?.questions.length ?? 0,
      ...(competencyId !== NO_COMPETENCY ? { competencyId } : {}),
      ...(type !== 'OPEN_TEXT'
        ? { scaleMin: data?.scaleMin, scaleMax: data?.scaleMax }
        : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.name ?? 'Questionário'}
        description={
          data
            ? `${data.code} · ${STATUS_LABEL[data.status]} · escala ${data.scaleMin}–${data.scaleMax}`
            : undefined
        }
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {isLoading || !data ? (
          <div className="mt-5">
            <Skeleton rows={4} />
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {data.description && (
              <p className="m-0 font-body text-sm text-ink-muted">
                {data.description}
              </p>
            )}

            <div>
              <span className="font-body text-sm font-medium text-ink">
                Competências ({data.competencies.length})
              </span>
              <p className="mt-1 mb-0 font-body text-sm text-ink-muted">
                {data.competencies.length > 0
                  ? data.competencies.map(competencyName).join(' · ')
                  : 'Nenhuma competência escolhida.'}
              </p>
            </div>

            <div>
              <span className="font-body text-sm font-medium text-ink">
                Perguntas ({data.questions.length})
              </span>
              {data.questions.length === 0 && (
                <p className="mt-1 mb-0 font-body text-sm text-ink-muted">
                  Ainda sem perguntas.
                  {isDraft && canManage
                    ? ' Acrescenta pelo menos uma para poderes publicar.'
                    : ''}
                </p>
              )}
              <ol className="mt-2 space-y-2 pl-0 list-none">
                {data.questions.map((q, i) => (
                  <li
                    key={q.id}
                    className="flex items-start justify-between gap-3 rounded-card border border-border bg-surface px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <div className="font-body text-sm text-ink">
                        {i + 1}. {q.text}
                      </div>
                      <div className="mt-0.5 font-body text-xs text-ink-muted">
                        {TYPE_LABEL[q.type] ?? q.type}
                        {q.competencyId != null &&
                          ` · ${competencyLabelById.get(q.competencyId) ?? `Competência #${q.competencyId}`}`}
                        {q.isRequired ? ' · Obrigatória' : ' · Opcional'}
                      </div>
                    </div>
                    {isDraft && canManage && (
                      <Button
                        intent="ghostDanger"
                        size="sm"
                        aria-label="Remover pergunta"
                        onClick={() => removeQuestion.mutate(q.id)}
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
                      </Button>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            {isDraft && canManage && (
              <div className="rounded-card border border-border p-3 space-y-3">
                <span className="font-body text-sm font-medium text-ink">
                  Nova pergunta
                </span>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
                    <AlertCircle size={16} strokeWidth={1.75} />
                    {error}
                  </div>
                )}
                <FormField label="Texto *" htmlFor="qd-text">
                  <Textarea
                    id="qd-text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    className="w-full"
                    rows={2}
                    placeholder="Ex.: Comunica as prioridades de forma clara à equipa."
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Tipo de resposta" htmlFor="qd-type">
                    <Select
                      items={TYPE_ITEMS}
                      value={type}
                      onValueChange={setType}
                      className="w-full"
                    />
                  </FormField>
                  <FormField label="Competência" htmlFor="qd-comp">
                    <Select
                      items={competencyItems}
                      value={competencyId}
                      onValueChange={setCompetencyId}
                      className="w-full"
                    />
                  </FormField>
                </div>
                <label className="flex items-center gap-2 font-body text-sm text-ink">
                  <Checkbox
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                  />
                  Resposta obrigatória
                </label>
                <Button
                  intent="secondary"
                  onClick={handleAdd}
                  loading={addQuestion.isPending}
                >
                  Adicionar pergunta
                </Button>
              </div>
            )}

            {!isDraft && (
              <p className="m-0 font-body text-xs text-ink-muted">
                Só os questionários em rascunho podem ser alterados.
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Fechar
          </Button>
          {isDraft && canManage && (
            <Button
              className="flex-1 justify-center"
              onClick={() => publish.mutate(undefined)}
              loading={publish.isPending}
              disabled={(data?.questions.length ?? 0) === 0}
            >
              Publicar
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
