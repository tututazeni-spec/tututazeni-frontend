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
import { Button, IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { NavyBadge, NavyCard } from '@/components/courses/NavyCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { STATUS_TONE } from './trainingTones';
import type { CalendarEvent, CalendarResponse, TrainingStatus } from './types';

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

const SIDEBAR_BG =
  'linear-gradient(170deg, #1E3A5F 0%, #0F1F3D 55%, #0A1630 100%)';

/** Cor de cada estado (legenda, borda e fundo dos chips). */
const STATUS_COLOR: Record<TrainingStatus, string> = {
  DRAFT: '#94A3B8',
  PUBLISHED: '#2563EB',
  COMPLETED: '#16A34A',
  CANCELLED: '#E11D48',
  ARCHIVED: '#64748B',
};

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, white)`;

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
  // Legenda: os estados presentes no mês; sem eventos, só "Publicada".
  const legend: TrainingStatus[] = [
    ...new Set((data?.events ?? []).map((ev) => ev.status)),
  ];
  if (legend.length === 0) legend.push('PUBLISHED');
  const selectedEvents = selectedDay
    ? (eventsByDay.get(selectedDay) ?? [])
    : [];

  const goToMonth = (offset: number) => {
    setSelectedDay(null);
    setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + offset, 1));
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <div className="flex flex-col overflow-hidden rounded-[24px] border border-brand/10 bg-white shadow-[0_8px_24px_rgba(15,31,61,0.12)] lg:flex-row">
            <aside
              className="flex flex-col gap-4 p-5 text-white lg:w-52 lg:shrink-0"
              style={{ background: SIDEBAR_BG }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-card border-2 border-white">
                <GraduationCap size={22} strokeWidth={1.75} />
              </span>
              <h3 className="font-display text-2xl font-bold">Formações</h3>
              <hr className="border-white/25" />
              <ul className="space-y-3">
                {legend.map((st) => (
                  <li
                    key={st}
                    className="flex items-center gap-2.5 font-body text-sm font-semibold"
                  >
                    <span
                      aria-hidden
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[st] }}
                    />
                    {STATUS_CFG[st].label}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="min-w-0 flex-1 space-y-4 bg-surface-sunken p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IconButton
                    icon={ChevronLeft}
                    label="Mês anterior"
                    intent="ghost"
                    className="rounded-full border border-brand/15 bg-white shadow-sm"
                    onClick={() => goToMonth(-1)}
                  />
                  <h3 className="font-display text-xl font-bold capitalize text-brand">
                    {monthAnchor.toLocaleDateString('pt-AO', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </h3>
                  <IconButton
                    icon={ChevronRight}
                    label="Mês seguinte"
                    intent="ghost"
                    className="rounded-full border border-brand/15 bg-white shadow-sm"
                    onClick={() => goToMonth(1)}
                  />
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
                <div className="flex flex-wrap gap-2">
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

              <div className="overflow-x-auto">
                <div className="grid min-w-[640px] grid-cols-7 gap-2">
                  {WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="rounded-card bg-brand/[0.07] py-2 text-center font-body text-sm font-bold text-brand"
                    >
                      {w}
                    </div>
                  ))}
                  {grid.map((d) => {
                    const key = dayKey(d);
                    const inMonth = d.getMonth() === monthAnchor.getMonth();
                    const dayEvents = eventsByDay.get(key) ?? [];
                    const isToday = key === todayKey;
                    const isSelected = key === selectedDay;
                    const toggle = () =>
                      setSelectedDay(isSelected ? null : key);
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
                        className={cn(
                          'min-h-24 cursor-pointer space-y-1 rounded-card border border-brand/10 p-2 text-left shadow-[0_1px_3px_rgba(15,31,61,0.08)] transition-shadow hover:shadow-md',
                          inMonth ? 'bg-white' : 'bg-white/40',
                          isSelected && 'ring-2 ring-brand',
                        )}
                        style={
                          isToday
                            ? { background: tint(STATUS_COLOR.PUBLISHED, 14) }
                            : undefined
                        }
                      >
                        <span
                          className={cn(
                            'text-sm font-bold',
                            inMonth ? 'text-brand' : 'text-brand-muted/60',
                          )}
                        >
                          {d.getDate()}
                        </span>
                        {dayEvents.slice(0, MAX_CHIPS).map((ev) => {
                          const color = STATUS_COLOR[ev.status];
                          return (
                            <button
                              key={`${ev.kind}-${ev.id}`}
                              type="button"
                              title={ev.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectTraining(ev.trainingId);
                              }}
                              className="block w-full break-words rounded-control px-1.5 py-1 text-left font-body text-micro font-semibold leading-tight text-brand transition hover:brightness-95"
                              style={{
                                background: tint(color, 14),
                                borderLeft: `3px solid ${color}`,
                              }}
                            >
                              {ev.start && (
                                <>
                                  <span className="font-bold">
                                    {formatTime(ev.start)}
                                  </span>{' '}
                                </>
                              )}
                              {ev.title}
                            </button>
                          );
                        })}
                        {dayEvents.length > MAX_CHIPS && (
                          <span className="block font-body text-micro font-semibold text-brand-muted">
                            +{dayEvents.length - MAX_CHIPS} mais
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
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
