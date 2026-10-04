// hooks/useLeave.ts
// Hooks de dados do módulo de gestão de ausências — extraídos de
// app/(platform)/leave/page.tsx para o directório hooks/ (mesma convenção
// de hooks/useEmployees.ts, hooks/usePayslipDetail.ts, ...). Puramente
// dados (useApiQuery); a apresentação vive em components/leave/.

import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from './useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  LeaveBalance,
  LeaveRequest,
  LeaveType,
  OverviewData,
  OverviewFilters,
  VacationsResponse,
} from '@/components/leave/types';

export function useLeaveTypes() {
  // Catálogo quase imutável → cache longa (STATIC).
  const q = useApiQuery<LeaveType[]>(queryKeys.leave.types(), '/leave/types', {
    staleTime: STALE_TIME.STATIC,
  });
  return q.data ?? [];
}

export function useMyBalance() {
  const q = useApiQuery<LeaveBalance[]>(
    queryKeys.leave.myBalance(),
    '/leave/my/balance',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { balances: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}

export function useMyRequests() {
  const q = useApiQuery<{ data: LeaveRequest[]; meta: { total: number } }>(
    queryKeys.leave.myRequests(),
    '/leave/my',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

/**
 * @param enabled - GET /leave/pending-approvals exige @Roles(ADMIN, RH,
 * GESTOR) no backend; páginas que a montam para todas as roles passam
 * `false` para um COLABORADOR, ou o pedido rebenta sempre com 403.
 */
export function usePendingApprovals(enabled = true) {
  // Fila de aprovações → polling de 60s.
  const q = useApiQuery<LeaveRequest[]>(
    queryKeys.leave.pendingApprovals(),
    '/leave/pending-approvals',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000, enabled },
  );
  return { data: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}

/** Só envia ao backend os filtros preenchidos. */
function compact(params: Record<string, string | number | undefined>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== undefined),
  );
}

/** GET /leave/overview — o âmbito (próprio/equipa/organização) vem do backend. */
export function useLeaveOverview(filters: OverviewFilters) {
  const params = compact({ ...filters });
  const q = useApiQuery<OverviewData>(
    queryKeys.leave.overview(params),
    '/leave/overview',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export interface VacationFilters {
  year: number;
  unitId: string;
  departmentId: string;
  search: string;
  planState: string;
  page: number;
}

/** GET /leave/vacations — tabela de saldos/plano anual de férias. */
export function useVacations(filters: VacationFilters) {
  const params = compact({ ...filters, limit: 20 });
  const q = useApiQuery<VacationsResponse>(
    queryKeys.leave.vacations(params),
    '/leave/vacations',
    {
      params,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}
