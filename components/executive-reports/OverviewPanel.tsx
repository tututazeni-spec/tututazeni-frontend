// components/executive-reports/OverviewPanel.tsx
// Separador "Visão Executiva" (docs/Executive_Reports.md §1.1, §3.1, §6):
// alertas, 6 KPIs principais com tendência, indicadores complementares e
// gráficos de distribuição. Mesmo esqueleto do OverviewPanel do dashboard-rh.

'use client';

import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock,
  GraduationCap,
  Rocket,
  Star,
  Target,
  TrendingDown,
  UserMinus,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { AlertStrip } from '@/components/dashboard-rh/AlertStrip';
import { ExecutiveKpiCard } from './ExecutiveKpiCard';
import type { ExecutiveFilters, ExecutiveOverview } from './dashboardTypes';
import { filtersToParams } from './filtersToParams';

const KPI_ICONS: Record<string, LucideIcon> = {
  HEADCOUNT: Users,
  PERFORMANCE: Star,
  TRAINING_COMPLETION: BookOpen,
  ATTENDANCE: Clock,
  TURNOVER: TrendingDown,
  PDI_OVERDUE: Target,
};

const CONTRACT_LABEL: Record<string, string> = {
  INDEFINITE: 'Efectivo',
  FIXED_TERM: 'Termo certo',
  UNCERTAIN_TERM: 'Termo incerto',
  APPRENTICESHIP: 'Aprendizagem',
  INTERNSHIP: 'Estágio',
  SERVICE_PROVISION: 'Prestação de serviços',
  TEMPORARY_PLACEMENT: 'Cedência temporária',
  PART_TIME: 'Tempo parcial',
};

export interface OverviewPanelProps {
  filters: ExecutiveFilters;
}

const pct = (v: number | null) => (v === null ? 'Sem dados' : `${v}%`);

export function OverviewPanel({ filters }: OverviewPanelProps) {
  const params = filtersToParams(filters);
  const q = useApiQuery<ExecutiveOverview>(
    queryKeys.executiveReports.overview(params),
    '/executive-reports/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={6}
        wrapperClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse"
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return (
      <QueryError error={q.error} onRetry={() => q.refetch()} />
    );

  const d = q.data;
  const showComparison = d.context.compareWith !== 'target';
  const alerts = d.alerts.map((a) => ({
    type: a.code,
    severity: a.severity,
    message: a.message,
  }));
  const deptRows = d.workforce.byDepartment.slice(0, 10);
  const contracts = d.workforce.byContractType.map((c) => ({
    label: CONTRACT_LABEL[c.label] ?? c.label,
    value: c.value,
  }));

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* 6 KPIs principais (§3.1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.kpis.map((k) => (
          <ExecutiveKpiCard
            key={k.code}
            kpi={k}
            icon={KPI_ICONS[k.code] ?? Target}
            showComparison={showComparison}
          />
        ))}
      </div>

      {/* Indicadores complementares (§3.1, lista adicional) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Admissões"
          value={d.workforce.hires}
          tone="green"
          icon={UserPlus}
        />
        <NavyStatCard
          label="Saídas"
          value={d.workforce.exits}
          tone="red"
          icon={UserMinus}
        />
        <NavyStatCard
          label="Saldo líquido"
          value={`${d.workforce.netBalance > 0 ? '+' : ''}${d.workforce.netBalance}`}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          label="Rotatividade (12 meses)"
          value={pct(d.workforce.turnoverLast12Months)}
          tone="orange"
          icon={TrendingDown}
        />
        <NavyStatCard
          label="Inscrições / concluídas"
          value={`${d.training.enrollmentsEligible} / ${d.training.enrollmentsCompleted}`}
          tone="blue"
          icon={GraduationCap}
        />
        <NavyStatCard
          label="Participantes · horas"
          value={`${d.training.participants} · ${d.training.hours}h`}
          tone="green"
          icon={BookOpen}
        />
        <NavyStatCard
          label="Avaliações concluídas"
          value={pct(d.performance.completionPct)}
          tone="orange"
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Competências avaliadas"
          value={pct(d.competencies.evaluatedPct)}
          tone="blue"
          icon={Wrench}
        />
        <NavyStatCard
          label="Lacunas de competências"
          value={d.competencies.gapsIdentified}
          tone="red"
          icon={Wrench}
        />
        <NavyStatCard
          label="Licenças pendentes · em curso"
          value={`${d.leave.pending} · ${d.leave.inCourse}`}
          tone="orange"
          icon={CalendarClock}
        />
        <NavyStatCard
          label="Onboarding em curso · concluído"
          value={`${d.onboarding.inProgress} · ${d.onboarding.completed}`}
          tone="green"
          icon={Rocket}
        />
        <NavyStatCard
          label="PDIs activos"
          value={d.development.activePlans}
          tone="blue"
          icon={Target}
        />
      </div>

      {/* Pendências críticas */}
      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="mb-3 font-body font-semibold text-ink-muted">
          Pendências críticas
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            ['Formações obrigatórias em atraso', d.pending.overdueMandatoryTraining],
            ['Acções de PDI atrasadas', d.pending.overdueActions],
            ['Pedidos de licença por aprovar', d.pending.pendingLeaveApprovals],
          ].map(([label, n]) => (
            <div
              key={label as string}
              className="rounded-control bg-surface-sunken px-4 py-3"
            >
              <p className="font-display text-2xl font-bold text-ink">{n}</p>
              <p className="font-body text-xs text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Distribuição e composição (§6.2/6.3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Colaboradores por departamento
          </h3>
          {deptRows.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">Sem dados</p>
          ) : (
            <BarChart
              orientation="horizontal"
              categories={deptRows.map((r) => r.label)}
              series={[
                { label: 'Colaboradores', values: deptRows.map((r) => r.value) },
              ]}
              height={Math.max(160, deptRows.length * 34)}
            />
          )}
        </div>
        <div className="rounded-card border border-border bg-surface p-5">
          <h3 className="mb-4 font-body font-semibold text-ink-muted">
            Tipo de vínculo
          </h3>
          {contracts.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">Sem dados</p>
          ) : (
            <DonutChart centerLabel="Colaboradores" data={contracts} />
          )}
        </div>
      </div>
    </div>
  );
}
