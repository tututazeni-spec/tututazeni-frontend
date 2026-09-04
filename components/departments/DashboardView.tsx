// components/departments/DashboardView.tsx
// Separador "Dashboard" — métricas comparativas e distribuição de
// colaboradores por departamento. Dados próprios + apresentação.
// Extraído de app/(platform)/departments/page.tsx.

'use client';

import { AlertTriangle } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ComparativeRow } from './types';

interface DashboardViewProps {
  onSelect: (id: number) => void;
}

export function DashboardView({ onSelect }: DashboardViewProps) {
  const {
    data: rows = [],
    isLoading: loading,
    error: queryError,
  } = useApiQuery<ComparativeRow[]>(
    queryKeys.departments.comparative(),
    '/departments/dashboard/comparative',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={5}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-14 rounded-card bg-surface-sunken"
      />
    );
  if (queryError)
    return <div className="text-sm text-danger">{queryError.message}</div>;

  const maxMembers = Math.max(...rows.map((r) => r.totalMembers), 1);
  const totalMembers = rows.reduce((s, r) => s + r.totalMembers, 0);
  const activeCount = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total departamentos" value={rows.length} />
        <KpiCard label="Activos" value={activeCount} intent="success" />
        <KpiCard label="Total colaboradores" value={totalMembers} />
      </div>

      {/* Distribution chart */}
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-faint">
          Distribuição de colaboradores
        </div>
        <div className="space-y-3">
          {rows
            .filter((r) => r.active)
            .sort((a, b) => b.totalMembers - a.totalMembers)
            .map((r) => {
              const pct = Math.round((r.totalMembers / maxMembers) * 100);
              return (
                <div
                  key={r.id}
                  className="group flex cursor-pointer items-center gap-3"
                  onClick={() => onSelect(r.id)}
                >
                  <div className="w-32 truncate text-xs text-ink group-hover:text-primary">
                    {r.name}
                  </div>
                  <ProgressBar
                    value={pct}
                    className="h-6 flex-1 rounded-control"
                  />
                  <div className="w-20 text-right font-mono text-xs text-ink-muted">
                    {r.totalMembers} membros
                  </div>
                  <div className="w-24 truncate text-xs text-ink-faint">
                    {r.headName}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Depts without head warning */}
      {rows.filter((r) => r.active && r.headName === '—').length > 0 && (
        <div className="rounded-card border border-black bg-white px-4 py-3 text-sm text-black">
          <AlertTriangle
            size={12}
            strokeWidth={1.75}
            className="inline align-[-2px]"
          />{' '}
          <strong>
            {rows.filter((r) => r.active && r.headName === '—').length}
          </strong>{' '}
          departamento(s) activo(s) sem gestor definido:{' '}
          {rows
            .filter((r) => r.active && r.headName === '—')
            .map((r) => r.name)
            .join(', ')}
        </div>
      )}
    </div>
  );
}
