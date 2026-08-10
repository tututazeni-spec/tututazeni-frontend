// components/learning-paths/DashboardView.tsx
// Separador "Dashboard (Admin)" — métricas globais e top trilhas. Dados
// próprios + apresentação. Extraído de
// app/(platform)/learning-paths/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Skeleton, TypeBadge } from './atoms';
import { LP_STATUS_MAP } from './constants';
import type { AdminDashboard } from './types';

interface DashboardViewProps {
  onSelect: (id: number) => void;
}

export function DashboardView({ onSelect }: DashboardViewProps) {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.learningPaths.adminDashboard(),
    '/learning-paths/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total de trilhas', value: data.paths.total },
          {
            label: 'Publicadas',
            value: data.paths.published,
            color: 'text-emerald-600',
          },
          { label: 'Matrículas', value: data.enrollments.total },
          {
            label: 'Taxa conclusão',
            value: `${data.completionRate}%`,
            color: 'text-blue-600',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Top trilhas */}
      {data.topPaths.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Trilhas mais populares
          </div>
          {data.topPaths.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(p.id)}
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {p.title}
                </div>
                <div className="text-xs text-gray-400">
                  <TypeBadge type={p.pathType} />
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {p._count.enrollments} matrículas
              </div>
              <StatusBadge value={p.status} map={LP_STATUS_MAP} variant="dot" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
