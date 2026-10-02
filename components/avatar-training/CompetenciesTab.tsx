// components/avatar-training/CompetenciesTab.tsx
// Competências (docs/Avatar_Training.md §9): competências demonstradas em
// sessões com avatar e formações recomendadas. O nível oficial vive no módulo
// Competências e só sobe um degrau por sessão aprovada — aqui fica a evidência.

'use client';

import { Target } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { DIFFICULTY_LABEL, LEVEL_FIT_LABEL } from './constants';
import type { CompetencyResult, Recommendation } from './types';

const REASON_LABEL: Record<string, string> = {
  COMPETENCY_GAP: 'Lacuna de competência',
  PDI_ACTION: 'Acção de PDI',
  ONBOARDING_TASK: 'Onboarding',
  PERFORMANCE_REVIEW: 'Avaliação de desempenho / 360',
  CAREER_GOAL: 'Plano de carreira',
  LEARNING_PATH: 'Percurso de aprendizagem',
  TRAINING: 'Plano de formação',
};

export function CompetenciesTab() {
  const results = useApiQuery<{ data: CompetencyResult[]; note: string }>(
    queryKeys.avatarTraining.competencies(),
    '/avatar-training/competencies',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const recs = useApiQuery<{ data: Recommendation[]; note: string }>(
    queryKeys.avatarTraining.recommendations(),
    '/avatar-training/recommendations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (results.error)
    return (
      <QueryError error={results.error} onRetry={() => results.refetch()} />
    );
  if (results.isLoading || !results.data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-14 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold text-ink">
          Competências demonstradas
        </h2>
        {results.data.data.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Sem competências demonstradas"
            description="Aparecem aqui depois de concluir, com aprovação, sessões ligadas a competências."
          />
        ) : (
          results.data.data.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-4 rounded-card border border-border bg-surface p-3"
            >
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-semibold text-ink">
                  {r.competencyName ?? `Competência ${r.competencyId}`}
                </div>
                <div className="font-body text-xs text-ink-muted">
                  {formatDate(r.assessedAt)}
                  {r.evidence ? ` · ${r.evidence}` : ''}
                </div>
              </div>
              <div className="shrink-0 text-right font-mono text-xs text-ink-muted">
                <div>nota {r.score}</div>
                {r.levelBefore !== null && r.levelAfter !== null && (
                  <div>
                    nível {r.levelBefore} → {r.levelAfter}
                    {r.applied ? '' : ' (não aplicado)'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <p className="font-body text-xs text-ink-faint">{results.data.note}</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-sm font-semibold text-ink">
          Formações recomendadas
        </h2>
        {recs.error ? (
          <QueryError error={recs.error} onRetry={() => recs.refetch()} />
        ) : !recs.data ? (
          <Skeleton
            rows={2}
            itemClassName="h-14 rounded-card bg-surface-sunken animate-pulse"
          />
        ) : recs.data.data.length === 0 ? (
          <p className="rounded-card border border-dashed border-border-strong bg-surface p-4 text-center font-body text-sm text-ink-faint">
            Sem recomendações neste momento.
          </p>
        ) : (
          recs.data.data.map((r) => (
            <div
              key={r.programId}
              className="rounded-card border border-border bg-surface p-3"
            >
              <div className="font-display text-sm font-semibold text-ink">
                {r.title}
              </div>
              <div className="font-body text-xs text-ink-faint">
                {DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty} ·{' '}
                {LEVEL_FIT_LABEL[r.levelFit]}
              </div>
              <ul className="mt-1 space-y-0.5 font-body text-xs text-ink-muted">
                {r.reasons.map((x, i) => (
                  <li key={i}>
                    <span className="font-medium">
                      {REASON_LABEL[x.type] ?? x.type}:
                    </span>{' '}
                    {x.detail}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        {recs.data && (
          <p className="font-body text-xs text-ink-faint">{recs.data.note}</p>
        )}
      </section>
    </div>
  );
}
