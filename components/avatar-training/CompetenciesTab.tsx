// components/avatar-training/CompetenciesTab.tsx
// Competências (docs/Avatar_Training.md §9): competências demonstradas em
// sessões com avatar e formações recomendadas. O nível oficial vive no módulo
// Competências e só sobe um degrau por sessão aprovada — aqui fica a evidência.

'use client';

import {
  CalendarDays,
  GraduationCap,
  Star,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { CardGrid } from './cards';
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
          <CardGrid>
            {results.data.data.map((r) => (
              <NavyCard
                key={r.id}
                seed={r.competencyId}
                kicker="Competência demonstrada"
                kickerIcon={Target}
                title={r.competencyName ?? `Competência ${r.competencyId}`}
                subtitle={r.evidence ?? undefined}
                badge={
                  <NavyBadge tone={r.applied ? 'success' : 'neutral'}>
                    {r.applied ? 'Nível aplicado' : 'Não aplicado'}
                  </NavyBadge>
                }
                infos={[
                  { icon: Star, value: String(r.score), label: 'Nota' },
                  {
                    icon: TrendingUp,
                    value:
                      r.levelBefore !== null && r.levelAfter !== null
                        ? `${r.levelBefore} → ${r.levelAfter}`
                        : '—',
                    label: 'Nível',
                  },
                  {
                    icon: CalendarDays,
                    value: formatDate(r.assessedAt),
                    label: 'Avaliada em',
                  },
                ]}
              />
            ))}
          </CardGrid>
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
          <EmptyState
            variant="inline"
            title="Sem recomendações neste momento"
          />
        ) : (
          <CardGrid>
            {recs.data.data.map((r) => (
              <NavyCard
                key={r.programId}
                seed={r.programId}
                kicker="Formação recomendada"
                kickerIcon={GraduationCap}
                title={r.title}
                subtitle={DIFFICULTY_LABEL[r.difficulty] ?? r.difficulty}
                badge={
                  <NavyBadge tone="info">
                    {LEVEL_FIT_LABEL[r.levelFit]}
                  </NavyBadge>
                }
                infos={r.reasons.slice(0, 3).map((x) => ({
                  icon: Target,
                  value: x.detail,
                  label: REASON_LABEL[x.type] ?? x.type,
                }))}
              />
            ))}
          </CardGrid>
        )}
        {recs.data && (
          <p className="font-body text-xs text-ink-faint">{recs.data.note}</p>
        )}
      </section>
    </div>
  );
}
