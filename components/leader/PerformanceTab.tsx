// components/leader/PerformanceTab.tsx
// Tab "Performance": resumo do score médio e link para análise
// detalhada. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { AlertTriangle, Star } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
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
        <Skeleton
          rows={2}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4"
          itemClassName="skeleton-shimmer h-24 rounded-card"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard
              icon={Star}
              label="Pontuação Média"
              value={data?.kpis?.avgPerfScore?.toFixed(1) ?? '–'}
              sub={data?.kpis?.perfStatus}
              intent="warning"
            />
            <KpiCard
              icon={AlertTriangle}
              label="Em Risco"
              value={data?.kpis?.atRiskCount ?? 0}
              intent="danger"
            />
          </div>
          <Card>
            <CardBody>
              <h4 className="mb-3 font-display font-semibold text-ink">
                Para ver análise detalhada de performance
              </h4>
              <p className="font-body text-sm text-ink-muted">
                Usa o separador <strong>Equipa</strong> para ver cada membro
                individualmente, ou os <strong>Relatórios</strong> para análise
                avançada.
              </p>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
