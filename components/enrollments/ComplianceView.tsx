// components/enrollments/ComplianceView.tsx
// Separador "Compliance" — métricas globais, compliance de obrigatórios
// e tops de cursos. Dados próprios + apresentação. Extraído de
// app/(platform)/enrollments/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
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

  if (!data || !dashboard)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-2 animate-pulse"
        itemClassName="h-16 rounded-card bg-surface-sunken"
      />
    );

  const pctTextCls =
    data.complianceRate >= 80
      ? 'text-success-ink'
      : data.complianceRate >= 50
        ? 'text-warning-ink'
        : 'text-danger-ink';

  return (
    <div className="space-y-6">
      {/* Métricas globais */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total matrículas', value: dashboard.enrollments.total },
          {
            label: 'Concluídas',
            value: dashboard.enrollments.completed,
            cls: 'text-success-ink',
          },
          {
            label: 'Taxa conclusão',
            value: `${dashboard.completionRate}%`,
            cls: 'text-info-ink',
          },
          {
            label: 'Atrasadas',
            value: dashboard.enrollments.overdue,
            cls: dashboard.enrollments.overdue > 0 ? 'text-danger-ink' : undefined,
          },
        ].map(({ label, value, cls }) => (
          <div key={label} className="rounded-card bg-surface-sunken p-4">
            <div className="mb-1 text-xs text-ink-faint">{label}</div>
            <div className={`font-mono text-2xl font-semibold ${cls ?? 'text-ink'}`}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Compliance de obrigatórios */}
      <div className="rounded-card border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-ink">
              Compliance — Cursos obrigatórios
            </div>
            <div className="mt-0.5 text-xs text-ink-faint">
              {data.mandatory.completed}/{data.mandatory.total} concluídos
            </div>
          </div>
          <div className={`font-mono text-3xl font-bold ${pctTextCls}`}>
            {data.complianceRate}%
          </div>
        </div>
        <div className="mb-4">
          <ProgressBar value={data.complianceRate} className="h-3" />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            {
              label: 'Concluídos',
              value: data.mandatory.completed,
              cls: 'text-success-ink',
            },
            {
              label: 'Não iniciados',
              value: data.mandatory.notStarted,
              cls: 'text-ink-muted',
            },
            {
              label: 'Atrasados',
              value: data.mandatory.overdue,
              cls: 'text-danger-ink',
            },
          ].map(({ label, value, cls }) => (
            <div key={label} className="rounded-control bg-surface-sunken p-3">
              <div className={`font-mono text-xl font-bold ${cls}`}>{value}</div>
              <div className="text-xs text-ink-faint">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top cursos com mais atrasos */}
      {data.topOverdueCourses.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Cursos com mais atrasos
          </div>
          {data.topOverdueCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-5 font-mono text-sm font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1 text-sm text-ink">{c.title}</div>
              <span className="font-mono text-sm text-danger-ink">
                {c.overdueCount} atrasados
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Top cursos por matrículas */}
      {dashboard.topCourses.length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Cursos mais populares
          </div>
          {dashboard.topCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
            >
              <span className="w-5 font-mono text-sm font-bold text-ink-faint">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm text-ink">{c.title}</div>
                {c.category && (
                  <div className="text-xs text-ink-faint">{c.category}</div>
                )}
              </div>
              <span className="font-mono text-sm text-ink-muted">
                {c.enrollments} matrículas
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
