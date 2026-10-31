// components/courses/MyCohortsView.tsx
// Aba "Turmas" para quem não gere turmas (colaborador, gestor…): as turmas em
// que está inscrito, com o mesmo cartão das turmas mas só de leitura.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EmptyState } from '@/components/ui/EmptyState';
import { CohortCard } from './TurmasView';
import { Skeleton } from './shared';
import type { Cohort, CohortDetail } from './types';

type MyCohort = Cohort & { course: CohortDetail['course'] };

export function MyCohortsView() {
  const {
    data = [],
    isLoading,
    error,
  } = useApiQuery<MyCohort[]>(
    queryKeys.courses.myCohorts(),
    '/courses/cohorts/mine',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (error) return <div className="text-sm text-ink">{error.message}</div>;

  if (data.length === 0)
    return (
      <EmptyState
        title="Sem turmas"
        description="Ainda não estás inscrito em nenhuma turma."
      />
    );

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      {data.map((c) => (
        <CohortCard key={c.id} c={c} courseTitle={c.course.title} readOnly />
      ))}
    </div>
  );
}
