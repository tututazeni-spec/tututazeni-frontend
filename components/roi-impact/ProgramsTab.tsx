// components/roi-impact/ProgramsTab.tsx
// Tab "Programas": ranking de programas por ROI. Extraído de
// app/(platform)/roi-impact/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ProgramsData } from './types';

export function ProgramsTab() {
  const { data, isLoading: loading } = useApiQuery<ProgramsData>(
    queryKeys.roiImpact.programs(),
    '/roi-impact/programs',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardBody className="text-center">
            <p className="font-display text-2xl font-bold text-ink">{data?.total ?? 0}</p>
            <p className="font-body text-xs text-ink-faint">Programas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-display text-2xl font-bold text-ink">{data?.avgRoi ?? 0}%</p>
            <p className="font-body text-xs text-ink-faint">ROI Médio</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="font-display text-2xl font-bold text-ink">{data?.topByRoi?.length ?? 0}</p>
            <p className="font-body text-xs text-ink-faint">Acima de 100% ROI</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h4 className="font-display font-semibold text-ink">Ranking de Programas por ROI</h4>
        </div>
        <div className="max-h-96 divide-y divide-border overflow-y-auto">
          {(data?.programs ?? []).map((p, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-sunken">
              <span className="w-5 text-right font-body text-xs font-bold text-ink-faint">#{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-medium text-ink">
                  {p.course?.title ?? `Curso ${i + 1}`}
                </p>
                <p className="font-body text-[10px] text-ink-faint">
                  {p.course?.category} · {p.completions} conclusões
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-body text-sm font-bold text-ink">{p.roi}%</p>
                <p className="font-body text-[10px] text-ink-faint">Rácio Benefício-Custo: {p.bcr}</p>
              </div>
            </div>
          ))}
          {(data?.programs?.length ?? 0) === 0 && (
            <EmptyState
              title="Sem dados de programas"
              description="Não há dados de programas disponíveis para o período seleccionado."
              className="border-none"
            />
          )}
        </div>
      </Card>
    </div>
  );
}
