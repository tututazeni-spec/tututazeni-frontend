// components/dashboard-rh/TrainingPanel.tsx
// Painel "Formação" — KPIs, top cursos e insights. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx.

'use client';

import { Activity, BookOpen, Clock, Shield } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KPICard, Skeleton } from './atoms';
import type { TrainingData } from './types';

export function TrainingPanel() {
  const { data, isLoading: loading } = useApiQuery<TrainingData>(
    queryKeys.dashboardRh.training(),
    '/dashboard-rh/training',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          icon={BookOpen}
          label="Conclusões (mês)"
          value={data?.completed ?? 0}
          color="text-teal-600"
          bg="bg-teal-50"
        />
        <KPICard
          icon={Activity}
          label="Taxa de Conclusão"
          value={`${data?.completionRate ?? 0}%`}
        />
        <KPICard
          icon={Shield}
          label="Formações Obrig."
          value={`${data?.mandatoryRate ?? 0}%`}
          status={data?.mandatoryStatus}
          color="text-red-600"
          bg="bg-red-50"
        />
        <KPICard
          icon={Clock}
          label="Horas Estimadas"
          value={`${data?.estimatedHours ?? 0}h`}
          color="text-violet-600"
          bg="bg-violet-50"
        />
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-3">Top 5 Cursos</h4>
          <div className="space-y-2">
            {(data?.topCourses ?? []).map((c, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-300 w-4">
                  #{i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {c.course?.title ?? `Curso ${c.courseId}`}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {c.course?.category}
                  </p>
                </div>
                <span className="text-xs font-bold text-indigo-600">
                  {c.count} inscrições
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.insights?.length ?? 0) > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          {data?.insights?.map((ins, i) => (
            <p key={i} className="text-xs text-violet-800">
              {ins}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
