// hooks/useMonitoringEvaluations.ts
// Extraído de app/(platform)/monitoring/evaluations/page.tsx.

'use client';

import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { MyEvaluation, ToComplete } from '@/components/monitoring/types';

export function useMonitoringEvaluations() {
  const notify = useToast();
  // Duas queries independentes → em paralelo (sem waterfall).
  const mineQ = useApiQuery<MyEvaluation[]>(
    queryKeys.monitoring.myEvaluations(),
    '/monitoring/evaluation/my-evaluations',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const todoQ = useApiQuery<ToComplete[]>(
    queryKeys.monitoring.evaluationsToComplete(),
    '/monitoring/evaluation/to-complete',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const submitMut = useApiMutation(
    (vars: { id: string; score: number; feedback?: string }) =>
      apiClient.put(`/monitoring/evaluation/${vars.id}/submit`, {
        score: vars.score,
        ...(vars.feedback && { feedback: vars.feedback }),
      }),
    {
      invalidateKeys: [
        queryKeys.monitoring.myEvaluations(),
        queryKeys.monitoring.evaluationsToComplete(),
      ],
      onError: (e) =>
        notify({ title: e.message || 'Erro inesperado', intent: 'danger' }),
    },
  );
  const submittingId = submitMut.isPending
    ? (submitMut.variables?.id ?? null)
    : null;

  function submit(id: string) {
    const scoreStr = window.prompt('Pontuação (0-100):');
    if (!scoreStr) return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      notify({ title: 'Pontuação inválida', intent: 'danger' });
      return;
    }
    const feedback = window.prompt('Feedback (opcional):') || undefined;
    submitMut.mutate({ id, score, feedback });
  }

  return {
    mine: mineQ.data ?? [],
    toComplete: todoQ.data ?? [],
    loading: mineQ.isLoading,
    error: mineQ.error?.message ?? '',
    onRetry: () => {
      mineQ.refetch();
      todoQ.refetch();
    },
    submit,
    submittingId,
  };
}
