// components/trainings/manage/ResultsTab.tsx
// Resultados: inscritos, participantes, concluíram, taxa de conclusão,
// presença, nota média, satisfação, custo por participante (todos
// calculados no backend — GET /trainings/:id/results).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingResults } from '../types';

function kz(value: number): string {
  return new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(value) + ' Kz';
}

interface ResultsTabProps {
  trainingId: number;
}

export function ResultsTab({ trainingId }: ResultsTabProps) {
  const { data, isLoading } = useApiQuery<TrainingResults>(
    queryKeys.trainings.results(trainingId),
    `/trainings/${trainingId}/results`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) {
    return (
      <Skeleton rows={2} wrapperClassName="grid grid-cols-4 gap-3" itemClassName="skeleton-shimmer h-24 rounded-card" />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiCard label="Inscritos" value={data.enrolled} intent="primary" />
      <KpiCard label="Participantes" value={data.participants} intent="info" />
      <KpiCard label="Concluíram" value={data.completed} intent="success" />
      <KpiCard label="Taxa de conclusão" value={`${data.completionRate}%`} intent="success" />
      <KpiCard label="Presença" value={`${data.attendanceRate}%`} intent="info" />
      <KpiCard label="Nota média" value={data.avgScore != null ? data.avgScore : '—'} intent="accent" />
      <KpiCard
        label="Taxa de aprovação"
        value={data.approvalRate != null ? `${data.approvalRate}%` : '—'}
        intent="success"
      />
      <KpiCard label="Satisfação" value={`${data.satisfaction} / 5`} intent="warning" />
      <KpiCard label="Taxa de resposta" value={`${data.responseRate}%`} intent="info" />
      <KpiCard label="NPS" value={data.nps != null ? data.nps : '—'} intent="warning" />
      <KpiCard label="Custo por participante" value={kz(data.costPerParticipant)} intent="danger" />
    </div>
  );
}
