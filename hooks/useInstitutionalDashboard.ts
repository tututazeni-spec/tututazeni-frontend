// hooks/useInstitutionalDashboard.ts
// Extraído de app/(platform)/dashboard/institutional/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type {
  Alerts,
  Summary,
  TrendPoint,
} from '@/components/dashboard-institutional/types';

export function useInstitutionalDashboard() {
  // Três queries independentes → em paralelo (sem waterfall).
  const sumQ = useApiQuery<Summary>(
    queryKeys.dashboard.institutionalSummary(),
    '/dashboard-institutional/summary',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const trendQ = useApiQuery<TrendPoint[]>(
    queryKeys.dashboard.institutionalTrend(6),
    '/dashboard-institutional/growth-trend',
    { params: { months: 6 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const alertsQ = useApiQuery<Alerts>(
    queryKeys.dashboard.institutionalAlerts(),
    '/dashboard-institutional/alerts',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return {
    summary: sumQ.data ?? null,
    trend: trendQ.data ?? [],
    alerts: alertsQ.data ?? null,
    loading: sumQ.isLoading,
    error: sumQ.error?.message ?? '',
    onRetry: () => {
      sumQ.refetch();
      trendQ.refetch();
      alertsQ.refetch();
    },
  };
}
