// components/career/OverviewTab.tsx
// Separador "Visão Geral" (RH/Gestor) — Módulo Career, secção 1. Agrega
// GET /career/overview (career.analytics + career-plans.analytics +
// succession.dashboard + métricas próprias: colaboradores sem plano,
// movimentações internas, evolução por departamento/unidade/cargo, alertas).

'use client';

import { AlertTriangle, Briefcase, TrendingUp, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { AlertCard } from '@/components/ui/AlertCard';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import type { CareerOverview } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

const MOVEMENT_LABELS: Record<string, string> = {
  PROMOTION: 'Promoção',
  TRANSFER: 'Transferência',
  MANAGER_CHANGE: 'Mudança de gestor',
};

interface EvolutionListProps {
  title: string;
  items: Array<{ key: string; count: number }>;
  variant: 'bar-vertical' | 'donut' | 'bar-horizontal';
}

// Comparação entre categorias nomeadas (departamento/unidade/cargo) com os
// gráficos partilhados do design system: barras verticais, anel ou barras
// horizontais conforme o `variant`.
function EvolutionList({ title, items, variant }: EvolutionListProps) {
  const top = items.slice(0, 6);
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border bg-brand/60 px-4 py-3 font-body text-sm font-semibold text-white">
        {title}
      </div>
      <div className="p-4">
        {top.length === 0 ? (
          <EmptyState variant="inline" title="Sem dados" />
        ) : variant === 'donut' ? (
          <DonutChart
            data={items.map((i) => ({ label: i.key, value: i.count }))}
            size={220}
            centerLabel="Planos"
          />
        ) : (
          <BarChart
            orientation={variant === 'bar-vertical' ? 'vertical' : 'horizontal'}
            height={variant === 'bar-vertical' ? 300 : undefined}
            categories={top.map((i) => i.key)}
            series={[{ label: title, values: top.map((i) => i.count) }]}
          />
        )}
      </div>
    </Card>
  );
}

export function OverviewTab() {
  const { data: overview, isLoading: loading } = useApiQuery<CareerOverview>(
    queryKeys.career.overview(),
    '/career/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading) return <Skeleton rows={5} />;
  if (!overview) return null;

  const { careerAnalytics, careerPlansAnalytics, successionDashboard } =
    overview;
  const movementsTotal = overview.internalMovements.reduce(
    (sum, m) => sum + m.count,
    0,
  );

  return (
    <div className="space-y-5">
      {overview.alerts.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
          {overview.alerts.map((a, i) => (
            <AlertCard key={i} variant="warning" title="Atenção" message={a} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          href="/users"
          icon={Users}
          label="Colaboradores"
          value={careerAnalytics.overview.totalUsers}
          sub={`${careerAnalytics.overview.usersWithActivePlan} com plano activo`}
          intent="primary"
        />
        <KpiCard
          tab="plans"
          icon={AlertTriangle}
          label="Sem plano de carreira"
          value={overview.employeesWithoutPlan}
          intent={overview.employeesWithoutPlan > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          tab="opportunities"
          icon={Briefcase}
          label="Vagas internas abertas"
          value={careerAnalytics.overview.activeVacancies}
          intent="info"
        />
        <KpiCard
          tab="plans"
          icon={TrendingUp}
          label="Planos activos"
          value={careerPlansAnalytics.plans.active}
          sub={`${careerPlansAnalytics.plans.completed} concluídos`}
          intent="accent"
        />
        <KpiCard
          tab="succession"
          label="Posições críticas"
          value={successionDashboard.kpis.totalCriticalPositions}
          sub={`${successionDashboard.kpis.withoutSuccessor} sem sucessor`}
          intent={
            successionDashboard.kpis.withoutSuccessor > 0 ? 'danger' : 'success'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="flex flex-col items-center justify-center p-4">
          <GaugeChart
            value={successionDashboard.kpis.coverageRate}
            label="Cobertura de Sucessão"
            thresholds={{ warning: 70, danger: 40 }}
          />
        </Card>
        <EvolutionList
          title="Planos por Departamento"
          items={overview.evolutionByDepartment}
          variant="bar-vertical"
        />
        <EvolutionList
          title="Planos por Unidade"
          items={overview.evolutionByUnit}
          variant="donut"
        />
        <EvolutionList
          title="Planos por Cargo"
          items={overview.evolutionByPosition}
          variant="bar-horizontal"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-brand/60 px-4 py-3 font-body text-sm font-semibold text-white">
          Movimentações Internas (últimos 90 dias)
        </div>
        {overview.internalMovements.length === 0 ? (
          <EmptyState variant="inline" title="Sem movimentações registadas" />
        ) : (
          <div className="overflow-x-auto bg-[#071D3B]">
            <table className="w-full border-collapse font-body text-sm text-white">
              <thead className="bg-brand/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase leading-tight tracking-wide text-white">
                    Tipo de movimentação
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-white">
                    Movimentações
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase leading-tight tracking-wide text-white">
                    % do total
                  </th>
                </tr>
              </thead>
              <tbody>
                {overview.internalMovements.map((m) => (
                  <tr
                    key={m.changeType}
                    className="border-b border-[#6F8FB8]/20 transition-colors duration-150 last:border-0 hover:bg-white/5"
                  >
                    <td className="px-4 py-3">
                      <span className="inline-block whitespace-nowrap rounded-full bg-[#124A88] px-2.5 py-0.5 text-xs font-medium text-[#CFE3FF]">
                        {MOVEMENT_LABELS[m.changeType] ?? m.changeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-white">
                      {m.count}
                    </td>
                    <td className="px-4 py-3 text-center text-[#E8EEF7]">
                      {movementsTotal > 0
                        ? Math.round((m.count / movementsTotal) * 100)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
