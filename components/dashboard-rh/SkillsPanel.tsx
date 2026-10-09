// components/dashboard-rh/SkillsPanel.tsx
// Painel "Competências" — gaps críticos e forças da organização. Dados
// próprios (useApiQuery) + apresentação. Mesmo padrão de
// components/dashboard-rh/TrainingPanel.tsx.

'use client';

import { AlertTriangle, Layers, ListChecks } from 'lucide-react';
import { TopBarCard } from '@/components/ui/TopBarCard';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
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
        itemClassName="h-28 rounded-2xl bg-surface-sunken"
      />
    );

  const sortedGaps = [...(data?.topGaps ?? [])].sort(
    (a, b) => b.avgGap - a.avgGap,
  );
  const sortedStrengths = [...(data?.topStrengths ?? [])].sort(
    (a, b) => b.avgLevel - a.avgLevel,
  );

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TopBarCard
          label="Colaboradores Avaliados"
          value={`${data?.assessmentRate ?? 0}%`}
          tone="blue"
          icon={<ListChecks className="h-6 w-6" />}
        />
        <TopBarCard
          label="Competências Mapeadas"
          value={data?.totalCompetencies ?? 0}
          tone="gold"
          icon={<Layers className="h-6 w-6" />}
        />
        <TopBarCard
          label="Gaps Críticos"
          value={data?.criticalGaps ?? 0}
          tone="red"
          icon={<AlertTriangle className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Maiores Gaps de Competência
          </h4>
          {sortedGaps.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem gaps identificados.
            </p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={sortedGaps.map(
                (s, i) => s.competency?.name ?? `Competência ${i + 1}`,
              )}
              series={[
                {
                  label: 'Gap médio',
                  values: sortedGaps.map((s) => s.avgGap),
                  color: '#0F1F3D',
                },
              ]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {sortedGaps.map((s, i) => (
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
                <span className="font-body text-xs font-bold text-black">
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
          {sortedStrengths.length === 0 ? (
            <p className="font-body text-xs text-ink-faint">
              Sem dados suficientes.
            </p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={sortedStrengths.map(
                (s, i) => s.competency?.name ?? `Competência ${i + 1}`,
              )}
              series={[
                {
                  label: 'Nível médio',
                  values: sortedStrengths.map((s) => s.avgLevel),
                  color: '#0F1F3D',
                },
              ]}
              className="mb-4"
              yFormat={(v) => v.toFixed(1)}
            />
          )}
          <div className="space-y-2">
            {sortedStrengths.map((s, i) => (
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
                <span className="font-body text-xs font-bold text-black">
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
