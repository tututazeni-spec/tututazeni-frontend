// components/evaluation/CreateFormalEvaluationModal.tsx
// Modal "Nova Avaliação Formal" — cria um Assessment com type:'EXAM' via
// POST /assessments (backend alargado a EVAL_CREATOR_ROLES: ADMIN, GESTOR,
// RH, DIRECTOR, LIDER). Ligação a curso é opcional (null =
// avaliação geral); departamentos-alvo vazio = todos; perguntas de múltipla
// escolha (única/múltipla) e/ou resposta aberta são criadas na mesma
// submissão (create() já aceita `questions` aninhadas).

'use client';

import { useFormState } from '@/hooks/useFormState';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button, IconButton } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { PaginatedDepts } from '@/components/departments/types';
import type { Course, PaginatedCourses } from '@/components/courses/types';
import type {
  DraftQuestion,
  FormalQuestionType,
} from './formalEvaluationTypes';
import { Checkbox } from '@/components/ui/Checkbox';

export interface CreateFormalEvaluationModalProps {
  onClose: () => void;
}

const QUESTION_TYPE_ITEMS: { value: FormalQuestionType; label: string }[] = [
  { value: 'MULTIPLE_CHOICE_SINGLE', label: 'Múltipla escolha (uma opção)' },
  { value: 'MULTIPLE_CHOICE_MULTI', label: 'Múltipla escolha (várias opções)' },
  { value: 'OPEN_TEXT', label: 'Resposta aberta / desenvolvimento' },
];

function blankQuestion(): DraftQuestion {
  return {
    type: 'MULTIPLE_CHOICE_SINGLE',
    questionText: '',
    weight: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
    ],
  };
}

interface CreateFormalEvaluationModalFormValues {
  title: string;
  description: string;
  courseId: string;
  availableFrom: string;
  availableUntil: string;
  maxGrade: string;
  passingScore: string;
  allDepartments: boolean;
  targetDepartmentIds: number[];
  questions: DraftQuestion[];
  submitError: string;
}

