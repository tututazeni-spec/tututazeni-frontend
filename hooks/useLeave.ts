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

export function useLeaveDashboard() {
  const q = useApiQuery<DashboardData>(
    queryKeys.leave.dashboard(),
    '/leave/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export function usePendingApprovals() {
  // Fila de aprovações → polling de 60s.
  const q = useApiQuery<LeaveRequest[]>(
    queryKeys.leave.pendingApprovals(),
    '/leave/pending-approvals',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );
  return { data: q.data ?? [], loading: q.isLoading, refetch: q.refetch };
}
