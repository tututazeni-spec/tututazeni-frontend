// components/dashboard-rh/TrainingPanel.tsx
// Painel "Formação" — KPIs, top cursos e insights. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { CheckCircle2, Clock, GraduationCap, ShieldAlert } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { BarChart } from '@/components/ui/charts/BarChart';
import { TopBarCard } from '@/components/ui/TopBarCard';
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
        itemClassName="h-28 rounded-2xl bg-surface-sunken"
      />
    );

  return (
    <div className="space-y-5">
      {/* KPIs — cartão estilo Udemy/MasterClass */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <TopBarCard
          label="Conclusões (mês)"
          value={data?.completed ?? 0}
          tone="blue"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-resting">
          <GaugeChart
            value={data?.completionRate ?? 0}
            label="Taxa de Conclusão"
            thresholds={{ warning: 50, danger: 25 }}
            size={120}
          />
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-resting">
          <GaugeChart
            value={data?.mandatoryRate ?? 0}
            label="Formações Obrigatórias"
            thresholds={{ warning: 50, danger: 25 }}
            size={120}
          />
        </div>
        <TopBarCard
          label="Horas Estimadas"
          value={`${data?.estimatedHours ?? 0}h`}
          tone="gold"
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Top courses */}
      {(data?.topCourses ?? []).length > 0 && (
        <div className="rounded-card border border-border bg-surface p-5">
          <h4 className="mb-3 font-body font-semibold text-ink-muted">
            Top 5 Cursos
          </h4>
          <BarChart
            orientation="horizontal"
            categories={(data?.topCourses ?? []).map(
              (c, i) => c.course?.title ?? `Curso ${c.courseId ?? i}`,
            )}
            series={[
              {
                label: 'Inscrições',
                values: (data?.topCourses ?? []).map((c) => c.count),
                color: '#0F1F3D',
              },
            ]}
            className="mb-4"
          />
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
                <span className="font-body text-xs font-bold text-black">
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
            <p key={i} className="font-body text-xs text-black">
              {ins.replace(/^⚠️\s*/, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
