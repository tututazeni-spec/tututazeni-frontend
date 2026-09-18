// components/courses-learn/QuizPlayer.tsx
// Resposta ao quiz de uma aula, do lado do aluno (docs/06-modulo-courses.md
// secção 8 — "Avaliação da lição"). O backend (submitQuiz) já suportava
// tentativas, embaralhar, feedback automático e nota mínima; não havia UI.

'use client';

import { useState } from 'react';
import { Check, X, FileQuestion } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/courses/shared';

interface QuizQuestion {
  id: number;
  question: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'OPEN';
  points: number;
  options: { text?: string }[] | null;
}

interface QuizForAttempt {
  id: number;
  title: string;
  passingScore: number;
  maxAttempts: number;
  timeLimitMinutes: number | null;
  attemptsUsed: number;
  attemptsRemaining: number | null;
  myAttempts: Array<{ id: number; score: number; passed: boolean; submittedAt: string }>;
  questions: QuizQuestion[];
}

interface SubmitResult {
  score: number;
  passed: boolean;
  passingScore: number;
  feedback?: string;
  results: Array<{
    questionId: number;
    answer?: string;
    correct: boolean | null;
    correctAnswer?: string | null;
    note?: string;
  }>;
}

interface QuizPlayerProps {
  quizId: number;
}

export function QuizPlayer({ quizId }: QuizPlayerProps) {
  const notify = useToast();
  const { data: quiz, isLoading } = useApiQuery<QuizForAttempt>(
    queryKeys.courses.quizAttempt(quizId),
    `/courses/quizzes/${quizId}/attempt`,
    { staleTime: 0 },
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitResult | null>(null);

  const submit = useApiMutation<SubmitResult, void>(
    () => apiClient.post(`/courses/quizzes/${quizId}/submit`, { answers }),
    {
      invalidateKeys: [queryKeys.courses.quizAttempt(quizId)],
      onSuccess: (data) => setResult(data),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !quiz) return <Skeleton rows={3} />;

  const noAttemptsLeft = quiz.attemptsRemaining === 0;
  const allAnswered = quiz.questions.every((q) => (answers[String(q.id)] ?? '').trim());

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <FileQuestion size={18} strokeWidth={1.75} className="text-ink-muted" />
        <h3 className="m-0 text-sm font-bold text-ink">{quiz.title}</h3>
        <Badge intent="neutral">Nota mínima {quiz.passingScore}%</Badge>
        {quiz.maxAttempts > 0 && (
          <Badge intent={noAttemptsLeft ? 'danger' : 'neutral'}>
            {quiz.attemptsRemaining} tentativa(s) restante(s)
          </Badge>
        )}
      </div>

      {result ? (
        <div className="space-y-3">
          <div
            className={`rounded-lg p-3 text-sm font-medium ${
              result.passed ? 'bg-success-subtle text-success-ink' : 'bg-danger-subtle text-danger-ink'
            }`}
          >
            {result.passed ? <Check size={14} className="inline mr-1" /> : <X size={14} className="inline mr-1" />}
            {result.feedback ?? (result.passed ? 'Aprovado' : 'Reprovado')} — {result.score}% (mínimo {result.passingScore}%)
          </div>
          {result.results.map((r) => {
            const q = quiz.questions.find((qq) => qq.id === r.questionId);
            return (
              <div key={r.questionId} className="text-xs text-ink-muted border-b border-border pb-2 last:border-0">
                <div className="font-medium text-ink">{q?.question}</div>
                <div>A tua resposta: {r.answer ?? '—'}</div>
                {r.correct === false && r.correctAnswer && (
                  <div className="text-success-ink">Resposta certa: {r.correctAnswer}</div>
                )}
                {r.note && <div className="italic">{r.note}</div>}
              </div>
            );
          })}
          {!noAttemptsLeft && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              Tentar novamente
            </Button>
          )}
        </div>
      ) : noAttemptsLeft ? (
        <p className="text-sm text-ink-faint">
          Já não tens tentativas disponíveis para este quiz.
        </p>
      ) : (
        <div className="space-y-4">
          {quiz.questions.map((q) => (
            <div key={q.id}>
              <div className="text-sm font-medium text-ink mb-1.5">{q.question}</div>
              {q.type === 'OPEN' ? (
                <Textarea
                  value={answers[String(q.id)] ?? ''}
                  onChange={(e) => setAnswers((a) => ({ ...a, [String(q.id)]: e.target.value }))}
                  rows={2}
                  className="w-full resize-none"
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {(q.options ?? []).map((o, i) => (
                    <label key={i} className="flex items-center gap-2 text-sm text-ink-muted">
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={answers[String(q.id)] === o.text}
                        onChange={() => setAnswers((a) => ({ ...a, [String(q.id)]: o.text ?? '' }))}
                      />
                      {o.text}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Button disabled={!allAnswered || submit.isPending} onClick={() => submit.mutate(undefined)}>
            {submit.isPending ? 'A submeter…' : 'Submeter respostas'}
          </Button>
        </div>
      )}
    </div>
  );
}
