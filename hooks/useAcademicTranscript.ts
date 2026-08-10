// hooks/useAcademicTranscript.ts
// Extraído de app/(platform)/academic/transcript/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Enrollment, Transcript } from '@/components/academic/types';

export function useAcademicTranscript() {
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ transcript: Transcript | null; enrollments: Enrollment[] }>(
    queryKeys.academic.transcript(),
    '/academic/transcript',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return {
    transcript: data?.transcript ?? null,
    enrollments: data?.enrollments ?? [],
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
  };
}
