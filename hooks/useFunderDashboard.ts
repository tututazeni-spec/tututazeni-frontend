// hooks/useFunderDashboard.ts
// GET /crm/funders/dashboard — endpoint já existia no backend sem nenhum
// consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { FunderDashboard } from '@/components/crm/funders/types';

export function useFunderDashboard() {
  const { data, isLoading, isError, error, refetch } =
    useApiQuery<FunderDashboard>(
      queryKeys.funders.dashboard(),
      '/crm/funders/dashboard',
      { staleTime: STALE_TIME.DYNAMIC },
    );
  return {
    dashboard: data,
    isLoading,
    isError,
    errorMessage: error?.message || 'Erro ao carregar dashboard',
    onRetry: refetch,
  };
}
