// components/trainings/CalendarView.tsx
// Separador "Calendário" (docs/trainings-detalhado.md pt.4). Visualização em
// agenda (lista agrupada por dia) navegável por mês — uma das 4
// visualizações pedidas na spec (mensal/semanal/diária/agenda); as
// restantes ficam para uma fase seguinte, o essencial (ver sessões/
// formações agendadas num intervalo, filtrar, abrir detalhe) já funciona.

'use client';

import { useMemo, useState } from 'react';
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  List,
  MapPin,
  User,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { STATUS_TONE } from './trainingTones';
import type { CalendarEvent, CalendarResponse } from './types';

interface CalendarViewProps {
  onSelectTraining: (id: number) => void;
}

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrido' },
];

const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicada' },
  { value: 'COMPLETED', label: 'Concluída' },
  { value: 'CANCELLED', label: 'Cancelada' },
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarView({ onSelectTraining }: CalendarViewProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [modality, setModality] = useState('ALL');
  const [status, setStatus] = useState('ALL');

  const from = startOfMonth(monthAnchor);
  const to = endOfMonth(monthAnchor);

  const params: Record<string, string | number | boolean | null | undefined> = {
    from: from.toISOString(),
    to: to.toISOString(),
  };
  if (modality !== 'ALL') params.modality = modality;
  if (status !== 'ALL') params.status = status;

  const { data, isLoading } = useApiQuery<CalendarResponse>(
    queryKeys.trainings.calendar(params),
    '/trainings/calendar',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const groups = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of data?.events ?? []) {
      if (!ev.start) continue;
      const key = dayKey(new Date(ev.start));
      const arr = byDay.get(key) ?? [];
      arr.push(ev);
      byDay.set(key, arr);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            intent="ghost"
            size="sm"
            onClick={() =>
              setMonthAnchor(
                (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
              )
            }
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[140px] text-center font-body text-sm font-medium text-ink">
            {monthAnchor.toLocaleDateString('pt-AO', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <Button
            intent="ghost"
            size="sm"
            onClick={() =>
              setMonthAnchor(
                (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
              )
            }
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setMonthAnchor(new Date())}
          >
            Hoje
          </Button>
        </div>
        <div className="flex gap-2">
          <Select
            variant="underline"
            icon={List}
            items={MODALITY_ITEMS}
            value={modality}
            onValueChange={setModality}
            className="w-44"
          />
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_ITEMS}
            value={status}
            onValueChange={setStatus}
            className="w-40"
          />
        </div>
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Sem sessões/formações neste período"
          description="Ajusta o mês ou os filtros para ver outras datas."
        />
      ) : (
        <div className="space-y-3">
          {groups.map(([day, events]) => (
            <section key={day} className="space-y-2">
              <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {formatDate(day, {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </h3>
              {events.map((ev) => (
                <NavyCard
                  key={`${ev.kind}-${ev.id}`}
                  compact
                  seed={ev.colorIndex ?? ev.trainingId}
                  onClick={() => onSelectTraining(ev.trainingId)}
                  kicker={ev.kind === 'session' ? 'Sessão' : 'Formação'}
                  kickerIcon={
                    ev.kind === 'session' ? CalendarClock : GraduationCap
                  }
                  title={ev.title}
                  badge={
                    <>
                      <NavyBadge tone={STATUS_TONE[ev.status]}>
                        {STATUS_CFG[ev.status].label}
                      </NavyBadge>
                      <NavyBadge tone="neutral">
                        {TYPE_CFG[ev.trainingType]?.label ?? ev.trainingType}
                      </NavyBadge>
                    </>
                  }
                  infos={[
                    {
                      icon: Clock,
                      value: ev.start ? formatTime(ev.start) : '—',
                      label: 'Hora',
                    },
                    {
                      icon: User,
                      value: ev.instructor?.fullName ?? '—',
                      label: 'Formador',
                    },
                    {
                      icon: MapPin,
                      value: ev.location ?? '—',
                      label: 'Local',
                    },
                    ...(ev.kind === 'session'
                      ? [
                          {
                            icon: Users,
                            value: ev.maxParticipants
                              ? `${ev.participants}/${ev.maxParticipants}`
                              : String(ev.participants),
                            label: 'Participantes',
                          },
                        ]
                      : []),
                  ]}
                />
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
