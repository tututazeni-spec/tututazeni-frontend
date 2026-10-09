// components/leave/OverviewTab.tsx
// Separador "Visão Geral" (docs/Modulo_Leave.md §2) — 4 cards, 6 gráficos e
// filtros por período/unidade/departamento/tipo/estado. O âmbito dos dados
// (próprio / equipa / organização) é decidido pelo backend; aqui só se
// mostra qual é. Substitui o antigo "Dashboard RH" (LeaveDashboardTab).

'use client';

import { useState } from 'react';
import { CalendarCheck, CalendarClock, CalendarOff, Palmtree } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Input } from '@/components/ui/Input';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import {
  useDepartmentOptions,
  useUnitOptions,
} from '@/components/competencies/modelFormData';
import { useLeaveOverview } from '@/hooks/useLeave';
import { DEPT_COLORS, STATUS_CFG, monthLabel } from './constants';
import type { LeaveScope, LeaveType, OverviewFilters } from './types';

const ALL = 'ALL';

const SCOPE_LABEL: Record<LeaveScope, string> = {
  ORGANIZATION: 'Toda a organização',
  TEAM: 'A sua equipa',
  SELF: 'Os seus dados',
};

function currentYearRange() {
  const y = new Date().getFullYear();
  return { from: `${y}-01-01`, to: `${y}-12-31` };
}

export interface OverviewTabProps {
  leaveTypes: LeaveType[];
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <h3 className="bg-[#0F1F3D]/60 px-5 py-3 font-body text-sm font-semibold text-white">
        {title}
      </h3>
      <div className="p-5">
        <ErrorBoundary source={`leave.overview.${title}`}>
          {children}
        </ErrorBoundary>
      </div>
    </Card>
  );
}

function NoData() {
  return (
    <p className="py-8 text-center text-sm text-ink-faint">
      Sem dados para os filtros seleccionados.
    </p>
  );
}

