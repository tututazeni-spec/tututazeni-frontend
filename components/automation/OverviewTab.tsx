// components/automation/OverviewTab.tsx
// Visão Geral (docs/modulo_automation.md §2): 6 cards + 5 gráficos, todos
// calculados no backend (GET /automation/overview) — nada é derivado aqui
// além da formatação.

import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Hourglass,
  Play,
  Timer,
  Zap,
  ListChecks,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { AreaLineChart } from '@/components/ui/charts/AreaLineChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { DonutChart } from '@/components/ui/charts/DonutChart';
import { CATEGORY_LABEL } from './constants';
import type { OverviewData } from './types';

const ALL = '__all__';

const GRANULARITY_ITEMS = [
  { value: 'day', label: 'Por dia' },
  { value: 'week', label: 'Por semana' },
  { value: 'month', label: 'Por mês' },
];

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'SUCCESS', label: 'Sucesso' },
  { value: 'FAILED', label: 'Falha' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'RUNNING', label: 'Em execução' },
  { value: 'SKIPPED', label: 'Ignorada' },
];

const CATEGORY_ITEMS = [
  { value: ALL, label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_LABEL)
    .filter(([k]) => k !== 'AUTOMATION')
    .map(([value, label]) => ({ value, label })),
];

const STATUS_LABEL: Record<string, string> = {
  SUCCESS: 'Sucesso',
  FAILED: 'Falha',
  PENDING: 'Pendente',
  RUNNING: 'Em execução',
  SKIPPED: 'Ignorada',
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

function formatTimeSaved(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  return `${(minutes / 60).toFixed(1)} h`;
}

function shortDate(date: string) {
  // 'YYYY-MM-DD' → 'DD/MM'; 'YYYY-MM' mantém-se.
  return date.length === 10 ? `${date.slice(8, 10)}/${date.slice(5, 7)}` : date;
}

export function OverviewTab() {
  const [from, setFrom] = useState(() =>
    isoDay(new Date(Date.now() - 30 * 24 * 3600 * 1000)),
  );
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [granularity, setGranularity] = useState('day');
  const [module, setModule] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);

  const { data: modules = [] } = useApiQuery<string[]>(
    queryKeys.automation.modules(),
    '/automation/modules',
    { staleTime: STALE_TIME.STATIC },
  );

  const params = {
    // `to` inclusivo: até ao fim do dia escolhido.
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${to}T23:59:59.999Z` : undefined,
    granularity,
    module: module === ALL ? undefined : module,
    category: category === ALL ? undefined : category,
    status: status === ALL ? undefined : status,
  };

  const { data, isLoading } = useApiQuery<OverviewData>(
    queryKeys.automation.overview(params),
    '/automation/overview',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const moduleItems = useMemo(
    () => [
      { value: ALL, label: 'Todos os módulos' },
      ...modules.map((m) => ({ value: m, label: m })),
    ],
    [modules],
  );

  const c = data?.cards;
  const timeline = data?.timeline ?? [];

  return (
    <div className="space-y-5">
      <Card>
        <CardBody>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
              De
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
              Até
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <Select
              items={GRANULARITY_ITEMS}
              value={granularity}
              onValueChange={setGranularity}
              className="min-w-[130px]"
            />
            <Select
              items={moduleItems}
              value={module}
              onValueChange={setModule}
              className="min-w-[170px]"
            />
            <Select
              items={CATEGORY_ITEMS}
              value={category}
              onValueChange={setCategory}
              className="min-w-[170px]"
            />
            <Select
              items={STATUS_ITEMS}
              value={status}
              onValueChange={setStatus}
              className="min-w-[160px]"
            />
          </div>
          <p className="mt-2 font-body text-[11px] text-ink-faint">
            Filtros por unidade e departamento ficam disponíveis quando as
            regras passarem a guardar o âmbito organizacional.
          </p>
        </CardBody>
      </Card>

      {isLoading || !c ? (
        <Skeleton
          rows={3}
          wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-3"
          itemClassName="skeleton-shimmer h-24 rounded-card"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard
              className="w-full"
              icon={ListChecks}
              label="Total de automações"
              value={c.totalRules}
              intent="primary"
            />
            <KpiCard
              className="w-full"
              icon={Zap}
              label="Automações activas"
              value={c.activeRules}
              intent="success"
            />
            <KpiCard
              className="w-full"
              icon={Play}
              label="Execuções no período"
              value={c.executions}
              sub={
                data?.successRate !== null && data?.successRate !== undefined
                  ? `${data.successRate}% com sucesso`
                  : undefined
              }
              intent="info"
            />
            <KpiCard
              className="w-full"
              icon={AlertTriangle}
              label="Execuções com falha"
              value={c.failedExecutions}
              intent={c.failedExecutions > 0 ? 'danger' : 'success'}
            />
            <KpiCard
              className="w-full"
              icon={Hourglass}
              label="A aguardar"
              value={c.waiting}
              sub="Execuções pendentes / em curso"
              intent="warning"
            />
            <KpiCard
              className="w-full"
              icon={Timer}
              label="Tempo poupado (estimativa)"
              value={formatTimeSaved(c.timeSaved.minutes)}
              sub={`${c.timeSaved.basisMinutesPerExecution} min por execução com sucesso`}
              intent="accent"
            />
          </div>

          {data?.truncated && (
            <p className="flex items-center gap-2 rounded-card border border-warning bg-warning-subtle px-3 py-2 font-body text-xs text-warning-ink">
              <Clock size={14} strokeWidth={1.75} />
              Período com muitas execuções: os gráficos consideram apenas as
              primeiras 50 000. Reduz o intervalo para ver tudo.
            </p>
          )}

          {c.executions === 0 ? (
            <EmptyState
              icon={Play}
              title="Sem execuções neste período"
              description="Ajusta o intervalo ou os filtros para ver o desempenho das automações."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
                  Execuções ao longo do tempo
                </div>
                <CardBody>
                  <AreaLineChart
                    series={[
                      {
                        label: 'Execuções',
                        points: timeline.map((t, i) => ({
                          x: i,
                          y: t.total,
                          xLabel: shortDate(t.date),
                        })),
                      },
                    ]}
                  />
                </CardBody>
              </Card>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
                  Execuções por estado
                </div>
                <CardBody>
                  <DonutChart
                    data={Object.entries(data?.byStatus ?? {})
                      .filter(([, v]) => v > 0)
                      .map(([k, v]) => ({
                        label: STATUS_LABEL[k] ?? k,
                        value: v,
                      }))}
                    centerLabel="execuções"
                  />
                </CardBody>
              </Card>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
                  Automações por módulo
                </div>
                <CardBody>
                  <BarChart
                    orientation="horizontal"
                    categories={(data?.byModule ?? [])
                      .slice(0, 8)
                      .map((m) => CATEGORY_LABEL[m.label] ?? m.label)}
                    series={[
                      {
                        label: 'Execuções',
                        values: (data?.byModule ?? [])
                          .slice(0, 8)
                          .map((m) => m.count),
                      },
                    ]}
                  />
                </CardBody>
              </Card>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
                  Taxa de sucesso
                </div>
                <CardBody>
                  <AreaLineChart
                    yFormat={(v) => `${v}%`}
                    series={[
                      {
                        label: 'Taxa de sucesso (%)',
                        points: timeline
                          .filter((t) => t.successRate !== null)
                          .map((t, i) => ({
                            x: i,
                            y: t.successRate as number,
                            xLabel: shortDate(t.date),
                          })),
                      },
                    ]}
                  />
                </CardBody>
              </Card>

              <Card className="lg:col-span-2 overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
                  Principais causas de falha
                </div>
                <CardBody>
                  {(data?.failureCauses ?? []).length === 0 ? (
                    <p className="font-body text-sm text-ink-faint">
                      Sem falhas no período.
                    </p>
                  ) : (
                    <BarChart
                      orientation="horizontal"
                      categories={(data?.failureCauses ?? []).map(
                        (f) => f.label,
                      )}
                      series={[
                        {
                          label: 'Falhas',
                          color: 'var(--color-danger)',
                          values: (data?.failureCauses ?? []).map(
                            (f) => f.count,
                          ),
                        },
                      ]}
                    />
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
