// components/courses-modulos/QuizEditorModal.tsx
// Criação/edição do quiz de uma lição (docs/06-modulo-courses.md secção
// "8. Avaliação da lição"). O backend (courses.service.ts createQuiz/
// updateQuiz/submitQuiz) já suportava tudo isto — não havia nenhuma UI.

'use client';

import { useEffect, useState } from 'react';
import { FileQuestion, Plus, Trash2, X } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Skeleton } from './../courses/shared';

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN';

interface QuizQuestionApi {
  id: number;
  question: string;
  type: QuestionType;
  options: string | null;
  correctAnswer: string | null;
  points: number;
}

interface QuizApi {
  id: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
  showCorrectAnswers: boolean;
  autoFeedback: boolean;
  questions: QuizQuestionApi[];
}

interface QuestionRow {
  question: string;
  type: QuestionType;
  options: { text: string; isCorrect: boolean }[];
  points: number;
}

const QUESTION_TYPE_ITEMS = [
  { value: 'MULTIPLE_CHOICE', label: 'Escolha múltipla' },
  { value: 'TRUE_FALSE', label: 'Verdadeiro/Falso' },
  { value: 'OPEN', label: 'Pergunta aberta (correcção manual)' },
];

function emptyQuestion(type: QuestionType = 'MULTIPLE_CHOICE'): QuestionRow {
  if (type === 'TRUE_FALSE') {
    return { question: '', type, options: [{ text: 'Verdadeiro', isCorrect: true }, { text: 'Falso', isCorrect: false }], points: 1 };
  }
  if (type === 'OPEN') {
    return { question: '', type, options: [], points: 1 };
  }
  return { question: '', type, options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }], points: 1 };
}

function rowsFromApi(questions: QuizQuestionApi[]): QuestionRow[] {
  return questions.map((q) => {
    if (q.type === 'OPEN') return { question: q.question, type: q.type, options: [], points: q.points };
    const opts: { text: string; isCorrect: boolean }[] = q.options ? JSON.parse(q.options) : [];
    return { question: q.question, type: q.type, options: opts, points: q.points };
  });
}

interface QuizEditorModalProps {
  lessonId: number;
  lessonTitle: string;
  onClose: () => void;
}

