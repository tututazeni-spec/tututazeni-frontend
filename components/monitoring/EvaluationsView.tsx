// components/monitoring/EvaluationsView.tsx

import { ErrorBanner, ListSkeleton } from './shared';
import { EVALUATION_STATUS_COLORS } from './types';
import type { MyEvaluation, ToComplete } from './types';

interface EvaluationsViewProps {
  mine: MyEvaluation[];
  toComplete: ToComplete[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  submit: (id: string) => void;
  submittingId: string | null;
}

export function EvaluationsView({
  mine,
  toComplete,
  loading,
  error,
  onRetry,
  submit,
  submittingId,
}: EvaluationsViewProps) {
  if (loading) return <ListSkeleton height="h-20" />;
  if (error) return <ErrorBanner message={error} onRetry={onRetry} />;

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
              <div key={e.id} className="p-4 flex justify-between items-center">
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
              <div key={e.id} className="p-4 flex justify-between items-center">
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
                      EVALUATION_STATUS_COLORS[e.status] ??
                      'bg-gray-100 text-gray-600'
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
