// components/analytics/ROIView.tsx
// Separador "ROI Formação" — GET /analytics/roi. Endpoint já existia sem
// consumidor no frontend; o título do curso em cada `impact` foi
// adicionado ao include do Prisma em analytics.service.ts#getTrainingROI
// (só devolvia courseId antes, inútil para apresentação).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { LucideIcon } from 'lucide-react';
import { Award, CheckCircle2, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import type { TrainingROI } from './types';

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

export function ROIView() {
  const { data, isLoading } = useApiQuery<TrainingROI>(
    queryKeys.analyticsPage.roi(),
    '/analytics/roi',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <TopBarKpiCard
          icon={Clock}
          label="Horas de formação investidas"
          value={data.totalHoursInvested}
          tone="blue"
        />
        <TopBarKpiCard
          icon={CheckCircle2}
          label="Conclusões totais"
          value={data.totalCompletions}
          tone="green"
        />
        <TopBarKpiCard
          icon={Award}
          label="Certificados emitidos"
          value={data.totalCertificates}
          tone="gold"
        />
      </div>

      <div>
        <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
          Impacto de formação por curso
        </div>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Curso</TableHeaderCell>
              <TableHeaderCell>Métrica</TableHeaderCell>
              <TableHeaderCell>Taxa de impacto</TableHeaderCell>
              <TableHeaderCell>Calculado em</TableHeaderCell>
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
