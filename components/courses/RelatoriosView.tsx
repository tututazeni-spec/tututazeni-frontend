// components/courses/RelatoriosView.tsx
// Aba "Relatórios" (docs/modulo_courses.md secção 7, ADMIN/RH). Consome
// GET /courses/reports, que reaproveita as agregações já calculadas em
// getAdminDashboard (cursos mais frequentados, conclusão, horas de
// formação, departamento/unidade) e acrescenta resultados de avaliações,
// taxa de abandono, progresso médio e formação obrigatória pendente — as
// métricas que a Visão Geral (AdminDashboardView) não cobre.

'use client';

import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { fmtDuration, Skeleton } from './shared';
import type { CourseReports } from './types';

interface RelatoriosViewProps {
  onSelect: (id: number) => void;
}

function DistributionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card className="p-4">
      <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 8).map((item, i) => (
            <div key={i}>
              <div className="mb-0.5 flex items-center justify-between text-xs">
                <span className="truncate pr-2 text-ink-muted">{item.label}</span>
                <span className="flex-shrink-0 font-data text-ink-faint">{item.count}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-sunken">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function CourseRankList({
  title,
  items,
  suffix,
  onSelect,
}: {
  title: string;
  items: Array<{ id: number; title: string; value: number }>;
  suffix: string;
  onSelect: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem dados</p>
      ) : (
        items.map((c, idx) => (
          <div
            key={c.id}
            className="flex cursor-pointer items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-sunken"
            onClick={() => onSelect(c.id)}
          >
            <span className="w-5 text-center font-mono text-sm font-bold text-ink-faint">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink">{c.title}</div>
            </div>
            <div className="flex-shrink-0 text-xs text-ink-muted">
              {c.value}
              {suffix}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

export function RelatoriosView({ onSelect }: RelatoriosViewProps) {
  const { data, isLoading } = useApiQuery<CourseReports>(
    queryKeys.courses.reports(),
    '/courses/reports',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <KpiCard
          icon={Users}
          label="Formandos por curso"
          value={data.topCourses.length}
          sub="cursos com inscrições"
          intent="primary"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Taxa de aprovação"
          value={`${data.approvalRate}%`}
          intent="success"
        />
        <KpiCard
          icon={TrendingDown}
          label="Taxa de abandono"
          value={`${data.abandonmentRate}%`}
          intent={data.abandonmentRate > 20 ? 'danger' : 'warning'}
        />
        <KpiCard
          icon={TrendingUp}
          label="Progresso médio"
          value={`${data.avgProgress}%`}
          intent="info"
        />
        <KpiCard
          icon={Clock}
          label="Horas de formação"
          value={fmtDuration(data.totalLearningHours)}
          intent="primary"
        />
        <KpiCard
          icon={Award}
          label="Resultados das avaliações"
          value={`${data.evaluationResults.avgScore}%`}
          sub={`${data.evaluationResults.passRate}% aprovação · ${data.evaluationResults.totalAttempts} tentativas`}
          intent="success"
        />
        <KpiCard
          icon={BookOpen}
          label="Formação obrigatória pendente"
          value={data.mandatoryPending.count}
          sub={`${data.mandatoryPending.courses.length} curso(s)`}
          intent={data.mandatoryPending.count > 0 ? 'warning' : 'primary'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CourseRankList
          title="Cursos mais frequentados"
          items={data.topCourses.map((c) => ({ id: c.id, title: c.title, value: c.enrollments }))}
          suffix=" formandos"
          onSelect={onSelect}
        />
        <CourseRankList
          title="Maior taxa de conclusão"
          items={data.bestCompletion.map((c) => ({ id: c.id, title: c.title, value: c.rate }))}
          suffix="%"
          onSelect={onSelect}
        />
        <CourseRankList
          title="Menor taxa de conclusão"
          items={data.worstCompletion.map((c) => ({ id: c.id, title: c.title, value: c.rate }))}
          suffix="%"
          onSelect={onSelect}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DistributionList
          title="Formação por departamento"
          items={data.byDepartment.map((d) => ({ label: d.department, count: d.count }))}
        />
        <DistributionList
          title="Formação por unidade"
          items={data.byUnit.map((u) => ({ label: u.unit, count: u.count }))}
        />
      </div>

      {data.mandatoryPending.courses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
            Formação obrigatória pendente — por curso
          </div>
          {data.mandatoryPending.courses.map((c) => (
            <div
              key={c.id}
              className="flex cursor-pointer items-center justify-between border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              <span className="truncate text-xs font-medium text-ink">{c.title}</span>
              <span className="flex-shrink-0 text-xs text-warning-ink">
                {c.pending} formando(s) por concluir
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
