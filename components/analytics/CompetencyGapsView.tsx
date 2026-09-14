// components/analytics/CompetencyGapsView.tsx
// Separador "Competências" — GET /analytics/competency-gaps, mapa de gaps
// à escala da organização inteira (actual vs. desejado). Complementa a
// aba "Lacunas de Competências" de components/analytics/ManagerView.tsx,
// que só cobre a equipa do gestor autenticado. Endpoint já existia sem
// consumidor no frontend.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { CompetencyGapItem } from './types';

export function CompetencyGapsView() {
  const { data, isLoading } = useApiQuery<CompetencyGapItem[]>(
    queryKeys.analyticsPage.competencyGaps(),
    '/analytics/competency-gaps',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <Card>
      <CardBody>
        <div className="mb-4 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Gaps de competência — organização inteira (actual vs. desejado)
        </div>
        <div className="space-y-3">
          {data.map((g) => (
            <div key={g.name} className="flex items-center gap-3">
              <div className="w-40 flex-shrink-0">
                <div className="truncate text-xs font-medium text-ink">{g.name}</div>
                <div className="truncate text-[10px] text-ink-faint">{g.category}</div>
              </div>
              <div className="flex-1">
                <ProgressBar value={Math.min(g.avgCurrent * 20, 100)} />
              </div>
              <div className="w-24 flex-shrink-0 text-right text-xs font-data text-black">
                {g.avgCurrent} → {g.avgTarget}
              </div>
              <div className="w-16 flex-shrink-0 text-right text-xs font-data font-bold text-warning">
                Gap: {g.gap}
              </div>
              <div className="w-20 flex-shrink-0 text-right text-xs text-ink-faint">
                {g.count} pessoas
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="py-6 text-center text-sm text-ink-faint">
              Sem gaps de competência identificados
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
