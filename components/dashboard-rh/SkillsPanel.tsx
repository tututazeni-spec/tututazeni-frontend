// components/dashboard-rh/SkillsPanel.tsx
// Painel "Competências" — gaps críticos e forças da organização. Dados
// próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TrainingPanel.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import type { SkillsData } from './types';

export function SkillsPanel() {
  const { data, isLoading: loading } = useApiQuery<SkillsData>(
    queryKeys.dashboardRh.skills(),
    '/dashboard-rh/skills',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Colaboradores Avaliados"
          value={`${data?.assessmentRate ?? 0}%`}
          sub={`${data?.assessed ?? 0} de ${data?.totalUsers ?? 0}`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Competências Mapeadas"
          value={data?.totalCompetencies ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          label="Gaps Críticos"
          value={data?.criticalGaps ?? 0}
          intent="danger"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Maiores Gaps de Competência
          </h4>
          {(data?.topGaps ?? []).length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem gaps identificados.</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={(data?.topGaps ?? []).map((s, i) => s.competency?.name ?? `Competência ${i + 1}`)}
              series={[{ label: 'Gap médio', values: (data?.topGaps ?? []).map((s) => s.avgGap) }]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {(data?.topGaps ?? []).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {s.competency?.name}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    Nível médio {s.avgLevel} · {s.count} avaliações
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-danger-ink">
                  gap {s.avgGap}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Maiores Forças
          </h4>
          {(data?.topStrengths ?? []).length === 0 ? (
            <p className="font-body text-xs text-ink-faint">Sem dados suficientes.</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={(data?.topStrengths ?? []).map((s, i) => s.competency?.name ?? `Competência ${i + 1}`)}
              series={[{ label: 'Nível médio', values: (data?.topStrengths ?? []).map((s) => s.avgLevel) }]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {(data?.topStrengths ?? []).map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border py-2 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {s.competency?.name}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {s.count} avaliações
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-success-ink">
                  nível {s.avgLevel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
