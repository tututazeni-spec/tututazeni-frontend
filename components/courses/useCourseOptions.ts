// components/courses/useCourseOptions.ts
// Cursos pelo título, para os Select que antes pediam o ID do curso. Mesma
// chamada (e cache) que CreateCourseModal usa para os pré-requisitos.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { SelectItemOption } from '@/components/ui/Select';
import type { PaginatedCourses } from './types';

export function useCourseOptions(): SelectItemOption[] {
  const { data } = useApiQuery<PaginatedCourses>(
    queryKeys.courses.list({ limit: 100 }),
    '/courses?limit=100',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return (data?.data ?? []).map((c) => ({
    value: String(c.id),
    label: c.title,
  }));
}
