// hooks/usePartnerExpiringContracts.ts
// GET /crm/partners/expiring-contracts — só ADMIN/RH/GESTOR. Endpoint já
// existia no backend sem nenhum consumidor no frontend.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { ExpiringContract } from '@/components/crm/partners/types';

export function usePartnerExpiringContracts() {
  const [days, setDays] = useState(30);
  const { data, isLoading, isError, error, refetch } = useApiQuery<
    ExpiringContract[]
  >(
    queryKeys.partners.expiringContracts(days),
    '/crm/partners/expiring-contracts',
    { params: { days }, staleTime: STALE_TIME.DYNAMIC },
  );
  return {
    data: data ?? [],
    days,
    setDays,
    isLoading,
    isError,
    errorMessage: error?.message || 'Erro ao carregar contratos a expirar',
    onRetry: refetch,
  };
}
