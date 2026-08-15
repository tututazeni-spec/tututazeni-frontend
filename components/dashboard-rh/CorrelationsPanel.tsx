// components/dashboard-rh/CorrelationsPanel.tsx
// Painel "People Analytics" — correlações formação×performance e
// engagement×performance. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/dashboard-rh/page.tsx. Migrado para a
// fundação de design — a cor alto/baixo já é comunicada pelo valor a
// texto (verde/vermelho), por isso as barras passam a mono-cor
// (ProgressBar da fundação não tem prop `color`), sem perda de
// informação.

'use client';

import { Brain } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
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
        <Brain size={18} strokeWidth={1.75} className="text-accent" />
        <h3 className="font-body font-semibold text-ink-muted">
          People Analytics — Correlações
        </h3>
        <span className="font-body text-xs text-ink-faint">
          Base: {data?.sampleSize ?? 0} colaboradores
        </span>
      </div>

      {data?.trainingVsPerformance && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-1 font-body font-semibold text-ink-muted">
            📚 Formação × Performance
          </h4>
          <p className="mb-4 rounded-control bg-accent-subtle px-3 py-2 font-body text-xs text-accent">
            💡 {data.trainingVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Alto treino (3+ cursos)',
                value: data.trainingVsPerformance.highTrainingAvgPerf,
              },
              {
                label: 'Baixo treino',
                value: data.trainingVsPerformance.lowTrainingAvgPerf,
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className={`font-display text-3xl font-black ${(item.value ?? 0) >= 3.5 ? 'text-success' : 'text-danger'}`}
                >
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="font-body text-xs text-ink-muted">
                  {item.label}
                </p>
                <ProgressBar
                  value={((item.value ?? 0) / 5) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
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
      )}

      {data?.engagementVsPerformance && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-1 font-body font-semibold text-ink-muted">
            💬 Engagement × Performance
          </h4>
          <p className="mb-4 rounded-control bg-accent-subtle px-3 py-2 font-body text-xs text-accent">
            💡 {data.engagementVsPerformance.insight}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Alto engagement',
                value: data.engagementVsPerformance.highEngAvgPerf,
              },
              {
                label: 'Baixo engagement',
                value: data.engagementVsPerformance.lowEngAvgPerf,
              },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p
                  className={`font-display text-3xl font-black ${(item.value ?? 0) >= 3.5 ? 'text-success' : 'text-danger'}`}
                >
                  {item.value?.toFixed(1) ?? '–'}
                </p>
                <p className="font-body text-xs text-ink-muted">
                  {item.label}
                </p>
                <ProgressBar
                  value={((item.value ?? 0) / 5) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
