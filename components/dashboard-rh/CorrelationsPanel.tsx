// components/dashboard-rh/CorrelationsPanel.tsx
// Painel "People Analytics" — correlações formação×performance e
// engagement×performance. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/dashboard-rh/page.tsx. Migrado para a
// fundação de design — a cor alto/baixo já é comunicada pelo valor a
// texto (verde/vermelho), por isso as barras passam a mono-cor
// (ProgressBar da fundação não tem prop `color`), sem perda de
// informação.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import type { CorrelationsData } from './types';

export function CorrelationsPanel() {
  const { data, isLoading: loading } = useApiQuery<CorrelationsData>(
    queryKeys.dashboardRh.correlations(),
    '/dashboard-rh/correlations',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={2}
        wrapperClassName="space-y-3 animate-pulse"
        itemClassName="h-40 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-body font-semibold text-ink-muted">
          Análise de Recursos Humanos — Correlações
        </h3>
        <span className="font-body text-xs text-ink-faint">
          Base: {data?.sampleSize ?? 0} colaboradores
        </span>
      </div>

      {data?.trainingVsPerformance && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-resting">
          <div className="h-1.5 w-full bg-[#0F1F3D]" />
          <div className="p-5">
            <h4 className="mb-1 font-body font-semibold text-ink-muted">
              Formação × Performance
            </h4>
            <p className="mb-4 rounded-control border border-[#0F1F3D]/30 bg-[#0F1F3D]/10 px-3 py-2 font-body text-xs text-[#0F1F3D]">
              {data.trainingVsPerformance.insight}
            </p>
            <BarChart
              categories={['Alta formação (3 ou mais cursos)', 'Baixa formação']}
              series={[
                {
                  label: 'Performance média',
                  color: '#0F1F3D',
                  values: [
                    data.trainingVsPerformance.highTrainingAvgPerf ?? 0,
                    data.trainingVsPerformance.lowTrainingAvgPerf ?? 0,
                  ],
                },
              ]}
              yFormat={(v) => v.toFixed(1)}
            />
            {(data.trainingVsPerformance.lift ?? 0) > 0 && (
              <div className="mt-3 text-center">
                <span className="font-body text-sm font-bold text-success">
                  +{data.trainingVsPerformance.lift} pts lift
                </span>
                <span className="ml-2 font-body text-xs text-ink-faint">
                  por alto consumo de formação
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {data?.engagementVsPerformance && (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-resting">
          <div className="h-1.5 w-full bg-[#0F1F3D]" />
          <div className="p-5">
            <h4 className="mb-1 font-body font-semibold text-ink-muted">
              Compromisso dos Colaboradores × Performance
            </h4>
            <p className="mb-4 rounded-control border border-[#0F1F3D]/30 bg-[#0F1F3D]/10 px-3 py-2 font-body text-xs text-[#0F1F3D]">
              {data.engagementVsPerformance.insight}
            </p>
            <BarChart
              categories={['Alto Compromisso', 'Baixo Compromisso']}
              series={[
                {
                  label: 'Performance média',
                  color: '#0F1F3D',
                  values: [
                    data.engagementVsPerformance.highEngAvgPerf ?? 0,
                    data.engagementVsPerformance.lowEngAvgPerf ?? 0,
                  ],
                },
              ]}
              yFormat={(v) => v.toFixed(1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
