// components/processes/DashboardView.tsx
// Aba "Visão Geral" (docs/Modulo_Processes.md §3): KPIs, gráficos e filtros
// (período, departamento, responsável, tipo, estado). GET /processes/dashboard
// (ADMIN/RH/GESTOR). Reaproveita o KPI/lista de instâncias recentes que já
// existiam; os cálculos vivem no backend (src/process-standard/process-overview.ts).

'use client';

import { useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { KpiCard } from '@/components/ui/KpiCard';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import {
  fmtHours,
  INSTANCE_STATUS_LABEL,
  INSTANCE_STATUS_MAP,
  RISK_LEVEL_MAP,
} from './constants';
import { Skeleton } from './Skeleton';
import type { Dashboard } from './types';

export interface DashboardViewProps {
  onOpenInstance: (id: number) => void;
}

const ALL = 'ALL';

interface Filters {
  from: string;
  to: string;
  departmentId: string;
  unitId: string;
  responsibleId: string;
  category: string;
  status: string;
}

const EMPTY_FILTERS: Filters = {
  from: '',
  to: '',
  departmentId: ALL,
  unitId: ALL,
  responsibleId: ALL,
  category: ALL,
  status: ALL,
};

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(INSTANCE_STATUS_LABEL).map(([value, label]) => ({
    value,
    label,
  })),
];

function toParams(f: Filters): Record<string, string> {
  const p: Record<string, string> = {};
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  if (f.departmentId !== ALL) p.departmentId = f.departmentId;
  if (f.unitId !== ALL) p.unitId = f.unitId;
  if (f.responsibleId !== ALL) p.responsibleId = f.responsibleId;
  if (f.category !== ALL) p.category = f.category;
  if (f.status !== ALL) p.status = f.status;
  return p;
}

function ChartCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {empty ? (
        <p className="py-8 text-center font-body text-sm text-ink-faint">
          Sem dados
        </p>
      ) : (
        children
      )}
    </div>
  );
}

