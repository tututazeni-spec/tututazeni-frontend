// hooks/usePartnerOverdueMilestones.ts
// GET /crm/partners/overdue-milestones — só ADMIN/RH/GESTOR. Endpoint já
// existia no backend sem nenhum consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { OverdueMilestone } from '@/components/crm/partners/types';

export function usePartnerOverdueMilestones() {
  const { data, isLoading, isError, error, refetch } = useApiQuery<
    OverdueMilestone[]
  >(
    queryKeys.partners.overdueMilestones(),
    '/crm/partners/overdue-milestones',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return {
    data: data ?? [],
    isLoading,
    isError,
    errorMessage: error?.message || 'Erro ao carregar milestones em atraso',
    onRetry: refetch,
  };
}
