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
import type { LucideIcon } from 'lucide-react';
import { Award, ClipboardCheck, Clock } from 'lucide-react';
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

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
      </div>
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
      <div className="grid grid-cols-3 gap-4">
        <TopBarKpiCard
          icon={ClipboardCheck}
          label="Nota média de avaliação"
          value={data.avgAssessmentScore}
          tone="blue"
        />
        <TopBarKpiCard
          icon={Award}
          label="Certificados emitidos"
          value={data.certificationCount}
          tone="green"
        />
        <TopBarKpiCard
          icon={Clock}
          label="Horas de formação consumidas"
          value={data.totalHoursConsumed}
          tone="gold"
        />
      </div>

      {/* Estado das matrículas */}
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div className="h-1.5 w-full bg-[#2E8B3E]" />
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
            Matrículas por estado
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div
                key={status}
                className="flex items-center gap-2 rounded-full border border-border bg-surface-sunken px-3 py-1.5"
              >
                <StatusBadge
                  value={status as EnrollmentStatus}
                  map={ENROLLMENT_STATUS_CFG}
                  variant="dot"
                />
                <span className="font-data text-sm font-bold text-ink">
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
        <div className="h-1.5 w-full bg-[#2B6CC4]" />
        <div className="p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink-muted">
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
