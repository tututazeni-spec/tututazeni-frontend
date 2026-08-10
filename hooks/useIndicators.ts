// hooks/useIndicators.ts
// Extraído de app/(platform)/monitoring/indicators/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Indicator } from '@/components/monitoring/types';

export function useIndicators() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Indicator[]; total: number; totalPages: number }>(
    queryKeys.monitoring.indicators(params),
    '/monitoring/indicators',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  return {
    data: resp?.data ?? [],
    total: resp?.total ?? 0,
    totalPages: resp?.totalPages ?? 1,
    page,
    setPage,
    loading,
    error: queryError?.message ?? '',
    onRetry: () => refetch(),
  };
}
