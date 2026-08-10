// components/enrollments/ComplianceView.tsx
// Separador "Compliance" — métricas globais, compliance de obrigatórios
// e tops de cursos. Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import type { AdminDashboard, ComplianceDashboard } from './types';

export function ComplianceView() {
  // Duas queries independentes → correm em paralelo.
  const { data } = useApiQuery<ComplianceDashboard>(
    queryKeys.enrollments.compliance(),
    '/enrollments/compliance',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: dashboard } = useApiQuery<AdminDashboard>(
    queryKeys.enrollments.adminDashboard(),
    '/enrollments/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (!data || !dashboard) return <Skeleton rows={3} />;

  const pctColor =
    data.complianceRate >= 80
      ? 'text-emerald-600'
      : data.complianceRate >= 50
        ? 'text-amber-600'
        : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Métricas globais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total matrículas', value: dashboard.enrollments.total },
          {
            label: 'Concluídas',
            value: dashboard.enrollments.completed,
            color: 'text-emerald-600',
          },
          {
            label: 'Taxa conclusão',
            value: `${dashboard.completionRate}%`,
            color: 'text-blue-600',
          },
          {
            label: 'Atrasadas',
            value: dashboard.enrollments.overdue,
            color:
              dashboard.enrollments.overdue > 0 ? 'text-red-600' : undefined,
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

      {/* Compliance de obrigatórios */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">
              Compliance — Cursos obrigatórios
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {data.mandatory.completed}/{data.mandatory.total} concluídos
            </div>
          </div>
          <div className={`text-3xl font-bold font-mono ${pctColor}`}>
            {data.complianceRate}%
          </div>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className={`h-3 rounded-full transition-all duration-700 ${
              data.complianceRate >= 80
                ? 'bg-emerald-500'
                : data.complianceRate >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${data.complianceRate}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            {
              label: 'Concluídos',
              value: data.mandatory.completed,
              cls: 'text-emerald-600',
            },
            {
              label: 'Não iniciados',
              value: data.mandatory.notStarted,
              cls: 'text-gray-500',
            },
            {
              label: 'Atrasados',
              value: data.mandatory.overdue,
              cls: 'text-red-600',
            },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-gray-50 rounded-lg p-3">
              <div className={`text-xl font-bold font-mono ${cls}`}>
                {value}
              </div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top cursos com mais atrasos */}
      {data.topOverdueCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos com mais atrasos
          </div>
          {data.topOverdueCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-bold font-mono text-gray-200 w-5">
                {idx + 1}
              </span>
              <div className="flex-1 text-sm text-gray-800">{c.title}</div>
              <span className="text-sm font-mono text-red-600">
                {c.overdueCount} atrasados
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top cursos por matrículas */}
      {dashboard.topCourses.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            Cursos mais populares
          </div>
          {dashboard.topCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0"
            >
              <span className="text-sm font-bold font-mono text-gray-200 w-5">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm text-gray-800">{c.title}</div>
                {c.category && (
                  <div className="text-xs text-gray-400">{c.category}</div>
                )}
              </div>
              <span className="text-sm font-mono text-gray-500">
                {c.enrollments} matrículas
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
