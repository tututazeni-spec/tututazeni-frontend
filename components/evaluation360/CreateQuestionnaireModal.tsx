// components/evaluation360/CreateQuestionnaireModal.tsx
// Modal "Novo Questionário" do separador "Questionários" (docs/evaluation360.md
// §6) — POST /evaluation360/questionnaires. Cria um molde reutilizável
// (competências + perguntas + escala) que pode depois ser escolhido em
// CreateCycleModal (campo "Questionário") para semear o ciclo, em vez de usar
// a doutrina-padrão de 8 competências ou uma lista avulsa.

'use client';

import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';

export interface CreateQuestionnaireModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

// Espelha o enum Eval360QuestionType do backend.
const QUESTION_TYPE_LABEL: Record<string, string> = {
  LIKERT: 'Escala (Likert)',
  FREQUENCY: 'Frequência',
  MULTIPLE_CHOICE: 'Escolha múltipla',
  YES_NO: 'Sim/Não',
  OPEN_TEXT: 'Comentário aberto',
  SITUATIONAL: 'Situacional',
};
const QUESTION_TYPE_ITEMS = Object.entries(QUESTION_TYPE_LABEL).map(
  ([value, label]) => ({
    value,
    label,
  }),
);

interface CompetencyOption {
  id: number;
  name: string;
}

interface DraftQuestion {
  text: string;
  type: string;
  competencyId: string;
  isRequired: boolean;
  allowComment: boolean;
}

const emptyQuestion = (): DraftQuestion => ({
  text: '',
  type: 'LIKERT',
  competencyId: '',
  isRequired: true,
  allowComment: true,
});

