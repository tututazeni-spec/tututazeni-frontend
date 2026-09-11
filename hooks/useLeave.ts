// hooks/useLeave.ts
// Hooks de dados do módulo de gestão de ausências — extraídos de
// app/(platform)/leave/page.tsx para o directório hooks/ (mesma convenção
// de hooks/useEmployees.ts, hooks/usePayslipDetail.ts, ...). Puramente
// dados (useApiQuery); a apresentação vive em components/leave/.

import { useApiQuery } from './useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  DashboardData,
  LeaveBalance,
  LeaveRequest,
  LeaveType,
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
 * @param enabled - GET /leave/dashboard exige @Roles(ADMIN, RH, GESTOR) no
 * backend; por omissão `true` para não mudar o comportamento de quem já
 * chamava esta hook sem o parâmetro. As páginas que a montam para todas as
 * roles (ex.: app/(platform)/leave/page.tsx) devem passar `false` para um
 * COLABORADOR, ou o pedido rebenta sempre com 403 mal a página monta.
 */
export function useLeaveDashboard(enabled = true) {
  const q = useApiQuery<DashboardData>(
    queryKeys.leave.dashboard(),
    '/leave/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

/**
 * @param enabled - GET /leave/pending-approvals exige @Roles(ADMIN, RH,
 * GESTOR) no backend; ver nota em useLeaveDashboard acima.
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
