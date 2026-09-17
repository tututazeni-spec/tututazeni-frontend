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
import type { CareerOverview } from './types';

function EvolutionList({ title, items }: { title: string; items: Array<{ key: string; count: number }> }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card className="p-4">
      <div className="mb-3 font-body text-sm font-semibold text-ink">{title}</div>
      {items.length === 0 ? (
        <div className="py-3 text-center font-body text-xs text-ink-faint">Sem dados</div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((i) => (
            <div key={i.key} className="flex items-center gap-2">
              <span className="w-24 flex-shrink-0 truncate font-body text-xs text-ink-muted">
                {i.key}
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-pill bg-surface-sunken">
                <div
                  className="h-full rounded-pill bg-primary"
                  style={{ width: `${(i.count / max) * 100}%` }}
                />
              </div>
              <span className="w-6 flex-shrink-0 text-right font-mono text-xs text-ink-faint">
                {i.count}
              </span>
            </div>
          ))}
        </div>
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
        <KpiCard
          label="Cobertura de sucessão"
          value={`${successionDashboard.kpis.coverageRate}%`}
          intent="primary"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          <div className="flex flex-wrap gap-3">
            {overview.internalMovements.map((m) => (
              <div key={m.changeType} className="rounded-control bg-surface-sunken px-3 py-2">
                <div className="font-mono text-lg font-bold text-ink">{m.count}</div>
                <div className="font-body text-xs text-ink-faint">{m.changeType}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
