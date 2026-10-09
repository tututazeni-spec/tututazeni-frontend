// components/analytics/ROIView.tsx
// Separador "ROI Formação" — GET /analytics/roi. Endpoint já existia sem
// consumidor no frontend; o título do curso em cada `impact` foi
// adicionado ao include do Prisma em analytics.service.ts#getTrainingROI
// (só devolvia courseId antes, inútil para apresentação).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Award, CheckCircle2, Clock } from 'lucide-react';
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
import type { TrainingROI } from './types';

export function ROIView() {
  const { data, isLoading } = useApiQuery<TrainingROI>(
    queryKeys.analyticsPage.roi(),
    '/analytics/roi',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <NavyStatCard
          icon={Clock}
          label="Horas de formação investidas"
          value={data.totalHoursInvested}
          tone="blue"
        />
        <NavyStatCard
          icon={CheckCircle2}
          label="Conclusões totais"
          value={data.totalCompletions}
          tone="green"
        />
        <NavyStatCard
          icon={Award}
          label="Certificados emitidos"
          value={data.totalCertificates}
          tone="orange"
        />
      </div>

      <div>
        <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Impacto de formação por curso
        </div>
        <Table>
          <TableHead className="bg-[#0F1F3D]/60">
            <TableRow className="hover:bg-transparent">
              <TableHeaderCell className="text-white">Curso</TableHeaderCell>
              <TableHeaderCell className="text-white">Métrica</TableHeaderCell>
              <TableHeaderCell className="text-white">Taxa de impacto</TableHeaderCell>
              <TableHeaderCell className="text-white">Calculado em</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.impacts.map((imp) => (
              <TableRow key={imp.id}>
                <TableCell className="font-medium text-ink">
                  {imp.course?.title ?? `Curso #${imp.courseId}`}
                </TableCell>
                <TableCell>{imp.metric}</TableCell>
                <TableCell>{imp.impactRate}%</TableCell>
                <TableCell>
                  {new Date(imp.calculatedAt).toLocaleDateString('pt-PT')}
                </TableCell>
              </TableRow>
            ))}
            {data.impacts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-ink-faint py-6"
                >
                  Sem dados de impacto de formação
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
