// components/live-classes/DashboardView.tsx
// Separador "Visão Geral" (docs/aulas-ao-vivo.md secção 1). Dados próprios
// (GET /live-classes/dashboard) + apresentação — mesmo padrão de
// components/trainings/DashboardView.tsx.

'use client';

import {
  Calendar,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clapperboard,
  Clock,
  UserCheck,
  Users,
  Video,
  XCircle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
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
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="skeleton-shimmer h-[155px] rounded-2xl"
      />
    );

  const { cards } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          icon={Calendar}
          tone="blue"
          label="Agendadas"
          value={cards.scheduled}
        />
        <NavyStatCard
          icon={Video}
          tone="red"
          label="Em curso"
          value={cards.inProgress}
        />
        <NavyStatCard
          icon={CheckCircle2}
          tone="green"
          label="Concluídas"
          value={cards.completed}
        />
        <NavyStatCard
          icon={XCircle}
          tone="orange"
          label="Canceladas"
          value={cards.cancelled}
        />
        <NavyStatCard
          icon={CalendarDays}
          tone="blue"
          label="Hoje"
          value={cards.today}
        />
        <NavyStatCard
          icon={CalendarRange}
          tone="blue"
          label="Esta semana"
          value={cards.thisWeek}
        />
        <NavyStatCard
          icon={CalendarClock}
          tone="blue"
          label="Próximas"
          value={cards.upcoming}
        />
        <NavyStatCard
          icon={Users}
          tone="blue"
          label="Participantes"
          value={cards.totalParticipants}
        />
        <NavyStatCard
          icon={UserCheck}
          tone="green"
          label="Presença média"
          value={`${cards.averageAttendancePercent}%`}
        />
        <NavyStatCard
          icon={Clock}
          tone="orange"
          label="Horas realizadas"
          value={cards.hoursDelivered}
        />
        <NavyStatCard
          icon={Clapperboard}
          tone="blue"
          label="Gravações disponíveis"
          value={cards.recordingsAvailable}
        />
      </div>

      {data.byModality.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border px-4 py-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Aulas por modalidade
          </div>
          {data.byModality.map((m) => (
            <div
              key={m.modality}
              className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0"
            >
              <span className="font-body text-sm text-ink">
                {MODALITY_CFG[m.modality]?.label ?? m.modality}
              </span>
              <span className="font-mono text-sm font-semibold text-ink">
                {m.count}
              </span>
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
              <span className="font-body text-sm text-ink">
                {i.instructorName}
              </span>
              <span className="font-mono text-sm font-semibold text-ink">
                {i.count}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
