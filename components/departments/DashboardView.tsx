// components/departments/DashboardView.tsx
// Separador "Dashboard" — métricas comparativas e distribuição de
// colaboradores por departamento. Dados próprios + apresentação.
// Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { MetricCard, Skeleton } from './atoms';
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

  if (loading) return <Skeleton rows={5} />;
  if (queryError)
    return <div className="text-sm text-red-500">{queryError.message}</div>;

  const maxMembers = Math.max(...rows.map((r) => r.totalMembers), 1);
  const totalMembers = rows.reduce((s, r) => s + r.totalMembers, 0);
  const activeCount = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total departamentos" value={rows.length} />
        <MetricCard
          label="Activos"
          value={activeCount}
          color="text-emerald-600"
        />
        <MetricCard label="Total colaboradores" value={totalMembers} />
      </div>

      {/* Distribution chart */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
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
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => onSelect(r.id)}
                >
                  <div className="w-32 text-xs text-gray-700 truncate group-hover:text-blue-700">
                    {r.name}
                  </div>
                  <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded transition-all duration-500 group-hover:bg-blue-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-xs font-mono text-gray-600">
                    {r.totalMembers} membros
                  </div>
                  <div className="w-24 text-xs text-gray-400 truncate">
                    {r.headName}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Depts without head warning */}
      {rows.filter((r) => r.active && r.headName === '—').length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-800">
          ⚠{' '}
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
