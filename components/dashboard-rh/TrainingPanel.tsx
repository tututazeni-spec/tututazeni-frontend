// components/dashboard-rh/TrainingPanel.tsx
// Painel "Formação" — KPIs, top cursos e insights. Dados próprios
// (useApiQuery) + apresentação. Extraído de
// app/(platform)/dashboard-rh/page.tsx. Migrado para a fundação de design
// — mesmo padrão de components/dashboard/OrgDashboard.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
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
          label="Conclusões (mês)"
          value={data?.completed ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          label="Taxa de Conclusão"
          value={`${data?.completionRate ?? 0}%`}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Formações Obrigatórias"
          value={`${data?.mandatoryRate ?? 0}%`}
          sub={data?.mandatoryStatus}
          intent="danger"
          className="w-full"
        />
        <KpiCard
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
          <BarChart
            orientation="horizontal"
            categories={(data?.topCourses ?? []).map(
              (c, i) => c.course?.title ?? `Curso ${c.courseId ?? i}`,
            )}
            series={[
              {
                label: 'Inscrições',
                values: (data?.topCourses ?? []).map((c) => c.count),
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
            <p key={i} className="font-body text-xs text-black">
              {ins.replace(/^⚠️\s*/, '')}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
<<<<<<< Updated upstream
=======

// Cartão estilo Udemy/MasterClass: badge de ícone colorido, número grande
// em destaque, etiqueta discreta por baixo, elevação subtil ao hover.
// Local a este painel — não substitui o KpiCard partilhado.
type StatIntent =
  'primary' | 'info' | 'success' | 'warning' | 'danger' | 'accent';

const STAT_INTENT_STYLES: Record<StatIntent, { badge: string }> = {
  primary: { badge: 'bg-primary/10 text-primary' },
  info: { badge: 'bg-info/10 text-info' },
  success: { badge: 'bg-success/10 text-success' },
  warning: { badge: 'bg-warning/10 text-warning' },
  danger: { badge: 'bg-danger/10 text-danger' },
  accent: { badge: 'bg-accent/10 text-accent' },
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  intent = 'primary',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  intent?: StatIntent;
}) {
  const styles = STAT_INTENT_STYLES[intent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${styles.badge}`}
      >
        <Icon size={20} strokeWidth={1.75} />
      </div>
      <p className="font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-1 font-body text-sm font-medium text-ink-muted">
        {label}
      </p>
      {sub && <p className="mt-0.5 font-body text-xs text-ink-faint">{sub}</p>}
    </div>
  );
}
>>>>>>> Stashed changes
