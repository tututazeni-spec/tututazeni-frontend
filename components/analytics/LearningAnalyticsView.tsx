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
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
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

function Tile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-card bg-surface-sunken p-3">
      <div className="mb-1 font-body text-xs text-ink-faint">{label}</div>
      <div className="font-data text-xl font-bold text-black">{value}</div>
    </div>
  );
}

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
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Nota média de avaliação"
          value={data.avgAssessmentScore}
          intent="info"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Certificados emitidos"
          value={data.certificationCount}
          intent="success"
          className="w-full [&_p]:text-black"
        />
        <KpiCard
          label="Horas de formação consumidas"
          value={data.totalHoursConsumed}
          intent="accent"
          className="w-full [&_p]:text-black"
        />
      </div>

      {/* Estado das matrículas */}
      <Card>
        <CardBody>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Matrículas por estado
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-card bg-surface-sunken px-3 py-2"
              >
                <StatusBadge
                  value={status as EnrollmentStatus}
                  map={ENROLLMENT_STATUS_CFG}
                  variant="dot"
                />
                <span className="font-data text-sm font-bold text-black">{count}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

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
      <div>
        <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Top cursos por conclusões
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Curso</TableHeaderCell>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell>Matrículas</TableHeaderCell>
              <TableHeaderCell>Concluídas</TableHeaderCell>
              <TableHeaderCell>Nota média</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.topCourses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium text-ink">{c.course.title}</TableCell>
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
                <TableCell colSpan={5} className="text-center text-ink-faint py-6">
                  Sem dados de cursos
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
