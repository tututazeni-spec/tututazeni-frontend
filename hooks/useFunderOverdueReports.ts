// hooks/useFunderOverdueReports.ts
// Extraído de app/(platform)/crm/funders/overdue-reports/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { OverdueReport } from '@/components/crm/funders/types';

export function useFunderOverdueReports() {
  const [page, setPage] = useState(1);
  const params = { page, limit: 20 };

  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{
    data: OverdueReport[];
    total: number;
    totalPages: number;
  }>(queryKeys.funders.overdueReports(params), '/crm/funders/overdue-reports', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

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
