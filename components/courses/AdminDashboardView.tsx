// components/courses/AdminDashboardView.tsx
// Vista "Dashboard (Admin)": métricas globais + top cursos. Extraído
// de app/(platform)/courses/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { COURSE_STATUS_MAP, Skeleton } from './shared';
import type { AdminDashboard } from './types';

interface AdminDashboardViewProps {
  onSelect: (id: number) => void;
}

export function AdminDashboardView({ onSelect }: AdminDashboardViewProps) {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.courses.adminDashboard(),
    '/courses/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-4 gap-3">
        {[
          {
            label: 'Total de cursos',
            value: data.courses.total,
            sub: `${data.courses.published} publicados`,
          },
          {
            label: 'Total matrículas',
            value: data.enrollments.total,
            sub: undefined,
          },
          {
            label: 'Taxa de conclusão',
            value: `${data.completionRate}%`,
            sub: `${data.enrollments.completed} concluídas`,
            color: 'text-emerald-600',
          },
          {
            label: 'Atrasos',
            value: data.enrollments.overdue,
            sub: 'deadlines vencidos',
            color: data.enrollments.overdue > 0 ? 'text-red-600' : undefined,
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{label}</div>
            <div
              className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
            >
              {value}
            </div>
            {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
          </div>
        ))}
      </div>

      {/* Top cursos */}
      {data.topCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos mais populares
          </div>
          {data.topCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelect(c.id)}
            >
              <span className="text-lg font-bold font-mono text-gray-200 w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900">
                  {c.title}
                </div>
                <div className="text-xs text-gray-400">
                  {c.category ?? '—'} · {c.level}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                {c._count.enrollments} matrículas
              </div>
              <StatusBadge
                value={c.status}
                map={COURSE_STATUS_MAP}
                variant="dot"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