export function OverviewTab({ leaveTypes }: OverviewTabProps) {
  const [filters, setFilters] = useState<OverviewFilters>({
    ...currentYearRange(),
    unitId: '',
    departmentId: '',
    leaveTypeCode: '',
    status: '',
  });
  const { data, loading } = useLeaveOverview(filters);
  const units = useUnitOptions();
  const departments = useDepartmentOptions();

  const set = (patch: Partial<OverviewFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);
  const withAll = (items: { value: string; label: string }[], label: string) => [
    { value: ALL, label },
    ...items,
  ];

  const filterBar = (
    <Card className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <label className="text-xs text-ink-muted space-y-1">
          <span>De</span>
          <Input
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
            className="w-full"
          />
        </label>
        <label className="text-xs text-ink-muted space-y-1">
          <span>Até</span>
          <Input
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
            className="w-full"
          />
        </label>
        <div className="text-xs text-ink-muted space-y-1">
          <span>Unidade</span>
          <Select
            className="w-full"
            value={filters.unitId || ALL}
            onValueChange={(v) => set({ unitId: pick(v) })}
            items={withAll(units.options, 'Todas')}
          />
        </div>
        <div className="text-xs text-ink-muted space-y-1">
          <span>Departamento</span>
          <Select
            className="w-full"
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: pick(v) })}
            items={withAll(departments.options, 'Todos')}
          />
        </div>
        <div className="text-xs text-ink-muted space-y-1">
          <span>Tipo de ausência</span>
          <Select
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={withAll(
              leaveTypes.map((t) => ({ value: t.code, label: t.name })),
              'Todos',
            )}
          />
        </div>
        <div className="text-xs text-ink-muted space-y-1">
          <span>Estado</span>
          <Select
            className="w-full"
            value={filters.status || ALL}
            onValueChange={(v) => set({ status: pick(v) })}
            items={withAll(
              Object.entries(STATUS_CFG)
                .filter(([k]) => k !== 'DRAFT')
                .map(([value, c]) => ({ value, label: c.label })),
              'Todos',
            )}
          />
        </div>
      </div>
    </Card>
  );

  if (loading && !data) {
    return (
      <div className="space-y-5">
        {filterBar}
        <Skeleton
          rows={4}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
          itemClassName="h-24 bg-surface-sunken rounded-card"
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-5">
        {filterBar}
        <EmptyState
          title="Visão geral não disponível"
          description="Não foi possível carregar os indicadores de férias e ausências."
        />
      </div>
    );
  }

  const { cards, charts } = data;
  const monthCats = charts.absencesByMonth.map((m) => monthLabel(m.month));
  const hasAbsences = charts.absencesByMonth.some((m) => m.count > 0);
  const hasVacation = charts.plannedVsTaken.some((m) => m.planned > 0);
  const statusItems = charts.byStatus.map((s) => ({
    ...s,
    label: STATUS_CFG[s.status]?.label ?? s.status,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">
          Âmbito: <strong>{SCOPE_LABEL[data.scope]}</strong>
        </p>
      </div>
      {filterBar}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NavyStatCard
          icon={Palmtree}
          tone="green"
          label="Férias disponíveis"
          value={cards.vacationAvailable ?? '—'}
          sub="dias · o seu saldo"
        />
        <NavyStatCard
          icon={CalendarClock}
          tone="orange"
          label="Pedidos pendentes"
          value={cards.pendingRequests}
        />
        <NavyStatCard
          icon={CalendarCheck}
          tone="blue"
          label="Dias de férias gozados"
          value={cards.vacationTaken}
          sub="no período"
        />
        <NavyStatCard
          icon={CalendarOff}
          tone="red"
          label="Ausências no período"
          value={cards.absences.total}
          sub={`${cards.absences.justified} justificadas · ${cards.absences.unjustified} injustificadas`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Ausências por mês">
          {hasAbsences ? (
            <AreaLineChart
              series={[
                {
                  label: 'Ausências',
                  points: charts.absencesByMonth.map((m, i) => ({
                    x: i,
                    y: m.count,
                    xLabel: monthCats[i],
                  })),
                },
              ]}
            />
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="Ausências por tipo">
          {charts.byType.length ? (
            <DonutChart
              centerLabel="dias"
              data={charts.byType.map((t) => ({
                label: t.name,
                value: t.days,
              }))}
            />
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="Absentismo por departamento (%)">
          {charts.absenteeismByDepartment.length ? (
            <BarChart
              orientation="horizontal"
              categories={charts.absenteeismByDepartment
                .slice(0, 8)
                .map((d) => d.department)}
              series={[
                {
                  label: 'Taxa de absentismo',
                  values: charts.absenteeismByDepartment
                    .slice(0, 8)
                    .map((d) => d.rate),
                },
              ]}
              yFormat={(v) => `${v}%`}
            />
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="Férias planeadas vs. gozadas">
          {hasVacation ? (
            <BarChart
              categories={monthCats}
              series={[
                {
                  label: 'Planeadas',
                  values: charts.plannedVsTaken.map((m) => m.planned),
                },
                {
                  label: 'Gozadas',
                  values: charts.plannedVsTaken.map((m) => m.taken),
                },
              ]}
            />
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="Pedidos por estado">
          {statusItems.some((s) => s.count > 0) ? (
            <BarChart
              categories={statusItems.map((s) => s.label)}
              series={[
                { label: 'Pedidos', values: statusItems.map((s) => s.count) },
              ]}
            />
          ) : (
            <NoData />
          )}
        </ChartCard>

        <ChartCard title="Disponibilidade da equipa">
          {charts.absenteeismByDepartment.length ? (
            <ul className="space-y-2 text-sm">
              {charts.absenteeismByDepartment.slice(0, 8).map((d, i) => {
                const availability = Math.max(0, 100 - d.rate);
                return (
                  <li key={d.departmentId ?? 'none'}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-ink-muted">{d.department}</span>
                      <span className="text-ink-faint">
                        {availability.toFixed(1)}% · {d.headcount} colab.
                      </span>
                    </div>
                    <div className="h-2 bg-surface-sunken rounded-pill overflow-hidden">
                      <div
                        className="h-full rounded-pill"
                        style={{
                          width: `${availability}%`,
                          backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length],
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <NoData />
          )}
        </ChartCard>
      </div>
    </div>
  );
}
