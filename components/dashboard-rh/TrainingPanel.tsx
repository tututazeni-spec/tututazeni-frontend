// components/dashboard-rh/TrainingPanel.tsx
// Painel "Formação" — KPIs, top cursos e insights. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { Activity, BookOpen, Clock, Shield } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingData } from './types';

export function TrainingPanel() {
  const { data, isLoading: loading } = useApiQuery<TrainingData>(
    queryKeys.dashboardRh.training(),
    '/dashboard-rh/training',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={BookOpen}
          label="Conclusões (mês)"
          value={data?.completed ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          icon={Activity}
          label="Taxa de Conclusão"
          value={`${data?.completionRate ?? 0}%`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          icon={Shield}
          label="Formações Obrigatórias"
          value={`${data?.mandatoryRate ?? 0}%`}
          sub={data?.mandatoryStatus}
          intent="danger"
          className="w-full"
        />
        <KpiCard
          icon={Clock}
          label="Horas Estimadas"
          value={`${data?.estimatedHours ?? 0}h`}
          intent="accent"
          className="w-full"
        />
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Top 5 Cursos
          </h4>
          <div className="space-y-2">
            {(data?.topCourses ?? []).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-4 font-body text-xs font-bold text-ink-faint">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-xs font-medium text-ink">
                    {c.course?.title ?? `Curso ${c.courseId}`}
                  </p>
                  <p className="font-body text-[10px] text-ink-faint">
                    {c.course?.category}
                  </p>
                </div>
                <span className="font-body text-xs font-bold text-primary">
                  {c.count} inscrições
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.insights?.length ?? 0) > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="font-body text-xs text-accent">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