export function QuizEditorModal({ lessonId, lessonTitle, onClose }: QuizEditorModalProps) {
  const notify = useToast();
  const { data: quiz, isLoading } = useApiQuery<QuizApi | null>(
    queryKeys.courses.lessonQuiz(lessonId),
    `/courses/lessons/${lessonId}/quiz`,
    { staleTime: 0 },
  );

  const [title, setTitle] = useState('Avaliação');
  const [passingScore, setPassingScore] = useState(70);
  const [maxAttempts, setMaxAttempts] = useState(0);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState('');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleAnswers, setShuffleAnswers] = useState(false);
  const [showCorrectAnswers, setShowCorrectAnswers] = useState(true);
  const [autoFeedback, setAutoFeedback] = useState(true);
  const [questions, setQuestions] = useState<QuestionRow[]>([emptyQuestion()]);

  useEffect(() => {
    if (!quiz) return;
    setTitle(quiz.title);
    setPassingScore(quiz.passingScore);
    setMaxAttempts(quiz.maxAttempts);
    setTimeLimitMinutes(quiz.timeLimitMinutes != null ? String(quiz.timeLimitMinutes) : '');
    setShuffleQuestions(quiz.shuffleQuestions);
    setShuffleAnswers(quiz.shuffleAnswers);
    setShowCorrectAnswers(quiz.showCorrectAnswers);
    setAutoFeedback(quiz.autoFeedback);
    setQuestions(quiz.questions.length > 0 ? rowsFromApi(quiz.questions) : [emptyQuestion()]);
  }, [quiz]);

  const payload = () => ({
    title,
    passingScore,
    maxAttempts,
    timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
    shuffleQuestions,
    shuffleAnswers,
    showCorrectAnswers,
    autoFeedback,
    questions: questions
      .filter((q) => q.question.trim())
      .map((q) => ({
        question: q.question,
        type: q.type,
        options: q.type === 'OPEN' ? undefined : q.options,
        correctAnswer:
          q.type === 'OPEN' ? undefined : q.options.find((o) => o.isCorrect)?.text,
        points: q.points,
      })),
  });

  const save = useApiMutation(
    () =>
      quiz
        ? apiClient.put(`/courses/quizzes/${quiz.id}`, payload())
        : apiClient.post(`/courses/lessons/${lessonId}/quiz`, payload()),
    {
      invalidateKeys: [queryKeys.courses.lessonQuiz(lessonId)],
      onSuccess: () => {
        notify({ title: 'Quiz guardado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const canSave = title.trim() && questions.some((q) => q.question.trim());

  function updateQuestion(idx: number, patch: Partial<QuestionRow>) {
    setQuestions((rows) => rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }
  function updateOption(qIdx: number, oIdx: number, patch: Partial<{ text: string; isCorrect: boolean }>) {
    setQuestions((rows) =>
      rows.map((r, i) => {
        if (i !== qIdx) return r;
        const options = r.options.map((o, j) => {
          if (j === oIdx) return { ...o, ...patch };
          // MULTIPLE_CHOICE: só uma opção correcta (mesma regra do grading em submitQuiz).
          if (patch.isCorrect && r.type === 'MULTIPLE_CHOICE') return { ...o, isCorrect: false };
          return o;
        });
        return { ...r, options };
      }),
    );
  }

  return (
    <div className="fixed inset-0 z-600 bg-black/45 flex items-center justify-center p-4" onClick={onClose}>
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <FileQuestion size={18} strokeWidth={1.75} /> Avaliação — {lessonTitle}
            </h2>
            <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink">
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {isLoading ? (
            <Skeleton rows={4} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Título" htmlFor="quiz-title">
                  <Input id="quiz-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </FormField>
                <FormField label="Nota mínima (%)" htmlFor="quiz-passing-score">
                  <Input
                    id="quiz-passing-score"
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                  />
                </FormField>
                <FormField label="Nº de tentativas (0 = ilimitadas)" htmlFor="quiz-max-attempts">
                  <Input
                    id="quiz-max-attempts"
                    type="number"
                    min={0}
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  />
                </FormField>
                <FormField label="Tempo limite (minutos)" htmlFor="quiz-time-limit">
                  <Input
                    id="quiz-time-limit"
                    type="number"
                    min={0}
                    value={timeLimitMinutes}
                    onChange={(e) => setTimeLimitMinutes(e.target.value)}
                    placeholder="Sem limite"
                  />
                </FormField>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-ink-muted">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} />
                  Embaralhar perguntas
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={shuffleAnswers} onChange={(e) => setShuffleAnswers(e.target.checked)} />
                  Embaralhar respostas
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={showCorrectAnswers} onChange={(e) => setShowCorrectAnswers(e.target.checked)} />
                  Mostrar respostas correctas
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={autoFeedback} onChange={(e) => setAutoFeedback(e.target.checked)} />
                  Feedback automático
                </label>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="m-0 mb-3 text-sm font-bold text-ink">Perguntas</h3>
                <div className="flex flex-col gap-4">
                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-lg border border-border p-3">
                      <div className="flex items-start gap-2 mb-2">
                        <Textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                          placeholder="Enunciado da pergunta"
                          rows={2}
                          className="flex-1 resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => setQuestions((rows) => rows.filter((_, i) => i !== qIdx))}
                          className="text-ink-faint hover:text-danger mt-1"
                          aria-label="Remover pergunta"
                        >
                          <Trash2 size={16} strokeWidth={1.75} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Select
                          items={QUESTION_TYPE_ITEMS}
                          value={q.type}
                          onValueChange={(v) => updateQuestion(qIdx, emptyQuestion(v as QuestionType))}
                          className="w-56"
                        />
                        <Input
                          type="number"
                          min={1}
                          value={q.points}
                          onChange={(e) => updateQuestion(qIdx, { points: Number(e.target.value) })}
                          className="w-20"
                          aria-label="Pontos"
                        />
                        <span className="text-xs text-ink-faint">pontos</span>
                      </div>

                      {q.type !== 'OPEN' && (
                        <div className="flex flex-col gap-1.5 pl-2">
                          {q.options.map((o, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${qIdx}`}
                                checked={o.isCorrect}
                                onChange={() => updateOption(qIdx, oIdx, { isCorrect: true })}
                              />
                              <Input
                                value={o.text}
                                onChange={(e) => updateOption(qIdx, oIdx, { text: e.target.value })}
                                disabled={q.type === 'TRUE_FALSE'}
                                className="flex-1"
                                placeholder="Opção"
                              />
                              {q.type === 'MULTIPLE_CHOICE' && q.options.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuestion(qIdx, { options: q.options.filter((_, i) => i !== oIdx) })
                                  }
                                  className="text-ink-faint hover:text-danger"
                                  aria-label="Remover opção"
                                >
                                  <X size={14} strokeWidth={1.75} />
                                </button>
                              )}
                            </div>
                          ))}
                          {q.type === 'MULTIPLE_CHOICE' && (
                            <button
                              type="button"
                              onClick={() =>
                                updateQuestion(qIdx, { options: [...q.options, { text: '', isCorrect: false }] })
                              }
                              className="self-start text-xs text-accent hover:text-accent-hover mt-1"
                            >
                              + Adicionar opção
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => setQuestions((rows) => [...rows, emptyQuestion()])}
                >
                  <Plus size={14} strokeWidth={1.75} /> Adicionar pergunta
                </Button>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" intent="secondary" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={!canSave || save.isPending}
                  onClick={() => save.mutate(undefined)}
                >
                  {save.isPending ? 'A guardar…' : 'Guardar quiz'}
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
