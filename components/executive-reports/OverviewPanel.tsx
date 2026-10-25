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
import { deptColor } from './deptColor';
import { DonutStatCard } from './DonutStatCard';
import { SpeedometerRateCard } from './SpeedometerRateCard';
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

// KPIs principais apresentados como donut, numa linha própria
const DONUT_KPI_CODES = ['TRAINING_COMPLETION', 'ATTENDANCE'];

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
        itemClassName="h-[155px] rounded-panel bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data;
  const showComparison = d.context.compareWith !== 'target';
  const alerts = d.alerts.map((a) => ({
    type: a.code,
    severity: a.severity,
    message: a.message,
  }));
  const deptRows = d.workforce.byDepartment;
  const contracts = d.workforce.byContractType.map((c) => ({
    label: CONTRACT_LABEL[c.label] ?? c.label,
    value: c.value,
  }));

  return (
    <div className="space-y-5">
      <AlertStrip alerts={alerts} />

      {/* 6 KPIs principais (§3.1) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {d.kpis
          .filter((k) => !DONUT_KPI_CODES.includes(k.code))
          .map((k) =>
            k.code === 'TURNOVER' ? (
              <DonutStatCard
                key={k.code}
                label={k.shortLabel}
                percent={k.value}
                color="#EF4657"
                sub={k.target !== null ? `Meta ${k.target}%` : undefined}
              />
            ) : (
              <ExecutiveKpiCard
                key={k.code}
                kpi={k}
                icon={KPI_ICONS[k.code] ?? Target}
                showComparison={showComparison}
              />
            ),
          )}
        <NavyStatCard
          href="/evaluation"
          label="Avaliações concluídas"
          value={
            d.performance.completionPct === null
              ? ''
              : `${d.performance.completionPct}%`
          }
          tone="orange"
          icon={CheckCircle2}
        />
        <NavyStatCard
          href="/courses?tab=inscricoes"
          label="Inscrições / concluídas"
          value={`${d.training.enrollmentsEligible} / ${d.training.enrollmentsCompleted}`}
          tone="blue"
          icon={GraduationCap}
        />
      </div>

      {/* Taxas em donut: formação, assiduidade, rotatividade, competências */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {DONUT_KPI_CODES.map((code) => {
          const k = d.kpis.find((x) => x.code === code);
          if (k && code === 'ATTENDANCE')
            return (
              <SpeedometerRateCard
                key={code}
                label={k.shortLabel}
                percent={k.value}
                sub={k.target !== null ? `Meta ${k.target}%` : undefined}
              />
            );
          return k ? (
            <DonutStatCard
              key={code}
              label={k.shortLabel}
              percent={k.value}
              color={code === 'TRAINING_COMPLETION' ? '#1877F2' : '#218653'}
              sub={k.target !== null ? `Meta ${k.target}%` : undefined}
            />
          ) : null;
        })}
        <DonutStatCard
          label="Rotatividade (12 meses)"
          percent={d.workforce.turnoverLast12Months}
          color="#E99A16"
        />
        <DonutStatCard
          label="Competências avaliadas"
          percent={d.competencies.evaluatedPct}
          color="#1877F2"
        />
      </div>

      {/* Indicadores complementares (§3.1, lista adicional) */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          href="/history?tab=movements"
          label="Admissões"
          value={d.workforce.hires}
          tone="green"
          icon={UserPlus}
        />
        <NavyStatCard
          href="/history?tab=movements"
          label="Saídas"
          value={d.workforce.exits}
          tone="red"
          icon={UserMinus}
        />
        <NavyStatCard
          href="/history?tab=movements"
          label="Saldo líquido"
          value={`${d.workforce.netBalance > 0 ? '+' : ''}${d.workforce.netBalance}`}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          href="/trainings"
          label="Participantes · horas"
          value={`${d.training.participants} · ${d.training.hours}h`}
          tone="green"
          icon={BookOpen}
        />
        <NavyStatCard
          href="/competencies?tab=gaps"
          label="Lacunas de competências"
          value={d.competencies.gapsIdentified}
          tone="red"
          icon={Wrench}
        />
        <NavyStatCard
          href="/leave?tab=approvals"
          label="Licenças pendentes · em curso"
          value={`${d.leave.pending} · ${d.leave.inCourse}`}
          tone="orange"
          icon={CalendarClock}
        />
        <NavyStatCard
          href="/onboarding"
          label="Onboarding em curso · concluído"
          value={`${d.onboarding.inProgress} · ${d.onboarding.completed}`}
          tone="green"
          icon={Rocket}
        />
        <NavyStatCard
          href="/development-plans"
          label="PDIs activos"
          value={d.development.activePlans}
          tone="blue"
          icon={Target}
        />
      </div>

      {/* Pendências críticas */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <h3 className="bg-brand/60 px-5 py-3 font-body font-semibold text-white">
          Pendências críticas
        </h3>
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-3">
          <NavyStatCard
            href="/trainings"
            label="Formações obrigatórias em atraso"
            value={d.pending.overdueMandatoryTraining}
            tone="red"
            icon={GraduationCap}
          />
          <NavyStatCard
            href="/development-plans"
            label="Acções de PDI atrasadas"
            value={d.pending.overdueActions}
            tone="orange"
            icon={Clock}
          />
          <NavyStatCard
            label="Pedidos de licença por aprovar"
            value={d.pending.pendingLeaveApprovals}
            tone="blue"
            icon={CalendarClock}
          />
        </div>
      </div>

      {/* Distribuição e composição (§6.2/6.3) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <h3 className="bg-brand/60 px-5 py-3 font-body font-semibold text-white">
            Colaboradores por departamento
          </h3>
          <div className="p-5">
            {deptRows.length === 0 ? null : (
              <BarChart
                orientation="horizontal"
                categories={deptRows.map((r) => r.label)}
                series={[
                  {
                    label: 'Colaboradores',
                    values: deptRows.map((r) => r.value),
                    barColors: deptRows.map((_, i) => deptColor(i)),
                  },
                ]}
                height={Math.max(160, deptRows.length * 34)}
              />
            )}
          </div>
        </div>
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <h3 className="bg-brand/60 px-5 py-3 font-body font-semibold text-white">
            Tipo de vínculo
          </h3>
          <div className="p-5">
            {contracts.length === 0 ? null : (
              <DonutChart centerLabel="Colaboradores" data={contracts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