export function CreateQuestionnaireModal({
  onClose,
  onSuccess,
}: CreateQuestionnaireModalProps) {
  const notify = useToast();
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      code: '',
      description: '',
      instructions: '',
      scaleMin: '1',
      scaleMax: '5',
    },
    { name: [required()], code: [required()] },
  );

  const [competencyIds, setCompetencyIds] = useState<number[]>([]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([
    emptyQuestion(),
  ]);
  const [submitError, setSubmitError] = useState('');

  const { data: competencyCatalogue, isLoading: competenciesLoading } =
    useApiQuery<CompetencyOption[]>(
      queryKeys.evaluation360.competencies(),
      '/evaluation360/competencies',
      {
        staleTime: STALE_TIME.STATIC,
      },
    );

  const toggleCompetency = (id: number) =>
    setCompetencyIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) =>
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (index: number) =>
    setQuestions((prev) => prev.filter((_, i) => i !== index));

  const validQuestions = questions.filter((q) => q.text.trim());

  const create = useApiMutation(
    () =>
      apiClient.post('/evaluation360/questionnaires', {
        tenantId: 'default',
        name: form.name.trim(),
        code: form.code.trim(),
        ...(form.description.trim()
          ? { description: form.description.trim() }
          : {}),
        ...(form.instructions.trim()
          ? { instructions: form.instructions.trim() }
          : {}),
        scaleMin: Number(form.scaleMin) || 1,
        scaleMax: Number(form.scaleMax) || 5,
        competencies: competencyIds.map((id, order) => ({
          competencyId: String(id),
          order,
        })),
        questions: validQuestions.map((q, order) => ({
          text: q.text.trim(),
          type: q.type,
          isRequired: q.isRequired,
          allowComment: q.allowComment,
          order,
          ...(q.competencyId ? { competencyId: q.competencyId } : {}),
        })),
      }),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        notify({
          title: 'Questionário criado',
          description:
            'Já pode ser usado ao criar um novo ciclo de avaliação 360°.',
          intent: 'success',
        });
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError(
          'Erro ao criar o questionário. Verifica os dados e tenta de novo.',
        ),
    },
  );
  const loading = create.isPending;

  const localError = (() => {
    if (Number(form.scaleMax) <= Number(form.scaleMin))
      return 'A escala máxima tem de ser maior do que a mínima.';
    if (validQuestions.length === 0)
      return 'Adiciona pelo menos uma pergunta com texto.';
    return '';
  })();

  const error = validationError || submitError || localError;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    if (localError) return;
    create.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Questionário"
        description="Molde reutilizável de competências + perguntas para avaliações 360° (docs/evaluation360.md §6)."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome *" htmlFor="qz-name">
            <Input
              id="qz-name"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full"
              placeholder="Ex.: Questionário 360° — Liderança"
            />
          </FormField>

          <FormField label="Código *" htmlFor="qz-code">
            <Input
              id="qz-code"
              value={form.code}
              onChange={(e) => setField('code', e.target.value)}
              className="w-full"
              placeholder="Ex.: Q360-LID-01"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="qz-description">
            <Textarea
              id="qz-description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full"
              rows={2}
            />
          </FormField>

          <FormField
            label="Instruções para quem responde"
            htmlFor="qz-instructions"
          >
            <Textarea
              id="qz-instructions"
              value={form.instructions}
              onChange={(e) => setField('instructions', e.target.value)}
              className="w-full"
              rows={2}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Escala mínima" htmlFor="qz-scale-min">
              <Input
                id="qz-scale-min"
                type="number"
                min={1}
                value={form.scaleMin}
                onChange={(e) => setField('scaleMin', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Escala máxima" htmlFor="qz-scale-max">
              <Input
                id="qz-scale-max"
                type="number"
                min={2}
                max={10}
                value={form.scaleMax}
                onChange={(e) => setField('scaleMax', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div>
            <span className="font-body text-sm font-medium text-ink">
              Competências avaliadas
            </span>
            <p className="mt-1 mb-2 font-body text-xs text-ink-muted">
              Do catálogo real do módulo Competências — usadas para associar
              cada pergunta.
            </p>
            <div className="max-h-40 overflow-y-auto rounded-card border border-border p-2 space-y-1">
              {competenciesLoading && (
                <div className="px-1 py-1 text-sm text-ink-muted">
                  A carregar…
                </div>
              )}
              {(competencyCatalogue ?? []).map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-control px-1 py-1 font-body text-sm text-ink hover:bg-surface-sunken"
                >
                  <input
                    type="checkbox"
                    checked={competencyIds.includes(c.id)}
                    onChange={() => toggleCompetency(c.id)}
                    className="h-4 w-4 rounded border-border-strong"
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <span className="font-body text-sm font-medium text-ink">
                Perguntas *
              </span>
              <button
                type="button"
                onClick={addQuestion}
                className="flex items-center gap-1 font-body text-xs font-semibold text-brand hover:underline"
              >
                <Plus size={14} strokeWidth={2} /> Adicionar pergunta
              </button>
            </div>
            <div className="mt-2 space-y-3">
              {questions.map((q, i) => (
                <div
                  key={i}
                  className="rounded-card border border-border p-3 space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Textarea
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(i, { text: e.target.value })
                      }
                      className="w-full"
                      rows={2}
                      placeholder="Texto da pergunta…"
                    />
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(i)}
                        className="mt-1 shrink-0 text-ink-muted hover:text-danger-ink"
                        aria-label="Remover pergunta"
                      >
                        <Trash2 size={16} strokeWidth={1.75} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      items={QUESTION_TYPE_ITEMS}
                      value={q.type}
                      onValueChange={(v) => updateQuestion(i, { type: v })}
                      className="w-full"
                    />
                    <Select
                      items={[
                        { value: '', label: 'Sem competência associada' },
                        ...(competencyCatalogue ?? [])
                          .filter((c) => competencyIds.includes(c.id))
                          .map((c) => ({ value: String(c.id), label: c.name })),
                      ]}
                      value={q.competencyId}
                      onValueChange={(v) =>
                        updateQuestion(i, { competencyId: v })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 font-body text-xs text-ink-muted">
                      <input
                        type="checkbox"
                        checked={q.isRequired}
                        onChange={(e) =>
                          updateQuestion(i, { isRequired: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-border-strong"
                      />
                      Obrigatória
                    </label>
                    <label className="flex items-center gap-2 font-body text-xs text-ink-muted">
                      <input
                        type="checkbox"
                        checked={q.allowComment}
                        onChange={(e) =>
                          updateQuestion(i, { allowComment: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-border-strong"
                      />
                      Permite comentário
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            loading={loading}
          >
            {loading ? 'A criar...' : 'Criar Questionário'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
