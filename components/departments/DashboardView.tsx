// components/departments/DashboardView.tsx
// Separador "Dashboard" — métricas comparativas e distribuição de
// colaboradores por departamento. Dados próprios + apresentação.
// Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ShareGaugeCard, } from '@/components/ui/charts/SpeedometerStatCard';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import type { ComparativeRow } from './types';

/** Uma cor por departamento (atribuída por posição; repete só após esgotar a paleta). */
const DEPT_COLORS = [
  '#2563EB',
  '#16A34A',
  '#F59E0B',
  '#DC2626',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#65A30D',
  '#EA580C',
  '#4F46E5',
  '#0D9488',
  '#B45309',
];

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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <ShareGaugeCard label="Total departamentos" value={rows.length} total={rows.length} />
        <DonutStatCard
          label="Activos"
          value={rows.length > 0 ? (activeCount / rows.length) * 100 : 0}
          sub={`${activeCount} de ${rows.length}`}
        />
        <ShareGaugeCard label="Total colaboradores" value={totalMembers} total={totalMembers} />
      </div>

      {/* Distribution chart */}
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        <div className="flex items-center gap-3 border-b border-border bg-[#0F1F3D]/60 px-5 py-3 text-xs font-medium uppercase tracking-wide text-white">
          <div className="flex-1">Distribuição de colaboradores</div>
          <div className="w-20 text-right">Membros</div>
          <div className="w-24">Responsável</div>
        </div>
        <div className="space-y-3 p-5">
          {rows
            .filter((r) => r.active)
            .sort((a, b) => b.totalMembers - a.totalMembers)
            .map((r, i) => {
              const pct = Math.round((r.totalMembers / maxMembers) * 100);
              return (
                <div
                  key={r.id}
                  className="group flex cursor-pointer items-center gap-3"
                  onClick={() => onSelect(r.id)}
                >
                  <div className="w-48 shrink-0 break-words text-xs text-ink group-hover:text-primary">
                    {r.name}
                  </div>
                  <ProgressBar
                    value={pct}
                    color={DEPT_COLORS[i % DEPT_COLORS.length]}
                    className="h-3 flex-1 rounded-control"
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
    </div>
  );
}
