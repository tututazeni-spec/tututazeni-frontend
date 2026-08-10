// components/attendance/hooks.ts
// Hooks de dados do módulo de presenças (dashboard ao vivo, histórico
// próprio, saldo de licenças). Extraído de
// app/(platform)/attendance/page.tsx.

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { DashboardData, LeaveBalance, MyAttendanceData } from './types';

export function useDashboard() {
  // Presenças ao vivo → polling de 60s.
  const q = useApiQuery<DashboardData>(
    queryKeys.attendance.dashboard(),
    '/attendance/dashboard',
    { staleTime: STALE_TIME.DYNAMIC, refetchInterval: 60_000 },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export function useMyAttendance(from?: string, to?: string) {
  const params = { from, to };
  const q = useApiQuery<MyAttendanceData>(
    queryKeys.attendance.my(params),
    '/attendance/my',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  return { data: q.data ?? null, loading: q.isLoading, refetch: q.refetch };
}

export function useLeaveBalance() {
  const q = useApiQuery<LeaveBalance[]>(
    queryKeys.attendance.leaveBalance(),
    '/attendance/my/leave-balance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return q.data ?? [];
}
