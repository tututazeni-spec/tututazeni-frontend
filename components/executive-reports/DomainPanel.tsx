// components/executive-reports/DomainPanel.tsx
// Separadores por domínio (docs/Executive_Reports.md §2, §10): Recursos
// Humanos, Formação, Desempenho, Assiduidade e Custos. Cada um consome
// GET /executive-reports/:domain — KPIs do domínio + secções em tabela, com os
// filtros globais e o âmbito/permissões aplicados no backend.

'use client';

import {
  BookOpen,
  Clock,
  Database,
  Star,
  Target,
  TrendingDown,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import { EmptyState } from '@/components/ui/EmptyState';
import { ExecutiveKpiCard } from './ExecutiveKpiCard';
import { SectionTables } from './SectionTable';
import type { DomainResponse, ExecutiveFilters } from './dashboardTypes';
import { filtersToParams } from './filtersToParams';

export type ExecutiveDomain =
  | 'workforce'
  | 'training'
  | 'performance'
  | 'attendance'
  | 'projects'
  | 'costs';

const KPI_ICONS: Record<string, LucideIcon> = {
  HEADCOUNT: Users,
  PERFORMANCE: Star,
  TRAINING_COMPLETION: BookOpen,
  ATTENDANCE: Clock,
  TURNOVER: TrendingDown,
  PDI_OVERDUE: Target,
};

export interface DomainPanelProps {
  domain: ExecutiveDomain;
  filters: ExecutiveFilters;
}

export function DomainPanel({ domain, filters }: DomainPanelProps) {
  const params = filtersToParams(filters);
  const q = useApiQuery<DomainResponse>(
    queryKeys.executiveReports.domain(domain, params),
    `/executive-reports/${domain}`,
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse"
        itemClassName="h-48 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const d = q.data;
  if (d.kpis.length === 0 && d.sections.length === 0)
    return (
      <EmptyState
        icon={Database}
        title={`${d.title} — sem dados`}
        description="Não há dados no âmbito e período seleccionados."
      />
    );

  return (
    <div className="space-y-5">
      {d.kpis.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.kpis.map((k) => (
            <ExecutiveKpiCard
              key={k.code}
              kpi={k}
              icon={KPI_ICONS[k.code] ?? Target}
              showComparison={d.context.compareWith !== 'target'}
            />
          ))}
        </div>
      )}
      <SectionTables sections={d.sections} omitted={d.omitted} />
    </div>
  );
}
