// components/processes/ReportsView.tsx
// Aba «Indicadores e Relatórios» (docs/Modulo_Processes.md §12): indicadores
// operacionais com definições claras, filtros e agrupamento, consulta dos
// registos que originaram cada indicador e exportação (CSV, Excel, PDF).
// Os cálculos vivem no backend (src/process-standard/process-reports.ts).

'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { API_URL } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { BarChart } from '@/components/ui/charts/BarChart';
import { useToast } from '@/providers/ToastProvider';
import { fmtHours } from './constants';
import { ReportRecordsPanel } from './ReportRecordsPanel';
import { Skeleton } from './Skeleton';
import { UserPicker } from './UserPicker';
import type {
  InstanceFilterOptions,
  ProcessReport,
  RateIndicator,
  ReportGroupBy,
  ReportRecordIndicator,
} from './types';

export interface ReportsViewProps {
  canExport: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const GROUP_ITEMS: Array<{ value: ReportGroupBy; label: string }> = [
  { value: 'department', label: 'Por departamento' },
  { value: 'template', label: 'Por modelo' },
  { value: 'category', label: 'Por tipo de processo' },
  { value: 'sourceModule', label: 'Por módulo de origem' },
  { value: 'responsible', label: 'Por responsável' },
  { value: 'priority', label: 'Por prioridade' },
  { value: 'month', label: 'Por mês' },
];
const PRIORITY_ITEMS = [
  { value: ALL, label: 'Todas as prioridades' },
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

interface Filters {
  from: string;
  to: string;
  unitId: string;
  departmentId: string;
  templateId: string;
  category: string;
  sourceModule: string;
  priority: string;
  responsibleId: string;
  groupBy: ReportGroupBy;
}

const EMPTY: Filters = {
  from: '',
  to: '',
  unitId: ALL,
  departmentId: ALL,
  templateId: ALL,
  category: ALL,
  sourceModule: ALL,
  priority: ALL,
  responsibleId: '',
  groupBy: 'department',
};

const toParams = (f: Filters): Record<string, string> => {
  const p: Record<string, string> = { groupBy: f.groupBy };
  if (f.from) p.from = f.from;
  if (f.to) p.to = f.to;
  (['unitId', 'departmentId', 'templateId', 'category', 'sourceModule', 'priority'] as const).forEach((k) => {
    if (f[k] !== ALL) p[k] = f[k];
  });
  if (f.responsibleId) p.responsibleId = f.responsibleId;
  return p;
};

const pct = (v: number | null) => (v === null ? '—' : `${v}%`);
const rateSub = (r: RateIndicator) => (r.denominator ? `${r.numerator} de ${r.denominator}` : 'Sem dados no período');

function ChartCard({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">{title}</div>
      {empty ? <p className="py-8 text-center font-body text-sm text-ink-faint">Sem dados</p> : children}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  intent,
  indicator,
  definition,
  onDrill,
}: {
  label: string;
  value: string | number;
  sub: string;
  intent: 'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent';
  indicator: ReportRecordIndicator;
  definition?: string;
  onDrill: (indicator: ReportRecordIndicator, title: string, definition?: string) => void;
}) {
  return (
    <button type="button" title={definition} onClick={() => onDrill(indicator, label, definition)} className="text-left">
      <KpiCard label={label} value={value} sub={sub} intent={intent} className="w-full transition-shadow hover:shadow-md" />
    </button>
  );
}

export function ReportsView({ canExport, onOpenInstance }: ReportsViewProps) {
  const notify = useToast();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [drill, setDrill] = useState<{
    indicator: ReportRecordIndicator;
    title: string;
    definition?: string;
    assigneeId?: number;
  } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const params = useMemo(() => toParams(filters), [filters]);
  const { data, isLoading, error } = useApiQuery<ProcessReport>(
    queryKeys.processes.report(params),
    '/processes/reports',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: options } = useApiQuery<InstanceFilterOptions>(
    queryKeys.processes.instanceFilters(),
    '/processes/instances/filter-options',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const set = (patch: Partial<Filters>) => setFilters((p) => ({ ...p, ...patch }));
  const hasFilters = JSON.stringify({ ...filters, groupBy: 'department' }) !== JSON.stringify(EMPTY);
  const def = data?.definitions ?? {};

  const exportAs = async (format: 'csv' | 'xlsx' | 'pdf') => {
    setExporting(format);
    try {
      const qs = new URLSearchParams({ ...params, format }).toString();
      const res = await fetch(`${API_URL}/processes/reports/export?${qs}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao exportar o relatório');
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-processos.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      notify({ title: e instanceof Error ? e.message : 'Falha ao exportar', intent: 'danger' });
    } finally {
      setExporting(null);
    }
  };

  const openDrill = (indicator: ReportRecordIndicator, title: string, definition?: string) =>
    setDrill({ indicator, title, definition });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
          De
          <Input type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} />
        </label>
        <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
          Até
          <Input type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} />
        </label>
        <Select
          items={[{ value: ALL, label: 'Todas as unidades' }, ...(options?.units ?? []).map((u) => ({ value: String(u.id), label: u.name }))]}
          value={filters.unitId}
          onValueChange={(v) => set({ unitId: v })}
          className="w-44"
        />
        <Select
          items={[{ value: ALL, label: 'Todos os departamentos' }, ...(options?.departments ?? []).map((d) => ({ value: String(d.id), label: d.name }))]}
          value={filters.departmentId}
          onValueChange={(v) => set({ departmentId: v })}
          className="w-52"
        />
        <Select
          items={[{ value: ALL, label: 'Todos os modelos' }, ...(options?.templates ?? []).map((t) => ({ value: String(t.id), label: `${t.code} — ${t.title}` }))]}
          value={filters.templateId}
          onValueChange={(v) => set({ templateId: v })}
          className="w-52"
        />
        <Select
          items={[{ value: ALL, label: 'Todos os tipos' }, ...(options?.categories ?? []).map((c) => ({ value: c, label: c }))]}
          value={filters.category}
          onValueChange={(v) => set({ category: v })}
          className="w-44"
        />
        <Select
          items={[{ value: ALL, label: 'Todos os módulos' }, ...(options?.sourceModules ?? []).map((m) => ({ value: m, label: m }))]}
          value={filters.sourceModule}
          onValueChange={(v) => set({ sourceModule: v })}
          className="w-44"
        />
        <Select items={PRIORITY_ITEMS} value={filters.priority} onValueChange={(v) => set({ priority: v })} className="w-48" />
        <UserPicker
          value={filters.responsibleId}
          onChange={(v) => set({ responsibleId: v })}
          placeholder="Responsável"
          className="w-48"
        />
        {hasFilters && (
          <button type="button" onClick={() => setFilters(EMPTY)} className="pb-2 font-body text-xs text-primary hover:underline">
            Limpar filtros
          </button>
        )}
        {canExport && (
          <div className="ml-auto flex gap-2">
            {(['csv', 'xlsx', 'pdf'] as const).map((f) => (
              <Button key={f} intent="secondary" size="sm" onClick={() => exportAs(f)} loading={exporting === f}>
                <Download size={14} strokeWidth={1.75} />
                {f === 'xlsx' ? 'Excel' : f.toUpperCase()}
              </Button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <Skeleton rows={3} />}
      {error && <div className="font-body text-sm text-danger">{error.message}</div>}

      {data && (
        <>
          {data.truncated && (
            <p className="font-body text-xs text-warning-ink">
              Resultados limitados aos 10 000 processos mais recentes do período — refine os filtros para valores exactos.
            </p>
          )}

          {/* Indicadores do período */}
          <div>
            <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Período: processos iniciados entre {new Date(data.range.from).toLocaleDateString('pt-PT')} e{' '}
              {new Date(data.range.to).toLocaleDateString('pt-PT')}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              <Kpi onDrill={openDrill} label="Volume de processos" value={data.indicators.volume.value} sub="Iniciados no período" intent="primary" indicator="total" definition={def.volume} />
              <Kpi onDrill={openDrill} label="Taxa de conclusão" value={pct(data.indicators.completionRate.value)} sub={rateSub(data.indicators.completionRate)} intent="success" indicator="completed" definition={def.completionRate} />
              <Kpi onDrill={openDrill} label="Cumprimento de prazo" value={pct(data.indicators.onTimeRate.value)} sub={rateSub(data.indicators.onTimeRate)} intent="success" indicator="onTime" definition={def.onTimeRate} />
              <Kpi onDrill={openDrill} label="Tempo médio de conclusão" value={fmtHours(data.indicators.avgCompletionHours.value)} sub={`${data.indicators.avgCompletionHours.samples} concluídos (exclui cancelados e suspensos)`} intent="accent" indicator="completed" definition={def.avgCompletionHours} />
              <Kpi onDrill={openDrill} label="Taxa de rejeição" value={pct(data.indicators.rejectionRate.value)} sub={rateSub(data.indicators.rejectionRate)} intent="danger" indicator="rejected" definition={def.rejectionRate} />
              <Kpi onDrill={openDrill} label="Taxa de devolução" value={pct(data.indicators.returnRate.value)} sub={rateSub(data.indicators.returnRate)} intent="warning" indicator="returned" definition={def.returnRate} />
              <Kpi onDrill={openDrill} label="Taxa de reabertura" value={pct(data.indicators.reopenRate.value)} sub={rateSub(data.indicators.reopenRate)} intent="warning" indicator="reopened" definition={def.reopenRate} />
              <Kpi
                onDrill={openDrill}
                label="Falhas de automação"
                value={data.automation.failed}
                sub={data.automation.total ? `${data.automation.failureRate}% de ${data.automation.total} execuções` : 'Sem execuções no período'}
                intent={data.automation.failed ? 'danger' : 'primary'}
                indicator="automationFailures"
                definition={def.automationFailures}
              />
            </div>
          </div>

          {/* Estado actual */}
          <div>
            <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Estado actual (independente do período)
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Kpi onDrill={openDrill} label="Backlog de processos" value={data.snapshot.backlogInstances} sub="Em curso ou suspensos" intent="info" indicator="backlogInstances" definition={def.backlog} />
              <Kpi onDrill={openDrill} label="Backlog de tarefas" value={data.snapshot.backlogTasks} sub={`${data.snapshot.overdueTasks} em atraso`} intent={data.snapshot.overdueTasks ? 'warning' : 'info'} indicator="backlogTasks" definition={def.backlog} />
              <Kpi onDrill={openDrill} label="Processos em atraso" value={data.snapshot.overdueInstances} sub="Prazo ultrapassado" intent={data.snapshot.overdueInstances ? 'danger' : 'primary'} indicator="overdue" definition={def.overdue} />
              <Kpi onDrill={openDrill} label="Aprovações pendentes" value={data.snapshot.pendingApprovals} sub="Aguardam decisão" intent="warning" indicator="pendingApprovals" definition={def.pendingApprovals} />
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Volume por mês" empty={data.indicators.volume.byMonth.length === 0}>
              <BarChart
                categories={data.indicators.volume.byMonth.map((m) => m.month)}
                series={[{ label: 'Processos', values: data.indicators.volume.byMonth.map((m) => m.count) }]}
              />
            </ChartCard>
            <ChartCard title="Tempo médio por etapa (horas)" empty={data.indicators.avgHoursByStep.length === 0}>
              <BarChart
                orientation="horizontal"
                categories={data.indicators.avgHoursByStep.map((s) => s.stepTitle)}
                series={[{ label: 'Horas', values: data.indicators.avgHoursByStep.map((s) => s.hours) }]}
              />
            </ChartCard>
          </div>

          {/* Carga por responsável */}
          <div className="rounded-card border border-border bg-surface">
            <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Carga por responsável (tarefas por resolver)
            </div>
            {data.workload.length === 0 ? (
              <EmptyState title="Sem tarefas por resolver" description="Nenhum responsável tem tarefas em aberto com estes filtros." />
            ) : (
              data.workload.map((w) => (
                <button
                  key={w.assigneeId}
                  type="button"
                  onClick={() =>
                    setDrill({
                      indicator: 'workload',
                      title: `Tarefas de ${w.fullName}`,
                      definition: def.workload,
                      assigneeId: w.assigneeId,
                    })
                  }
                  className="flex w-full items-center justify-between border-b border-border px-4 py-2.5 text-left font-body text-sm last:border-0 hover:bg-surface-sunken"
                >
                  <span className="text-ink">{w.fullName}</span>
                  <span className="text-ink-muted">
                    {w.open} por resolver
                    {w.overdue > 0 && <span className="ml-2 text-danger">{w.overdue} em atraso</span>}
                  </span>
                </button>
              ))
            )}
          </div>

          {/* Agrupamento */}
          <div className="rounded-card border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div className="font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Agrupamento</div>
              <Select
                items={GROUP_ITEMS}
                value={filters.groupBy}
                onValueChange={(v) => set({ groupBy: v as ReportGroupBy })}
                className="w-56"
              />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[2fr_80px_100px_90px_90px_110px_120px_110px] gap-3 border-b border-border px-4 py-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                  <div>Grupo</div>
                  <div>Total</div>
                  <div>Concluídos</div>
                  <div>Cancel.</div>
                  <div>Atraso</div>
                  <div>Conclusão</div>
                  <div>Cumpr. prazo</div>
                  <div>Duração méd.</div>
                </div>
                {data.groups.length === 0 && (
                  <EmptyState title="Sem dados" description="Não há processos no período com estes filtros." />
                )}
                {data.groups.map((g) => (
                  <div
                    key={g.key}
                    className="grid grid-cols-[2fr_80px_100px_90px_90px_110px_120px_110px] items-center gap-3 border-b border-border px-4 py-2.5 font-body text-sm last:border-0"
                  >
                    <div className="truncate text-ink">{g.label}</div>
                    <div className="text-ink-muted">{g.total}</div>
                    <div className="text-ink-muted">{g.completed}</div>
                    <div className="text-ink-muted">{g.cancelled}</div>
                    <div className={cn(g.overdue ? 'font-medium text-danger' : 'text-ink-muted')}>{g.overdue}</div>
                    <div className="text-ink-muted">{pct(g.completionRate)}</div>
                    <div className="text-ink-muted">{pct(g.onTimeRate)}</div>
                    <div className="text-ink-muted">{fmtHours(g.avgHours)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Definições */}
          <details className="rounded-card border border-border bg-surface p-4">
            <summary className="cursor-pointer font-body text-sm font-medium text-ink">
              Definição das métricas
            </summary>
            <dl className="mt-3 space-y-2 font-body text-sm">
              {Object.entries(data.definitions).map(([k, v]) => (
                <div key={k}>
                  <dt className="font-medium text-ink">{k}</dt>
                  <dd className="text-ink-muted">{v}</dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}

      {drill && (
        <ReportRecordsPanel
          indicator={drill.indicator}
          title={drill.title}
          definition={drill.definition}
          assigneeId={drill.assigneeId}
          filters={params}
          onClose={() => setDrill(null)}
          onOpenInstance={(id) => {
            setDrill(null);
            onOpenInstance(id);
          }}
        />
      )}
    </div>
  );
}
