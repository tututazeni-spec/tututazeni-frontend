// components/courses/AdminDashboardView.tsx
// Vista "Dashboard (Admin)": métricas globais + top cursos. Extraído
// de app/(platform)/courses/page.tsx. Migrado para a fundação de
// design: métricas passam a KpiCard, lista de top cursos a Card com
// cabeçalho de secção (mesmo padrão de
// components/ai-tutor/RecommendationsView.tsx).

'use client';

import { AlertTriangle, BookOpen, CheckCircle2, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
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
        <KpiCard
          icon={BookOpen}
          label="Total de cursos"
          value={data.courses.total}
          sub={`${data.courses.published} publicados`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={Users}
          label="Total matrículas"
          value={data.enrollments.total}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de conclusão"
          value={`${data.completionRate}%`}
          sub={`${data.enrollments.completed} concluídas`}
          intent="success"
          className="w-full"
        />
        <KpiCard
          icon={AlertTriangle}
          label="Atrasos"
          value={data.enrollments.overdue}
          sub="deadlines vencidos"
          intent={data.enrollments.overdue > 0 ? 'danger' : 'primary'}
          className="w-full"
        />
      </div>

      {/* Top cursos */}
      {data.topCourses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Cursos mais populares
          </div>
          {data.topCourses.map((c, idx) => (
            <div
              key={c.id}
              className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              <span className="text-lg font-bold font-mono text-ink-faint w-6 text-center">
                {idx + 1}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">
                  {c.title}
                </div>
                <div className="text-xs text-ink-faint">
                  {c.category ?? '—'} · {c.level}
                </div>
              </div>
              <div className="text-sm text-ink-muted">
                {c._count.enrollments} matrículas
              </div>
              <StatusBadge
                value={c.status}
                map={COURSE_STATUS_MAP}
                variant="dot"
              />
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
