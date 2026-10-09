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
import {
  CourseBarList,
  CourseProgressList,
  DistributionList,
} from './relatoriosBarLists';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { fmtDuration, Skeleton } from './shared';
import type { CourseReports } from './types';

interface RelatoriosViewProps {
  onSelect: (id: number) => void;
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <NavyStatCard
          icon={Users}
          label="Formandos por curso"
          value={data.topCourses.length}
          sub="cursos com inscrições"
          tone="blue"
        />
        <NavyStatCard
          icon={CheckCircle2}
          label="Taxa de aprovação"
          value={`${data.approvalRate}%`}
          tone="green"
        />
        <NavyStatCard
          icon={TrendingDown}
          label="Taxa de abandono"
          value={`${data.abandonmentRate}%`}
          tone={data.abandonmentRate > 20 ? 'red' : 'orange'}
        />
        <NavyStatCard
          icon={TrendingUp}
          label="Progresso médio"
          value={`${data.avgProgress}%`}
          tone="blue"
        />
        <NavyStatCard
          icon={Clock}
          label="Horas de formação"
          value={fmtDuration(data.totalLearningHours)}
          tone="blue"
        />
        <NavyStatCard
          icon={Award}
          label="Resultados das avaliações"
          value={`${data.evaluationResults.avgScore}%`}
          sub={`${data.evaluationResults.passRate}% aprovação · ${data.evaluationResults.totalAttempts} tentativas`}
          tone="green"
        />
        <NavyStatCard
          icon={BookOpen}
          label="Formação obrigatória pendente"
          value={data.mandatoryPending.count}
          sub={`${data.mandatoryPending.courses.length} curso(s)`}
          tone={data.mandatoryPending.count > 0 ? 'orange' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CourseBarList
          title="Cursos mais frequentados"
          items={data.topCourses.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.enrollments,
          }))}
          suffix=" formandos"
          onSelect={onSelect}
        />
        <CourseProgressList
          title="Maior taxa de conclusão"
          items={data.bestCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          tone="green"
          onSelect={onSelect}
        />
        <CourseProgressList
          title="Menor taxa de conclusão"
          items={data.worstCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          tone="red"
          onSelect={onSelect}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DistributionList
          title="Formação por departamento"
          items={data.byDepartment.map((d) => ({
            label: d.department,
            count: d.count,
          }))}
        />
        <DistributionList
          title="Formação por unidade"
          items={data.byUnit.map((u) => ({ label: u.unit, count: u.count }))}
        />
        {data.mandatoryPending.courses.length > 0 && (
          <CourseBarList
            title="Formação obrigatória pendente — por curso"
            items={data.mandatoryPending.courses.map((c) => ({
              id: c.id,
              title: c.title,
              value: c.pending,
            }))}
            suffix=" por concluir"
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
