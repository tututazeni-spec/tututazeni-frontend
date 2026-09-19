// components/live-classes/DashboardView.tsx
// Separador "Visão Geral" (docs/aulas-ao-vivo.md secção 1). Dados próprios
// (GET /live-classes/dashboard) + apresentação — mesmo padrão de
// components/trainings/DashboardView.tsx.

'use client';

import { Calendar, Clapperboard, Clock, Users, Video } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { MODALITY_CFG } from './constants';
import type { LiveClassesDashboard } from './types';

export function DashboardView() {
  const { data, isLoading } = useApiQuery<LiveClassesDashboard>(
    queryKeys.liveClasses.dashboard(),
    '/live-classes/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-24 rounded-card"
      />
    );

  const { cards } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <KpiCard icon={Calendar} label="Agendadas" value={cards.scheduled} intent="info" />
        <KpiCard icon={Video} label="Em curso" value={cards.inProgress} intent="danger" />
        <KpiCard icon={Clapperboard} label="Concluídas" value={cards.completed} intent="success" />
        <KpiCard label="Canceladas" value={cards.cancelled} intent="warning" />
        <KpiCard label="Hoje" value={cards.today} />
        <KpiCard label="Esta semana" value={cards.thisWeek} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard icon={Calendar} label="Próximas" value={cards.upcoming} intent="primary" />
        <KpiCard icon={Users} label="Participantes" value={cards.totalParticipants} />
        <KpiCard label="Presença média" value={`${cards.averageAttendancePercent}%`} intent="success" />
        <KpiCard icon={Clock} label="Horas realizadas" value={cards.hoursDelivered} />
      </div>

      <Card className="p-4">
        <div className="mb-1 font-body text-xs text-ink-faint">Gravações disponíveis</div>
        <div className="font-mono text-3xl font-bold text-ink">{cards.recordingsAvailable}</div>
      </Card>

      {data.byModality.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Aulas por modalidade
          </div>
          {data.byModality.map((m) => (
            <div key={m.modality} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
              <span className="font-body text-sm text-ink">{MODALITY_CFG[m.modality]?.label ?? m.modality}</span>
              <span className="font-mono text-sm font-semibold text-ink">{m.count}</span>
            </div>
          ))}
        </Card>
      )}

      {data.byInstructor.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Aulas por formador
          </div>
          {data.byInstructor.map((i) => (
            <div
              key={i.instructorId ?? 'sem-formador'}
              className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
            >
              <span className="font-body text-sm text-ink">{i.instructorName}</span>
              <span className="font-mono text-sm font-semibold text-ink">{i.count}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
