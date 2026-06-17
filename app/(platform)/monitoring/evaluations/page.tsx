'use client';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface MyEvaluation {
  id: string;
  type: string;
  status: string;
  finalScore: number | null;
  cycle?: { name: string; type: string } | null;
  evaluator?: { fullName: string } | null;
}
interface ToComplete {
  id: string;
  type: string;
  status: string;
  user?: { fullName: string } | null;
  cycle?: { name: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  OPEN: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-green-100 text-green-800',
};

export default function EvaluationsPage() {
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

  const mine = mineQ.data ?? [];
  const toComplete = todoQ.data ?? [];
  const loading = mineQ.isLoading;
  const error = mineQ.error?.message ?? '';
  const fetchData = () => { mineQ.refetch(); todoQ.refetch(); };

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
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );
  const submittingId = submitMut.isPending ? submitMut.variables?.id ?? null : null;

  function submit(id: string) {
    const scoreStr = window.prompt('Pontuação (0-100):');
    if (!scoreStr) return;
    const score = Number(scoreStr);
    if (isNaN(score) || score < 0 || score > 100) {
      alert('Pontuação inválida');
      return;
    }
    const feedback = window.prompt('Feedback (opcional):') || undefined;
    submitMut.mutate({ id, score, feedback });
  }

  if (loading)
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
          <button onClick={fetchData} className="ml-4 underline">
            Tentar novamente
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Avaliação de Desempenho
        </h1>
        <a
          href="/monitoring/okrs"
          className="text-sm text-blue-600 hover:underline"
        >
          ← OKRs
        </a>
      </div>

      {/* A completar */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Avaliações a Completar ({toComplete.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {toComplete.length === 0 ? (
            <p className="p-4 text-gray-400">Nada pendente.</p>
          ) : (
            toComplete.map((e) => (
              <div
                key={e.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">
                    {e.user?.fullName || 'Colaborador'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {e.cycle?.name} · {e.type}
                  </p>
                </div>
                <button
                  onClick={() => submit(e.id)}
                  disabled={submittingId === e.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                >
                  {submittingId === e.id ? 'A submeter...' : 'Avaliar'}
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* As minhas */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          As Minhas Avaliações ({mine.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {mine.length === 0 ? (
            <p className="p-4 text-gray-400">Ainda sem avaliações.</p>
          ) : (
            mine.map((e) => (
              <div
                key={e.id}
                className="p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{e.cycle?.name}</p>
                  <p className="text-xs text-gray-500">
                    {e.type} · Avaliador: {e.evaluator?.fullName || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {e.finalScore != null && (
                    <span className="text-sm font-bold text-gray-700">
                      {e.finalScore}%
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
