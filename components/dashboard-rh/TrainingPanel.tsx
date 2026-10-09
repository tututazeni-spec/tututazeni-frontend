// components/dashboard-rh/TrainingPanel.tsx
// Painel "Formação" — KPIs, top cursos e insights. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { rateTone } from './rateTone';
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
        itemClassName="h-[155px] rounded-2xl bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          label="Conclusões (mês)"
          value={data?.completed ?? 0}
          tone="blue"
          icon={CheckCircle2}
        />
        <NavyStatCard
          icon={CheckCircle2}
          tone={rateTone(data?.completionRate ?? 0, { warning: 50, danger: 25 })}
          label="Taxa de Conclusão"
          value={`${Math.round(data?.completionRate ?? 0)}%`}
        />
        <NavyStatCard
          icon={ShieldCheck}
          tone={rateTone(data?.mandatoryRate ?? 0, { warning: 50, danger: 25 })}
          label="Formações Obrigatórias"
          value={`${Math.round(data?.mandatoryRate ?? 0)}%`}
        />
        <NavyStatCard
          label="Horas Estimadas"
          value={`${data?.estimatedHours ?? 0}h`}
          tone="orange"
          icon={Clock}
        />
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface p-5">
          <h4 className="-mx-5 -mt-5 mb-3 bg-[#0F1F3D]/60 px-5 py-3 font-body font-semibold text-white">
            Top 5 Cursos
          </h4>
          <ol className="space-y-3">
            {(data?.topCourses ?? []).map((c, i, all) => {
              const title = c.course?.title ?? `Curso ${c.courseId ?? i}`;
              const max = Math.max(1, ...all.map((x) => x.count));
              return (
                <li key={c.courseId ?? i} className="flex items-start gap-3">
                  <span className="w-5 shrink-0 pt-0.5 font-body text-xs font-bold text-ink-faint">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="break-words font-body text-xs font-medium text-ink"
                      title={title}
                    >
                      {title}
                    </p>
                    {c.course?.category && (
                      <p className="break-words font-body text-[10px] text-ink-faint">
                        {c.course.category}
                      </p>
                    )}
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-[#0F1F3D]"
                        style={{ width: `${(c.count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 whitespace-nowrap pt-0.5 font-body text-xs font-bold text-black">
                    {c.count} inscrições
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
