// hooks/usePartnerDashboard.ts
// GET /crm/partners/dashboard — endpoint já existia no backend sem nenhum
// consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { PartnerDashboard } from '@/components/crm/partners/types';

export function usePartnerDashboard() {
  const { data, isLoading, isError, error, refetch } =
    useApiQuery<PartnerDashboard>(
      queryKeys.partners.dashboard(),
      '/crm/partners/dashboard',
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
