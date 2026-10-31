// components/courses/MyCohortsSection.tsx
// Bloco "As minhas turmas" em "Meus cursos": turmas em que o colaborador está
// inscrito, com o mesmo cartão das turmas mas só de leitura.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { CohortCard } from './TurmasView';
import type { Cohort, CohortDetail } from './types';

type MyCohort = Cohort & { course: CohortDetail['course'] };

export function MyCohortsSection() {
  const { data = [] } = useApiQuery<MyCohort[]>(
    queryKeys.courses.myCohorts(),
    '/courses/cohorts/mine',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (data.length === 0) return null;

  return (
    <section className="mb-8" aria-label="As minhas turmas">
      <h2 className="mb-4 text-2xl font-medium text-ink">As minhas turmas</h2>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {data.map((c) => (
          <CohortCard key={c.id} c={c} courseTitle={c.course.title} readOnly />
        ))}
      </div>
    </section>
  );
}
