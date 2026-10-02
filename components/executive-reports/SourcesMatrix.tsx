// components/executive-reports/SourcesMatrix.tsx
// Matriz de integração por módulo (docs/Executive_Reports.md §4.1): que dados
// cada módulo fornece, se a ligação já existe e quantos registos há no âmbito
// do utilizador. Ligações por fazer aparecem como "Planeado" — nunca com dados
// inventados.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { QueryError } from '@/components/ui/QueryError';
import type {
  ExecutiveFilters,
  SourceStatus,
  SourcesResponse,
} from './dashboardTypes';
import { filtersToParams } from './filtersToParams';
import { formatDateTime } from './kpiFormat';

const STATUS_LABEL: Record<SourceStatus, string> = {
  INTEGRATED: 'Integrado',
  PLANNED: 'Planeado',
  CONTEXT: 'Contexto',
  REPLACED: 'Substituído',
};

const STATUS_BADGE: Record<SourceStatus, string> = {
  INTEGRATED: 'bg-success-subtle text-success-ink',
  PLANNED: 'bg-surface-sunken text-ink-muted',
  CONTEXT: 'bg-info-subtle text-info-ink',
  REPLACED: 'bg-warning-subtle text-warning-ink',
};

export function SourcesMatrix({ filters }: { filters: ExecutiveFilters }) {
  const params = filtersToParams(filters);
  const q = useApiQuery<SourcesResponse>(
    queryKeys.executiveReports.sources(params),
    '/executive-reports/sources',
    { params, staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (q.isLoading)
    return (
      <Skeleton
        rows={1}
        wrapperClassName="animate-pulse"
        itemClassName="h-40 rounded-card bg-surface-sunken"
      />
    );
  if (q.error || !q.data)
    return <QueryError error={q.error} onRetry={() => q.refetch()} />;

  const { summary, sources, checkedAt } = q.data;

  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-body font-semibold text-ink-muted">
          Integração com os módulos
        </h3>
        <span className="font-body text-xs text-ink-faint">
          verificado {formatDateTime(checkedAt)}
        </span>
      </div>
      <p className="mb-4 font-body text-xs text-ink-muted">
        {summary.integrated} de {summary.total} módulos integrados (
        {summary.withData} com registos) · {summary.planned} planeados. Os
        indicadores só usam módulos integrados.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border font-body text-xs text-ink-muted">
              <th className="py-2 pr-3 font-medium">Módulo</th>
              <th className="py-2 pr-3 font-medium">Estado</th>
              <th className="py-2 pr-3 font-medium">Registos</th>
              <th className="py-2 pr-3 font-medium">Dados consumidos</th>
              <th className="py-2 font-medium">Usado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sources.map((s) => (
              <tr key={s.module} className="align-top font-body text-xs">
                <td className="py-2 pr-3 font-medium text-ink">{s.module}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${STATUS_BADGE[s.status]}`}
                  >
                    {STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td className="py-2 pr-3 text-ink">
                  {s.recordCount === null
                    ? '—'
                    : s.recordCount.toLocaleString('pt-PT')}
                </td>
                <td className="py-2 pr-3 text-ink-muted">
                  {s.consumes}
                  {s.note && (
                    <span className="mt-0.5 block text-ink-faint">
                      {s.note}
                    </span>
                  )}
                </td>
                <td className="py-2 text-ink-muted">
                  {s.usedBy.length > 0 ? s.usedBy.join(', ') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
