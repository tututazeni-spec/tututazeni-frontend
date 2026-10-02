// components/executive-reports/DepartmentsPanel.tsx
// Separador "Departamentos & Unidades" (docs/Executive_Reports.md §2, §6.2,
// §6.3): comparação entre departamentos em barras horizontais ordenáveis com
// meta, e composição por vínculo em barras empilhadas. Clicar num
// departamento aplica-o como filtro global (detalhe).

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Building2 } from 'lucide-react';
import { RankedBars } from './charts/RankedBars';
import { StackedBars } from './charts/StackedBars';
import type {
  DepartmentChartsResponse,
  DepartmentRow,
  ExecutiveFilters,
} from './dashboardTypes';
import { filtersToParams } from './filtersToParams';
import { CONTRACT_LABEL } from './kpiFormat';

type MetricKey =
  | 'headcount'
  | 'trainingCompletion'
  | 'performance'
  | 'absenteeism'
  | 'turnover';

interface MetricDef {
  label: string;
  unit: '%' | '';
  direction?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  value: (r: DepartmentRow) => number | null;
}

const METRICS: Record<MetricKey, MetricDef> = {
  headcount: { label: 'Colaboradores', unit: '', value: (r) => r.headcount },
  trainingCompletion: {
    label: 'Formação — taxa de conclusão',
    unit: '%',
    direction: 'HIGHER_IS_BETTER',
    value: (r) => r.trainingCompletion,
  },
  performance: {
    label: 'Desempenho — metas alcançadas',
    unit: '%',
    direction: 'HIGHER_IS_BETTER',
    value: (r) => r.performance,
  },
  absenteeism: {
    label: 'Absentismo',
    unit: '%',
    direction: 'LOWER_IS_BETTER',
    value: (r) => r.absenteeism,
  },
  turnover: {
    label: 'Rotatividade',
    unit: '%',
    direction: 'LOWER_IS_BETTER',
    value: (r) => r.turnover,
  },
};

const METRIC_ITEMS = (Object.keys(METRICS) as MetricKey[]).map((k) => ({
  value: k,
  label: METRICS[k].label,
}));

export interface DepartmentsPanelProps {
  filters: ExecutiveFilters;
  onFiltersChange: (next: ExecutiveFilters) => void;
}

export function DepartmentsPanel({
  filters,
  onFiltersChange,
}: DepartmentsPanelProps) {
  const [metric, setMetric] = useState<MetricKey>('headcount');
  const params = filtersToParams(filters);
  const q = useApiQuery<DepartmentChartsResponse>(
    queryKeys.executiveReports.chartsDepartments(params),
    '/executive-reports/charts/departments',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={2}
        wrapperClassName="grid grid-cols-1 gap-5 lg:grid-cols-2 animate-pulse"
        itemClassName="h-72 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data;
  if (d.departments.length === 0)
    return (
      <EmptyState
        icon={Building2}
        title="Sem departamentos para comparar"
        description="Não há colaboradores activos associados a departamentos no âmbito seleccionado."
      />
    );

  const def = METRICS[metric];
  const target =
    metric === 'headcount' ? null : (d.targets[metric] ?? null);
  const fmt = (v: number) => `${v.toLocaleString('pt-PT')}${def.unit}`;

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-body font-semibold text-ink-muted">
            Comparação entre departamentos
          </h3>
          <Select
            className="min-w-[15rem]"
            items={METRIC_ITEMS}
            value={metric}
            onValueChange={(v) => setMetric(v as MetricKey)}
          />
        </div>
        <RankedBars
          rows={d.departments.map((r) => ({
            id: r.id,
            label: r.name,
            value: def.value(r),
          }))}
          format={fmt}
          target={target}
          direction={def.direction}
          onSelect={(row) =>
            onFiltersChange({ ...filters, departmentId: Number(row.id) })
          }
        />
        <p className="mt-3 font-body text-xs text-ink-faint">
          Os {d.departments.length} departamentos com mais colaboradores.
          {filters.departmentId
            ? ' Filtro de departamento activo — remova-o nos filtros globais para voltar à comparação completa.'
            : ' Clique num departamento para o seleccionar como filtro global.'}
        </p>
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="mb-4 font-body font-semibold text-ink-muted">
          Composição por tipo de vínculo
        </h3>
        {d.composition.categories.length === 0 ? (
          <p className="font-body text-sm text-ink-faint">Sem dados</p>
        ) : (
          <StackedBars
            categories={d.composition.categories}
            series={d.composition.series.map((s) => ({
              key: s.key,
              label: CONTRACT_LABEL[s.key] ?? s.key,
              values: s.values,
            }))}
          />
        )}
      </div>
    </div>
  );
}
