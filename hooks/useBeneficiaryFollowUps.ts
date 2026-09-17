// hooks/useBeneficiaryFollowUps.ts
// GET /crm/beneficiaries/follow-ups — sem @Roles() no backend (visível a
// qualquer utilizador autenticado, filtra por si mesmo como responsável).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { FollowUp } from '@/components/crm/beneficiaries/types';

export function useBeneficiaryFollowUps(days = 7) {
  const { data, isLoading, isError, error, refetch } = useApiQuery<FollowUp[]>(
    queryKeys.beneficiaries.followUps(days),
    '/crm/beneficiaries/follow-ups',
    { params: { days }, staleTime: STALE_TIME.DYNAMIC },
  );
  return {
    followUps: data ?? [],
    isLoading,
    isError,
    errorMessage: error?.message || 'Erro ao carregar follow-ups',
    onRetry: refetch,
  };
}
