// components/leader/PerformanceTab.tsx
// Tab "Performance": resumo do score médio e link para análise
// detalhada. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { AlertTriangle, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KPICard, Skeleton } from './atoms';
import type { LeaderDashboard } from './types';

export function PerformanceTab() {
  const { data, isLoading: loading } = useApiQuery<LeaderDashboard>(
    queryKeys.leader.dashboard(),
    '/leaders/my-dashboard',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  return (
    <div className="space-y-4">
      {loading ? (
        <Skeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard
              icon={Star}
              label="Score Médio"
              value={data?.kpis?.avgPerfScore?.toFixed(1) ?? '–'}
              status={data?.kpis?.perfStatus}
              color="text-amber-600"
              bg="bg-amber-50"
            />
            <KPICard
              icon={AlertTriangle}
              label="Em Risco"
              value={data?.kpis?.atRiskCount ?? 0}
              color="text-red-500"
              bg="bg-red-50"
            />
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h4 className="font-semibold text-slate-700 mb-3">
              Para ver análise detalhada de performance
            </h4>
            <p className="text-sm text-slate-500">
              Usa o separador <strong>Equipa</strong> para ver cada membro
              individualmente, ou os <strong>Reports</strong> para análise
              avançada.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
