// components/monitoring/EvaluationsView.tsx

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBanner, ListSkeleton } from './shared';
import { EVALUATION_STATUS_INTENT } from './types';
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
        <h1 className="font-display text-2xl font-bold text-ink">
          Avaliação de Desempenho
        </h1>
        <a href="/monitoring/okrs" className="font-body text-sm text-primary hover:underline">
          ← OKRs
        </a>
      </div>

      {/* A completar */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          Avaliações a Completar ({toComplete.length})
        </h2>
        <div className="rounded-card border border-border bg-surface shadow-resting">
          {toComplete.length === 0 ? (
            <p className="p-4 font-body text-sm text-ink-faint">Nada pendente.</p>
          ) : (
            toComplete.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center border-b border-border p-4 last:border-0"
              >
                <div>
                  <p className="font-body font-medium text-ink">
                    {e.user?.fullName || 'Colaborador'}
                  </p>
                  <p className="font-body text-xs text-ink-muted">
                    {e.cycle?.name} · {e.type}
                  </p>
                </div>
                <Button size="sm" onClick={() => submit(e.id)} disabled={submittingId === e.id}>
                  {submittingId === e.id ? 'A submeter...' : 'Avaliar'}
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* As minhas */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">
          As Minhas Avaliações ({mine.length})
        </h2>
        <div className="rounded-card border border-border bg-surface shadow-resting">
          {mine.length === 0 ? (
            <p className="p-4 font-body text-sm text-ink-faint">Ainda sem avaliações.</p>
          ) : (
            mine.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center border-b border-border p-4 last:border-0"
              >
                <div>
                  <p className="font-body font-medium text-ink">{e.cycle?.name}</p>
                  <p className="font-body text-xs text-ink-muted">
                    {e.type} · Avaliador: {e.evaluator?.fullName || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {e.finalScore != null && (
                    <span className="font-body text-sm font-bold text-ink">
                      {e.finalScore}%
                    </span>
                  )}
                  <Badge intent={EVALUATION_STATUS_INTENT[e.status] ?? 'neutral'}>
                    {e.status}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
