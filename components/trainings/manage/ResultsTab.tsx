// components/trainings/manage/ResultsTab.tsx
// Resultados: inscritos, participantes, concluíram, taxa de conclusão,
// presença, nota média, satisfação, custo por participante (todos
// calculados no backend — GET /trainings/:id/results).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Award,
  BadgeCheck,
  CheckCircle2,
  ClipboardList,
  Smile,
  ThumbsUp,
  UserCheck,
} from 'lucide-react';
import { WalletStat } from '@/components/roi-impact/WalletStat';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { TrainingResults } from '../types';

function kz(value: number): string {
  return (
    new Intl.NumberFormat('pt-PT', { maximumFractionDigits: 2 }).format(value) +
    ' AOA'
  );
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
      <Skeleton
        rows={2}
        wrapperClassName="grid grid-cols-4 gap-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-4">
        <KpiCard
          icon={ClipboardList}
          label="Inscritos"
          value={data.enrolled}
          intent="primary"
        />
        <KpiCard
          icon={UserCheck}
          label="Participantes"
          value={data.participants}
          intent="info"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Concluíram"
          value={data.completed}
          intent="success"
        />
        <KpiCard
          icon={Award}
          label="Nota média"
          value={data.avgScore != null ? data.avgScore : '—'}
          intent="accent"
        />
        <KpiCard
          icon={BadgeCheck}
          label="Taxa de aprovação"
          value={data.approvalRate != null ? `${data.approvalRate}%` : '—'}
          intent="success"
        />
        <KpiCard
          icon={Smile}
          label="Satisfação"
          value={`${data.satisfaction} / 5`}
          intent="warning"
        />
        <KpiCard
          icon={ThumbsUp}
          label="NPS"
          value={data.nps != null ? data.nps : '—'}
          intent="warning"
        />
        <WalletStat
          zoom
          money="bills"
          tone="red"
          label="Custo por participante"
          value={kz(data.costPerParticipant)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <DonutStatCard
          bare
          label="Taxa de conclusão"
          value={data.completionRate}
        />
        <DonutStatCard
          bare
          label="Taxa de resposta"
          value={data.responseRate}
        />
        <DonutStatCard bare label="Presença" value={data.attendanceRate} />
      </div>
    </div>
  );
}
