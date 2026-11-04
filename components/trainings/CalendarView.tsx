// components/trainings/CalendarView.tsx
// Separador "Calendário" (docs/trainings-detalhado.md pt.4). Grelha mensal
// (segunda a domingo) navegável por mês, com as sessões/formações em cada dia;
// clicar num dia mostra o detalhe desse dia por baixo da grelha (cartões),
// clicar numa etiqueta abre a formação. As visualizações semanal/diária ficam
// para uma fase seguinte.

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

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MAX_CHIPS = 3;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
// Chave de dia em hora LOCAL (toISOString deslocava eventos perto da meia-noite).
function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Dias da grelha: da segunda-feira da semana do dia 1 ao domingo da semana do último dia. */
function buildGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const lead = (first.getDay() + 6) % 7; // segunda = 0
  const trail = 6 - ((last.getDay() + 6) % 7);
  const total = lead + last.getDate() + trail;
  return Array.from(
    { length: total },
    (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - lead + i),
  );
}

export function CalendarView({ onSelectTraining }: CalendarViewProps) {
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [modality, setModality] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

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

  const eventsByDay = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of data?.events ?? []) {
      if (!ev.start) continue;
      const key = dayKey(new Date(ev.start));
      const arr = byDay.get(key) ?? [];
      arr.push(ev);
      byDay.set(key, arr);
    }
    for (const arr of byDay.values()) {
      arr.sort((x, y) => (x.start ?? '').localeCompare(y.start ?? ''));
    }
    return byDay;
  }, [data]);

  const grid = useMemo(() => buildGrid(monthAnchor), [monthAnchor]);
  const todayKey = dayKey(new Date());
  const selectedEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : [];

  const goToMonth = (offset: number) => {
    setSelectedDay(null);
    setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button intent="ghost" size="sm" onClick={() => goToMonth(-1)}>
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[140px] text-center font-body text-sm font-medium text-ink">
            {monthAnchor.toLocaleDateString('pt-AO', {
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <Button intent="ghost" size="sm" onClick={() => goToMonth(1)}>
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => {
              setSelectedDay(dayKey(new Date()));
              setMonthAnchor(new Date());
            }}
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
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAYS.map((w) => (
                  <div
                    key={w}
                    className="px-2 py-2 text-center font-body text-xs font-semibold uppercase tracking-wide text-ink-muted"
                  >
                    {w}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {grid.map((d) => {
                  const key = dayKey(d);
                  const inMonth = d.getMonth() === monthAnchor.getMonth();
                  const dayEvents = eventsByDay.get(key) ?? [];
                  const isToday = key === todayKey;
                  const isSelected = key === selectedDay;
                  const toggle = () => setSelectedDay(isSelected ? null : key);
                  return (
                    <div
                      key={key}
                      role="button"
                      tabIndex={0}
                      aria-label={`${formatDate(key, { day: '2-digit', month: 'long' })}, ${dayEvents.length} evento(s)`}
                      onClick={toggle}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggle();
                        }
                      }}
                      className={`min-h-[96px] cursor-pointer border-b border-r border-border p-1.5 text-left transition-colors hover:bg-black/5 ${
                        inMonth ? '' : 'bg-black/[0.03]'
                      } ${isSelected ? 'ring-2 ring-inset ring-[#0F1F3D]' : ''}`}
                    >
                      <span
                        className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 font-body text-xs ${
                          isToday
                            ? 'bg-[#0F1F3D] font-semibold text-white'
                            : inMonth
                              ? 'text-ink'
                              : 'text-ink-muted'
                        }`}
                      >
                        {d.getDate()}
                      </span>
                      <div className="mt-1 space-y-1">
                        {dayEvents.slice(0, MAX_CHIPS).map((ev) => (
                          <button
                            key={`${ev.kind}-${ev.id}`}
                            type="button"
                            title={ev.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTraining(ev.trainingId);
                            }}
                            className="block w-full truncate rounded bg-[#0F1F3D] px-1.5 py-0.5 text-left font-body text-[11px] text-white hover:opacity-90"
                          >
                            {ev.start ? `${formatTime(ev.start)} ` : ''}
                            {ev.title}
                          </button>
                        ))}
                        {dayEvents.length > MAX_CHIPS && (
                          <span className="block px-1 font-body text-[11px] text-ink-muted">
                            +{dayEvents.length - MAX_CHIPS} mais
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {(data?.events ?? []).length === 0 && (
            <EmptyState
              title="Sem sessões/formações neste período"
              description="Ajusta o mês ou os filtros para ver outras datas."
            />
          )}

          {selectedDay && (
            <section className="space-y-2">
              <h3 className="font-body text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {formatDate(selectedDay, {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                })}
              </h3>
              {selectedEvents.length === 0 ? (
                <p className="font-body text-sm text-ink-muted">
                  Sem sessões/formações neste dia.
                </p>
              ) : (
                selectedEvents.map((ev) => (
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
                ))
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
