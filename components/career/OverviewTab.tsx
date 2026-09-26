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
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import type { CareerOverview } from './types';

// Comparação entre categorias nomeadas (departamento/unidade/cargo) — antes
// eram barras horizontais desenhadas à mão, sem hover; agora usa o
// BarChart partilhado do design system (mesma cor de série, tooltip incluído).
function EvolutionList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  const top = items.slice(0, 6);
  return (
    <Card className="p-4">
      <div className="mb-3 font-body text-sm font-semibold text-ink">{title}</div>
      {top.length === 0 ? (
        <div className="py-3 text-center font-body text-xs text-ink-faint">Sem dados</div>
      ) : (
        <BarChart
          orientation="horizontal"
          categories={top.map((i) => i.key)}
          series={[{ label: title, values: top.map((i) => i.count) }]}
        />
      )}
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

  const { careerAnalytics, careerPlansAnalytics, successionDashboard } = overview;

  return (
    <div className="space-y-5">
      {overview.alerts.length > 0 && (
        <Card className="border-warning bg-warning-subtle p-4">
          <div className="mb-2 flex items-center gap-1.5 font-body text-sm font-semibold text-warning-ink">
            <AlertTriangle size={16} strokeWidth={1.75} />
            Alertas
          </div>
          <ul className="space-y-1 font-body text-xs text-warning-ink">
            {overview.alerts.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Users}
          label="Colaboradores"
          value={careerAnalytics.overview.totalUsers}
          sub={`${careerAnalytics.overview.usersWithActivePlan} com plano activo`}
          intent="primary"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Sem plano de carreira"
          value={overview.employeesWithoutPlan}
          intent={overview.employeesWithoutPlan > 0 ? 'warning' : 'success'}
        />
        <KpiCard
          icon={Briefcase}
          label="Vagas internas abertas"
          value={careerAnalytics.overview.activeVacancies}
          intent="info"
        />
        <KpiCard
          icon={TrendingUp}
          label="Planos activos"
          value={careerPlansAnalytics.plans.active}
          sub={`${careerPlansAnalytics.plans.completed} concluídos`}
          intent="accent"
        />
        <KpiCard
          label="Posições críticas"
          value={successionDashboard.kpis.totalCriticalPositions}
          sub={`${successionDashboard.kpis.withoutSuccessor} sem sucessor`}
          intent={successionDashboard.kpis.withoutSuccessor > 0 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="flex flex-col items-center justify-center p-4">
          <GaugeChart
            value={successionDashboard.kpis.coverageRate}
            label="Cobertura de Sucessão"
            thresholds={{ warning: 70, danger: 40 }}
          />
        </Card>
        <EvolutionList title="Planos por Departamento" items={overview.evolutionByDepartment} />
        <EvolutionList title="Planos por Unidade" items={overview.evolutionByUnit} />
        <EvolutionList title="Planos por Cargo" items={overview.evolutionByPosition} />
      </div>

      <Card className="p-4">
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Movimentações Internas (últimos 90 dias)
        </div>
        {overview.internalMovements.length === 0 ? (
          <div className="py-3 text-center font-body text-xs text-ink-faint">
            Sem movimentações registadas
          </div>
        ) : (
          <DonutChart
            centerLabel="Movimentações"
            data={overview.internalMovements.map((m) => ({ label: m.changeType, value: m.count }))}
          />
        )}
      </Card>
    </div>
  );
}