export function CreateFormalEvaluationModal({
  onClose,
}: CreateFormalEvaluationModalProps) {
  const notify = useToast();

  const { values: formValues, set: setField } =
    useFormState<CreateFormalEvaluationModalFormValues>({
      title: '',
      description: '',
      courseId: '',
      availableFrom: '',
      availableUntil: '',
      maxGrade: '20',
      passingScore: '70',
      allDepartments: true,
      targetDepartmentIds: [],
      questions: [blankQuestion()],
      submitError: '',
    });
  const {
    title,
    description,
    courseId,
    availableFrom,
    availableUntil,
    maxGrade,
    passingScore,
    allDepartments,
    targetDepartmentIds,
    questions,
    submitError,
  } = formValues;

  const coursesQ = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list({ status: 'PUBLISHED', limit: 100 }),
    '/courses',
    { params: { status: 'PUBLISHED', limit: 100 } },
  );
  const courses = coursesQ.data?.data ?? [];

  const deptsQ = useApiQuery<PaginatedDepts>(
    queryKeys.departments.list({ limit: 200 }),
    '/departments',
    { params: { limit: 200 } },
  );
  const departments = deptsQ.data?.data ?? [];

  const toggleDepartment = (id: number) => {
    setField('targetDepartmentIds', (prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setField('questions', (prev) =>
      prev.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    );
  };
  const removeQuestion = (index: number) => {
    setField('questions', (prev) => prev.filter((_, i) => i !== index));
  };
  const addQuestion = () =>
    setField('questions', (prev) => [...prev, blankQuestion()]);

  const updateOption = (
    qIndex: number,
    oIndex: number,
    patch: Partial<{ text: string; isCorrect: boolean }>,
  ) => {
    setField('questions', (prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) => {
          if (j !== oIndex) {
            // Múltipla escolha de UMA opção: marcar uma como correcta desmarca as outras.
            return patch.isCorrect && q.type === 'MULTIPLE_CHOICE_SINGLE'
              ? { ...o, isCorrect: false }
              : o;
          }
          return { ...o, ...patch };
        });
        return { ...q, options };
      }),
    );
  };
  const addOption = (qIndex: number) => {
    setField('questions', (prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: [...q.options, { text: '', isCorrect: false }] }
          : q,
      ),
    );
  };
  const removeOption = (qIndex: number, oIndex: number) => {
    setField('questions', (prev) =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, j) => j !== oIndex) }
          : q,
      ),
    );
  };

  const datesOk =
    !availableFrom ||
    !availableUntil ||
    new Date(availableUntil).getTime() > new Date(availableFrom).getTime();

  const questionsOk =
    questions.length > 0 &&
    questions.every((q) => {
      if (!q.questionText.trim()) return false;
      if (q.type === 'OPEN_TEXT') return true;
      const filled = q.options.filter((o) => o.text.trim());
      return filled.length >= 2 && filled.some((o) => o.isCorrect);
    });

  const canSubmit = title.trim().length > 0 && datesOk && questionsOk;

  const createEvaluation = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<{ id: number }>('/assessments', body),
    {
      invalidateKeys: [queryKeys.formalEvaluations.list()],
      onSuccess: () => {
        notify({ title: 'Avaliação criada como rascunho', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setField(
          'submitError',
          e.message || 'Erro ao criar a avaliação. Tente novamente.',
        ),
    },
  );
  const loading = createEvaluation.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setField('submitError', '');
    createEvaluation.mutate({
      title: title.trim(),
      type: 'EXAM',
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(courseId ? { courseId: Number(courseId) } : {}),
      ...(availableFrom
        ? { availableFrom: new Date(availableFrom).toISOString() }
        : {}),
      ...(availableUntil
        ? { availableUntil: new Date(availableUntil).toISOString() }
        : {}),
      maxGrade: Number(maxGrade) || 20,
      passingScore: Number(passingScore) || 70,
      targetDepartmentIds: allDepartments ? [] : targetDepartmentIds,
      questions: questions.map((q, i) => ({
        type: q.type,
        questionText: q.questionText.trim(),
        weight: q.weight || 1,
        seq: i,
        ...(q.type !== 'OPEN_TEXT'
          ? { options: q.options.filter((o) => o.text.trim()) }
          : {}),
      })),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova avaliação formal"
        description="Fica como rascunho até seres tu a publicá-la."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-6">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {/* Identificação */}
          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Identificação
            </h3>
            <FormField label="Título *" htmlFor="fe-title">
              <Input
                id="fe-title"
                value={title}
                onChange={(e) => setField('title', e.target.value)}
                placeholder="Ex.: Avaliação Final — Compliance 2026"
              />
            </FormField>
            <FormField
              label="Descrição"
              htmlFor="fe-description"
              hint="Opcional."
            >
              <Textarea
                id="fe-description"
                rows={2}
                value={description}
                onChange={(e) => setField('description', e.target.value)}
              />
            </FormField>
            <FormField
              label="Formação associada"
              htmlFor="fe-course"
              hint="Opcional — deixa em «Geral» para uma avaliação sem curso associado."
            >
              <Select
                items={[
                  { value: '', label: 'Geral (sem curso)' },
                  ...courses.map((c: Course) => ({
                    value: String(c.id),
                    label: c.title,
                  })),
                ]}
                value={courseId}
                onValueChange={(v) => setField('courseId', v)}
              />
            </FormField>
          </div>

          {/* Disponibilidade e nota */}
          <div className="space-y-4">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Disponibilidade e nota
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Início" htmlFor="fe-start" hint="Opcional.">
                <Input
                  id="fe-start"
                  type="datetime-local"
                  value={availableFrom}
                  onChange={(e) => setField('availableFrom', e.target.value)}
                />
              </FormField>
              <FormField label="Fim" htmlFor="fe-end" hint="Opcional.">
                <Input
                  id="fe-end"
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setField('availableUntil', e.target.value)}
                  invalid={!datesOk}
                />
              </FormField>
            </div>
            {!datesOk && (
              <p className="text-xs text-danger-ink">
                A data/hora de fim tem de ser posterior à de início.
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label="Nota máxima"
                htmlFor="fe-maxgrade"
                hint="Ex.: 20, 10 ou 100."
              >
                <Input
                  id="fe-maxgrade"
                  type="number"
                  min={1}
                  value={maxGrade}
                  onChange={(e) => setField('maxGrade', e.target.value)}
                />
              </FormField>
              <FormField label="Nota de aprovação (%)" htmlFor="fe-passing">
                <Input
                  id="fe-passing"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setField('passingScore', e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Departamentos */}
          <div className="space-y-3">
            <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
              Departamentos
            </h3>
            <label className="flex items-center gap-2 text-sm text-ink">
              <Checkbox
                checked={allDepartments}
                onChange={(e) => setField('allDepartments', e.target.checked)}
              />
              Todos os departamentos
            </label>
            {!allDepartments && (
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-card border border-border p-3">
                {departments.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 text-sm text-ink"
                  >
                    <Checkbox
                      checked={targetDepartmentIds.includes(d.id)}
                      onChange={() => toggleDepartment(d.id)}
                    />
                    {d.name}
                  </label>
                ))}
                {departments.length === 0 && (
                  <span className="text-xs text-ink-faint">
                    A carregar departamentos…
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Perguntas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-xs font-bold uppercase tracking-wide text-ink-faint">
                Perguntas
              </h3>
              <Button intent="ghost" size="sm" onClick={addQuestion}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar pergunta
              </Button>
            </div>

            {questions.map((q, qIndex) => (
              <div
                key={qIndex}
                className="space-y-3 rounded-card border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <Select
                      items={QUESTION_TYPE_ITEMS}
                      value={q.type}
                      onValueChange={(v) =>
                        updateQuestion(qIndex, {
                          type: v as FormalQuestionType,
                          options:
                            v === 'OPEN_TEXT'
                              ? []
                              : q.options.length
                                ? q.options
                                : blankQuestion().options,
                        })
                      }
                    />
                    <Textarea
                      rows={2}
                      value={q.questionText}
                      onChange={(e) =>
                        updateQuestion(qIndex, { questionText: e.target.value })
                      }
                      placeholder={`Pergunta ${qIndex + 1}`}
                    />
                  </div>
                  {questions.length > 1 && (
                    <IconButton
                      icon={Trash2}
                      label="Remover pergunta"
                      intent="ghostDanger"
                      size="compact"
                      className="mt-1"
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                    />
                  )}
                </div>

                {q.type !== 'OPEN_TEXT' && (
                  <div className="space-y-2 pl-1">
                    {q.options.map((o, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type={
                            q.type === 'MULTIPLE_CHOICE_SINGLE'
                              ? 'radio'
                              : 'checkbox'
                          }
                          name={`fe-correct-${qIndex}`}
                          checked={o.isCorrect}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, {
                              isCorrect: e.target.checked,
                            })
                          }
                          className="h-4 w-4"
                        />
                        <Input
                          value={o.text}
                          onChange={(e) =>
                            updateOption(qIndex, oIndex, {
                              text: e.target.value,
                            })
                          }
                          placeholder={`Opção ${oIndex + 1}`}
                          className="flex-1"
                        />
                        {q.options.length > 2 && (
                          <IconButton
                            icon={Trash2}
                            label="Remover opção"
                            intent="ghostDanger"
                            size="xs"
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                          />
                        )}
                      </div>
                    ))}
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => addOption(qIndex)}
                    >
                      <Plus size={12} strokeWidth={1.75} />
                      Adicionar opção
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar avaliação
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
