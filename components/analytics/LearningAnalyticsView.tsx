// components/analytics/LearningAnalyticsView.tsx
// Separador "Aprendizagem" — GET /analytics/learning. Endpoint já existia no
// backend (analytics.service.ts#getLearningAnalytics) mas não tinha
// nenhum consumidor no frontend — ver memory sobre o levantamento de
// dados de analytics por wire-up.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { Award, ClipboardCheck, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { STATUS_CFG as ENROLLMENT_STATUS_CFG } from '@/components/enrollments/constants';
import type { EnrollmentStatus } from '@/components/enrollments/types';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import type { LearningAnalytics } from './types';

export function LearningAnalyticsView() {
  const { data, isLoading } = useApiQuery<LearningAnalytics>(
    queryKeys.analyticsPage.learning(),
    '/analytics/learning',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={ClipboardCheck}
          label="Nota média de avaliação"
          value={data.avgAssessmentScore}
          tone="blue"
        />
        <NavyStatCard
          icon={Award}
          label="Certificados emitidos"
          value={data.certificationCount}
          tone="green"
        />
        <NavyStatCard
          icon={Clock}
          label="Horas de formação consumidas"
          value={data.totalHoursConsumed}
          tone="orange"
        />
      </div>

      {/* Estado das matrículas */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="h-1.5 w-full bg-[#0F1F3D]" />
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
            Matrículas por estado
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-full bg-[#0F1F3D] px-3 py-1.5 opacity-70"
              >
                <span className="text-xs font-medium text-white">
                  {ENROLLMENT_STATUS_CFG[status as EnrollmentStatus]?.label ??
                    status}
                </span>
                <span className="font-data text-sm font-bold text-white">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tendência mensal */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Matrículas por mês (últimos 12 meses)
          </div>
          <MonthlyTrendChart data={data.monthlyEnrollments} />
        </CardBody>
      </Card>

      {/* Top cursos */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
            Top cursos por conclusões
          </div>
          <Table>
            <TableHead className="bg-[#0F1F3D]">
              <TableRow className="hover:bg-transparent">
                <TableHeaderCell className="text-white">Curso</TableHeaderCell>
                <TableHeaderCell className="text-white">Categoria</TableHeaderCell>
                <TableHeaderCell className="text-white">Matrículas</TableHeaderCell>
                <TableHeaderCell className="text-white">Concluídas</TableHeaderCell>
                <TableHeaderCell className="text-white">Nota média</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.topCourses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium text-ink">
                    {c.course.title}
                  </TableCell>
                  <TableCell>{c.course.category ?? '—'}</TableCell>
                  <TableCell>{c.totalEnrollments}</TableCell>
                  <TableCell>{c.totalCompleted}</TableCell>
                  <TableCell>
                    {c.avgRating > 0 ? `${c.avgRating.toFixed(1)} ★` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {data.topCourses.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-ink-faint py-6"
                  >
                    Sem dados de cursos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
