// components/evaluation/CreateFormalEvaluationModal.tsx
// Modal "Nova Avaliação Formal" — cria um Assessment com type:'EXAM' via
// POST /assessments (backend alargado a EVAL_CREATOR_ROLES: ADMIN, RH,
// GESTOR, INSTRUCTOR, DIRECTOR, LIDER). Ligação a curso é opcional (null =
// avaliação geral); departamentos-alvo vazio = todos; perguntas de múltipla
// escolha (única/múltipla) e/ou resposta aberta são criadas na mesma
// submissão (create() já aceita `questions` aninhadas).

'use client';

import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { PaginatedDepts } from '@/components/departments/types';
import type { Course, PaginatedCourses } from '@/components/courses/types';
import type { DraftQuestion, FormalQuestionType } from './formalEvaluationTypes';

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

export function CreateFormalEvaluationModal({ onClose }: CreateFormalEvaluationModalProps) {
  const notify = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [availableFrom, setAvailableFrom] = useState('');
  const [availableUntil, setAvailableUntil] = useState('');
  const [maxGrade, setMaxGrade] = useState('20');
  const [passingScore, setPassingScore] = useState('70');
  const [allDepartments, setAllDepartments] = useState(true);
  const [targetDepartmentIds, setTargetDepartmentIds] = useState<number[]>([]);
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [submitError, setSubmitError] = useState('');

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
    setTargetDepartmentIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  };

  const updateQuestion = (index: number, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  };
  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };
  const addQuestion = () => setQuestions((prev) => [...prev, blankQuestion()]);

  const updateOption = (qIndex: number, oIndex: number, patch: Partial<{ text: string; isCorrect: boolean }>) => {
    setQuestions((prev) =>
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
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, { text: '', isCorrect: false }] } : q,
      ),
    );
  };
  const removeOption = (qIndex: number, oIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIndex ? { ...q, options: q.options.filter((_, j) => j !== oIndex) } : q,
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
    (body: Record<string, unknown>) => apiClient.post<{ id: number }>('/assessments', body),
    {
      invalidateKeys: [queryKeys.formalEvaluations.list()],
      onSuccess: () => {
        notify({ title: 'Avaliação criada como rascunho', intent: 'success' });
        onClose();
      },
      onError: (e) => setSubmitError(e.message || 'Erro ao criar a avaliação. Tente novamente.'),
    },
  );
  const loading = createEvaluation.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    createEvaluation.mutate({
      title: title.trim(),
      type: 'EXAM',
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(courseId ? { courseId: Number(courseId) } : {}),
      ...(availableFrom ? { availableFrom: new Date(availableFrom).toISOString() } : {}),
      ...(availableUntil ? { availableUntil: new Date(availableUntil).toISOString() } : {}),
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
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Avaliação Final — Compliance 2026"
              />
            </FormField>
            <FormField label="Descrição" htmlFor="fe-description" hint="Opcional.">
              <Textarea
                id="fe-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
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
                  ...courses.map((c: Course) => ({ value: String(c.id), label: c.title })),
                ]}
                value={courseId}
                onValueChange={setCourseId}
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
                  onChange={(e) => setAvailableFrom(e.target.value)}
                />
              </FormField>
              <FormField label="Fim" htmlFor="fe-end" hint="Opcional.">
                <Input
                  id="fe-end"
                  type="datetime-local"
                  value={availableUntil}
                  onChange={(e) => setAvailableUntil(e.target.value)}
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
              <FormField label="Nota máxima" htmlFor="fe-maxgrade" hint="Ex.: 20, 10 ou 100.">
                <Input
                  id="fe-maxgrade"
                  type="number"
                  min={1}
                  value={maxGrade}
                  onChange={(e) => setMaxGrade(e.target.value)}
                />
              </FormField>
              <FormField label="Nota de aprovação (%)" htmlFor="fe-passing">
                <Input
                  id="fe-passing"
                  type="number"
                  min={0}
                  max={100}
                  value={passingScore}
                  onChange={(e) => setPassingScore(e.target.value)}
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
              <input
                type="checkbox"
                checked={allDepartments}
                onChange={(e) => setAllDepartments(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong"
              />
              Todos os departamentos
            </label>
            {!allDepartments && (
              <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto rounded-card border border-border p-3">
                {departments.map((d) => (
                  <label key={d.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={targetDepartmentIds.includes(d.id)}
                      onChange={() => toggleDepartment(d.id)}
                      className="h-4 w-4 rounded border-border-strong"
                    />
                    {d.name}
                  </label>
                ))}
                {departments.length === 0 && (
                  <span className="text-xs text-ink-faint">A carregar departamentos…</span>
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
              <div key={qIndex} className="space-y-3 rounded-card border border-border p-4">
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
                      onChange={(e) => updateQuestion(qIndex, { questionText: e.target.value })}
                      placeholder={`Pergunta ${qIndex + 1}`}
                    />
                  </div>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(qIndex)}
                      aria-label="Remover pergunta"
                      className="mt-1 text-ink-faint hover:text-danger"
                    >
                      <Trash2 size={16} strokeWidth={1.75} />
                    </button>
                  )}
                </div>

                {q.type !== 'OPEN_TEXT' && (
                  <div className="space-y-2 pl-1">
                    {q.options.map((o, oIndex) => (
                      <div key={oIndex} className="flex items-center gap-2">
                        <input
                          type={q.type === 'MULTIPLE_CHOICE_SINGLE' ? 'radio' : 'checkbox'}
                          name={`fe-correct-${qIndex}`}
                          checked={o.isCorrect}
                          onChange={(e) => updateOption(qIndex, oIndex, { isCorrect: e.target.checked })}
                          className="h-4 w-4"
                        />
                        <Input
                          value={o.text}
                          onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                          placeholder={`Opção ${oIndex + 1}`}
                          className="flex-1"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(qIndex, oIndex)}
                            aria-label="Remover opção"
                            className="text-ink-faint hover:text-danger"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    ))}
                    <Button intent="ghost" size="sm" onClick={() => addOption(qIndex)}>
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
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
            Criar avaliação
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
