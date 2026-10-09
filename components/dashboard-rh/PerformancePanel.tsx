// components/dashboard-rh/PerformancePanel.tsx
// Painel "Performance" — KPIs, distribuição, score por departamento e
// insights. Dados próprios (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — a cor da distribuição já era comunicada pelo emoji do rótulo; a cor
// do score por departamento já era comunicada pelo texto do valor, por
// isso ambas as barras passam a mono-cor (ProgressBar da fundação não tem
// prop `color`), sem perda de informação.

'use client';

import { AlertTriangle, Award, Star, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import type { PerformanceData } from './types';

export function PerformancePanel() {
  const { data, isLoading: loading } = useApiQuery<PerformanceData>(
    queryKeys.dashboardRh.performance(),
    '/dashboard-rh/performance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );
  const dist = data?.distribution ?? {};

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Pontuação Média"
          value={data?.avgScore?.toFixed(1) ?? '–'}
          tone="orange"
          icon={Star}
        />
        <NavyStatCard
          label="Avaliados"
          value={data?.total ?? 0}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          label="Profissionais de Alto Potencial"
          value={data?.hiPos ?? 0}
          tone="green"
          icon={Award}
        />
        <NavyStatCard
          label="Em Risco"
          value={data?.atRisk ?? 0}
          tone="red"
          icon={AlertTriangle}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Distribution */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Distribuição de Performance
          </h4>
          <BarChart
            categories={[
              'Excepcional',
              'Acima',
              'Esperado',
              'Abaixo',
              'Crítico',
            ]}
            series={[
              {
                label: 'Colaboradores',
                values: [
                  'exceptional',
                  'above',
                  'expected',
                  'below',
                  'critical',
                ].map((key) => dist[key] ?? 0),
              },
            ]}
          />
        </div>

        {/* By dept */}
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-4 font-body font-semibold text-ink-muted">
            Pontuação por Departamento
          </h4>
          {(data?.byDepartment ?? []).length > 0 ? (
            <BarChart
              orientation="horizontal"
              categories={(data?.byDepartment ?? [])
                .slice(0, 6)
                .map((d) => d.department)}
              series={[
                {
                  label: 'Pontuação média',
                  values: (data?.byDepartment ?? [])
                    .slice(0, 6)
                    .map((d) => d.avgScore),
                },
              ]}
              yFormat={(v) => v.toFixed(1)}
            />
          ) : (
            <p className="font-body text-xs text-ink-faint">
              Sem dados suficientes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
