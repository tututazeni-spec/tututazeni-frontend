// hooks/useBeneficiaryDashboard.ts
// GET /crm/beneficiaries/dashboard — endpoint já existia no backend sem
// nenhum consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { BeneficiaryDashboard } from '@/components/crm/beneficiaries/types';

export function useBeneficiaryDashboard() {
  const { data, isLoading, isError, error, refetch } =
    useApiQuery<BeneficiaryDashboard>(
      queryKeys.beneficiaries.dashboard(),
      '/crm/beneficiaries/dashboard',
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
