// components/executive-reports/RisksPanel.tsx
// Separador "Riscos & Alertas" (docs/Executive_Reports.md §2, §6.5): mapa de
// calor por departamento, dispersão absentismo × rotatividade e listas de
// excepções. Os critérios de risco são mostrados ao utilizador.

'use client';

import { ShieldCheck } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { ScatterChart } from '@/components/ui/charts/ScatterChart';
import { ExceptionList } from './charts/ExceptionList';
import { RiskHeatmap } from './charts/RiskHeatmap';
import type { ExecutiveFilters, RiskChartsResponse } from './dashboardTypes';
import { filtersToParams } from './filtersToParams';

export interface RisksPanelProps {
  filters: ExecutiveFilters;
  onFiltersChange: (next: ExecutiveFilters) => void;
}

export function RisksPanel({ filters, onFiltersChange }: RisksPanelProps) {
  const params = filtersToParams(filters);
  const q = useApiQuery<RiskChartsResponse>(
    queryKeys.executiveReports.chartsRisks(params),
    '/executive-reports/charts/risks',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-4 animate-pulse"
        itemClassName="h-64 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data;
  if (d.heatmap.length === 0)
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Sem departamentos para analisar"
        description="Não há colaboradores activos associados a departamentos no âmbito seleccionado."
      />
    );

  const scatter = d.heatmap
    .filter(
      (r) => r.cells.absenteeism.value !== null && r.cells.turnover.value !== null,
    )
    .map((r) => ({
      x: r.cells.absenteeism.value as number,
      y: r.cells.turnover.value as number,
      label: r.name,
    }));

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="mb-4 font-body font-semibold text-ink-muted">
          Mapa de calor — risco por departamento
        </h3>
        <RiskHeatmap
          data={d}
          onSelectDepartment={(id) =>
            onFiltersChange({ ...filters, departmentId: id })
          }
        />
      </div>

      <div className="rounded-card border border-border bg-surface p-5">
        <h3 className="mb-1 font-body font-semibold text-ink-muted">
          Dispersão — absentismo × rotatividade
        </h3>
        <p className="mb-3 font-body text-xs text-ink-faint">
          Cada ponto é um departamento (eixo X: absentismo %, eixo Y:
          rotatividade %). Departamentos sem dados num dos eixos não aparecem.
        </p>
        <ScatterChart
          points={scatter}
          xLabel="Absentismo (%)"
          yLabel="Rotatividade (%)"
          height={220}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <ExceptionList
          title="Acções de PDI em atraso"
          items={d.exceptions.overduePdiActions}
          emptyText="Sem acções de PDI em atraso."
        />
        <ExceptionList
          title="Formações obrigatórias em atraso"
          items={d.exceptions.overdueMandatoryTraining}
          emptyText="Sem formações obrigatórias em atraso."
        />
        <ExceptionList
          title="Licenças pendentes há mais de 7 dias"
          items={d.exceptions.staleLeaveApprovals}
          emptyText="Sem aprovações de licença em atraso."
          suffix="pendente"
        />
      </div>
    </div>
  );
}
