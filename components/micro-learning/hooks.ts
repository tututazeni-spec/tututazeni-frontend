// components/micro-learning/hooks.ts
// Hooks de progresso e quiz do player. Extraído de
// app/(platform)/micro-learning/page.tsx.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import type { MicroLearning, QuizResult } from './types';

// Progresso de leitura/audição, incluindo o auto-progress (setInterval) para
// conteúdo de texto/áudio. `progressRef`/`completedRef` evitam closures stale
// dentro do setInterval: o efeito só recria quando `item.id` muda, por isso o
// intervalo lê sempre os valores mais recentes via ref em vez do valor
// capturado no momento em que o efeito correu (bug anterior: `completed` no
// corpo do interval ficava sempre `false`, o valor inicial).
export function useMicroLearningProgress(item: MicroLearning) {
  const [progress, setProgress] = useState(item.userProgress?.progress ?? 0);
  const [completed, setCompleted] = useState(item.isCompleted ?? false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(progress);
  const completedRef = useRef(completed);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);
  useEffect(() => {
    completedRef.current = completed;
  }, [completed]);

  const saveProgress = useCallback(
    async (pct: number) => {
      try {
        await apiClient.post('/micro-learning/progress', {
          microLearningId: item.id,
          progress: Math.round(pct),
        });
      } catch {
        /* ignorar */
      }
    },
    [item.id],
  );

  useEffect(() => {
    if (item.contentType === 'TEXT' || item.contentType === 'AUDIO') {
      if (progressRef.current >= 100) return;
      const duration = item.durationSeconds ?? 60;
      const step = (100 / duration) * 2; // actualiza a cada 2s

      intervalRef.current = setInterval(async () => {
        const newPct = Math.min(100, progressRef.current + step);
        setProgress(newPct);
        if (newPct >= 100 && !completedRef.current) {
          clearInterval(intervalRef.current!);
          await saveProgress(100);
          setCompleted(true);
        }
      }, 2000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [item.id, item.contentType, item.durationSeconds, saveProgress]);

  const markComplete = async () => {
    await saveProgress(100);
    setProgress(100);
    setCompleted(true);
  };

  return { progress, completed, markComplete };
}

// Sub-domínio do quiz, separado do progresso: respostas, resultado e envio.
export function useQuizAttempt(
  item: MicroLearning,
  onPassed: () => Promise<void> | void,
) {
  const [answers, setAnswers] = useState<number[]>([]);

  const setAnswer = (idx: number, optionIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = optionIdx;
      return next;
    });
  };

  const submitQuiz = useApiMutation(
    () =>
      apiClient.post<QuizResult>('/micro-learning/quiz/submit', {
        microLearningId: item.id,
        answers,
      }),
    {
      onSuccess: async (res) => {
        if (res.score >= 60) await onPassed();
      },
      onError: (e) => alert(e.message),
    },
  );

  return {
    answers,
    result: submitQuiz.data ?? null,
    submitting: submitQuiz.isPending,
    setAnswer,
    submit: () => submitQuiz.mutate(undefined),
  };
}