export function DashboardView({ onOpenInstance }: DashboardViewProps) {
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const params = useMemo(() => toParams(filters), [filters]);
  const qs = new URLSearchParams(params).toString();

  const { data, isLoading, error } = useApiQuery<Dashboard>(
    queryKeys.processes.dashboard(params),
    `/processes/dashboard${qs ? `?${qs}` : ''}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const set = (patch: Partial<Filters>) =>
    setFilters((prev) => ({ ...prev, ...patch }));
  const hasFilters = qs !== '';

  const opts = data?.filterOptions;

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
          De
          <Input
            type="date"
            value={filters.from}
            onChange={(e) => set({ from: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
          Até
          <Input
            type="date"
            value={filters.to}
            onChange={(e) => set({ to: e.target.value })}
          />
        </label>
        <Select
          items={[
            { value: ALL, label: 'Todas as unidades' },
            ...(opts?.units ?? []).map((u) => ({
              value: String(u.id),
              label: u.name,
            })),
          ]}
          value={filters.unitId}
          onValueChange={(v) => set({ unitId: v })}
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os departamentos' },
            ...(opts?.departments ?? []).map((d) => ({
              value: String(d.id),
              label: d.name,
            })),
          ]}
          value={filters.departmentId}
          onValueChange={(v) => set({ departmentId: v })}
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os responsáveis' },
            ...(opts?.responsibles ?? []).map((r) => ({
              value: String(r.id),
              label: r.fullName,
            })),
          ]}
          value={filters.responsibleId}
          onValueChange={(v) => set({ responsibleId: v })}
        />
        <Select
          items={[
            { value: ALL, label: 'Todos os tipos' },
            ...(opts?.categories ?? []).map((c) => ({ value: c, label: c })),
          ]}
          value={filters.category}
          onValueChange={(v) => set({ category: v })}
        />
        <Select
          items={STATUS_ITEMS}
          value={filters.status}
          onValueChange={(v) => set({ status: v })}
        />
        {hasFilters && (
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="pb-2 font-body text-xs text-primary hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {isLoading && <Skeleton rows={3} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {data && (
        <>
          {data.truncated && (
            <p className="font-body text-xs text-warning-ink">
              Resultados limitados às 5000 instâncias mais recentes — refine os
              filtros para valores exactos.
            </p>
          )}

          {/* Alertas */}
          {data.alerts.length > 0 && (
            <div className="space-y-2">
              {data.alerts.map((a) => (
                <div
                  key={a.message}
                  className={`flex items-center justify-between rounded-card border px-4 py-2 font-body text-sm ${
                    a.level === 'danger'
                      ? 'border-danger bg-danger-subtle text-danger-ink'
                      : a.level === 'warning'
                        ? 'border-warning bg-warning-subtle text-warning-ink'
                        : 'border-info bg-info-subtle text-info-ink'
                  }`}
                >
                  <span>{a.message}</span>
                  <span className="font-medium">{a.count}</span>
                </div>
              ))}
            </div>
          )}

          {/* Indicadores §3 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <KpiCard
              label="Total de processos"
              value={data.kpis.total}
              sub="Criados e registados"
              intent="primary"
            />
            <KpiCard
              label="Em execução"
              value={data.kpis.running}
              sub="Actualmente activos"
              intent="info"
            />
            <KpiCard
              label="Em atraso"
              value={data.kpis.overdue}
              sub="Fora do prazo"
              intent={data.kpis.overdue > 0 ? 'danger' : 'primary'}
            />
            <KpiCard
              label="Concluídos"
              value={data.kpis.completed}
              sub={
                data.kpis.onTimeRate !== null
                  ? `${data.kpis.onTimeRate}% dentro do prazo`
                  : 'Finalizados'
              }
              intent="success"
            />
            <KpiCard
              label="Aprovações pendentes"
              value={data.kpis.pendingApprovals}
              sub="Aguardam decisão"
              intent="warning"
            />
            <KpiCard
              label="Tempo médio"
              value={fmtHours(data.kpis.avgDurationHours)}
              sub="Até à conclusão (exclui cancelados e suspensos)"
              intent="accent"
            />
          </div>

          {/* Gráficos §3 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Processos por estado"
              empty={data.charts.byStatus.length === 0}
            >
              <DonutChart
                data={data.charts.byStatus.map((s) => ({
                  label: INSTANCE_STATUS_LABEL[s.label] ?? s.label,
                  value: s.count,
                }))}
                centerLabel="processos"
              />
            </ChartCard>

            <ChartCard
              title="Criados versus concluídos"
              empty={data.charts.createdVsCompleted.length === 0}
            >
              <AreaLineChart
                series={[
                  {
                    label: 'Criados',
                    points: data.charts.createdVsCompleted.map((m, i) => ({
                      x: i,
                      y: m.created,
                      xLabel: m.month,
                    })),
                  },
                  {
                    label: 'Concluídos',
                    points: data.charts.createdVsCompleted.map((m, i) => ({
                      x: i,
                      y: m.completed,
                      xLabel: m.month,
                    })),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Processos por departamento"
              empty={data.charts.byDepartment.length === 0}
            >
              <BarChart
                orientation="horizontal"
                categories={data.charts.byDepartment.map((d) => d.label)}
                series={[
                  {
                    label: 'Processos',
                    values: data.charts.byDepartment.map((d) => d.count),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Processos por módulo de origem"
              empty={data.charts.bySourceModule.length === 0}
            >
              <BarChart
                categories={data.charts.bySourceModule.map((m) => m.label)}
                series={[
                  {
                    label: 'Processos',
                    values: data.charts.bySourceModule.map((m) => m.count),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Tempo médio de conclusão por tipo (h)"
              empty={data.charts.avgDurationByType.length === 0}
            >
              <BarChart
                categories={data.charts.avgDurationByType.map((d) => d.label)}
                series={[
                  {
                    label: 'Horas',
                    values: data.charts.avgDurationByType.map((d) => d.hours),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Cumprimento do prazo (% por mês)"
              empty={data.charts.onTimeRateByMonth.every((m) => m.rate === null)}
            >
              <AreaLineChart
                yFormat={(v) => `${v}%`}
                series={[
                  {
                    label: 'Dentro do prazo',
                    points: data.charts.onTimeRateByMonth
                      .map((m, i) => ({ x: i, y: m.rate, xLabel: m.month }))
                      .filter((p): p is { x: number; y: number; xLabel: string } =>
                        p.y !== null,
                      ),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Etapas com mais atrasos"
              empty={data.charts.mostDelayedSteps.length === 0}
            >
              <BarChart
                orientation="horizontal"
                categories={data.charts.mostDelayedSteps.map((s) => s.title)}
                series={[
                  {
                    label: 'Atrasos',
                    values: data.charts.mostDelayedSteps.map((s) => s.count),
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Carga de trabalho por responsável"
              empty={data.charts.workloadByResponsible.length === 0}
            >
              <BarChart
                categories={data.charts.workloadByResponsible.map(
                  (r) => r.label,
                )}
                series={[
                  {
                    label: 'Etapas pendentes',
                    values: data.charts.workloadByResponsible.map(
                      (r) => r.count,
                    ),
                  },
                ]}
              />
            </ChartCard>
          </div>

          {/* Biblioteca de modelos (mantido da versão anterior) */}
          <div className="grid grid-cols-3 gap-3">
            <KpiCard
              label="Modelos activos"
              value={data.processes.active}
              sub="Em uso"
              intent="success"
            />
            <KpiCard
              label="Modelos em revisão"
              value={data.processes.inReview}
              sub="Aguardam aprovação"
              intent="warning"
            />
            <KpiCard
              label="Modelos em rascunho"
              value={data.processes.draft}
              sub="Em construção"
              intent="primary"
            />
          </div>

          {/* Instâncias recentes */}
          {data.recentInstances.length > 0 && (
            <div>
              <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Instâncias recentes
              </div>
              <div className="overflow-hidden rounded-card border border-border bg-surface">
                {data.recentInstances.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex cursor-pointer items-center gap-4 border-b border-border px-4 py-3 last:border-0 hover:bg-surface-sunken"
                    onClick={() => onOpenInstance(inst.id)}
                  >
                    <div className="flex-1">
                      <div className="font-body text-sm font-medium text-ink">
                        {inst.process.title}
                      </div>
                      <div className="font-body text-xs text-ink-faint">
                        {inst.targetUser.fullName} · {fmtDate(inst.startedAt)}
                      </div>
                    </div>
                    <StatusBadge
                      value={inst.status}
                      map={INSTANCE_STATUS_MAP}
                      variant="pill"
                    />
                    <StatusBadge
                      value={inst.process.riskLevel}
                      map={RISK_LEVEL_MAP}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
