// hooks/useMyPathsLms.ts
// Extraído de app/(platform)/lms/my-paths/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Analytics, MyPath } from '@/components/lms/types';

export function useMyPathsLms() {
  // Percursos e analytics em paralelo (queries independentes).
  const pathsQ = useApiQuery<MyPath[]>(
    queryKeys.lms.myPaths(),
    '/lms/my-paths',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const anaQ = useApiQuery<Analytics>(
    queryKeys.lms.myAnalytics(),
    '/lms/my-analytics',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return {
    paths: pathsQ.data ?? [],
    analytics: anaQ.data ?? null,
    loading: pathsQ.isLoading,
    error: pathsQ.error?.message ?? '',
    onRetry: () => {
      pathsQ.refetch();
      anaQ.refetch();
    },
  };
}
