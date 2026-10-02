// components/avatar-training/ReportsTab.tsx
// Relatórios (docs/Avatar_Training.md §11). O catálogo vem do backend já
// filtrado pelas permissões do utilizador; cada relatório mostra fórmula,
// fonte e período, e «Sem dados» quando está vazio (nunca valores fictícios).

'use client';

import { useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Report, ReportCatalogItem } from './types';

function cell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function ReportView({ type }: { type: string }) {
  const { data, isLoading, error, refetch } = useApiQuery<Report>(
    queryKeys.avatarTraining.reports(type),
    '/avatar-training/reports',
    { params: { type }, staleTime: STALE_TIME.DYNAMIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-12 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  const columns = data.rows.length > 0 ? Object.keys(data.rows[0]) : [];
  return (
    <div className="space-y-3">
      {data.noData ? (
        <p className="rounded-card border border-dashed border-border-strong bg-surface p-6 text-center font-body text-sm text-ink-faint">
          Sem dados
        </p>
      ) : (
        <div className="overflow-x-auto rounded-card border border-border bg-surface">
          <table className="w-full text-left font-body text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-faint">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {columns.map((c) => (
                    <td key={c} className="px-3 py-2 text-ink-muted">
                      {cell(r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="font-body text-xs text-ink-faint">
        Fonte: {data.source} · {data.formula} · Período{' '}
        {formatDateTime(data.period.from)} – {formatDateTime(data.period.to)} ·
        Gerado em {formatDateTime(data.generatedAt)}
        {data.truncated && ' · Resultados truncados'}
      </p>
    </div>
  );
}

export function ReportsTab() {
  const [type, setType] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useApiQuery<ReportCatalogItem[]>(
    queryKeys.avatarTraining.reportCatalog(),
    '/avatar-training/reports',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={2}
        itemClassName="h-10 rounded-card bg-surface-sunken animate-pulse"
      />
    );
  if (data.length === 0)
    return (
      <EmptyState
        icon={BarChart2}
        title="Sem relatórios disponíveis"
        description="O seu perfil não tem acesso a relatórios do Avatar Training."
      />
    );

  const active = type ?? data[0].type;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {data.map((r) => (
          <button
            key={r.type}
            onClick={() => setType(r.type)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              active === r.type
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>
      <ReportView key={active} type={active} />
    </div>
  );
}
