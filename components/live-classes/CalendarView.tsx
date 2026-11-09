// components/live-classes/CalendarView.tsx
// Separador "Calendário" (docs/aulas-ao-vivo.md secção 4) — grelha mensal
// navegável (mês anterior/seguinte) + detalhe do dia seleccionado.

'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, List, User, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { LiveClassCalendarEvent, LiveClassStatus } from './types';

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrida' },
];

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const SIDEBAR_BG =
  'linear-gradient(170deg, #1E3A5F 0%, #0F1F3D 55%, #0A1630 100%)';

/** Cor de cada estado (legenda, borda e fundo dos chips). */
const STATUS_COLOR: Record<LiveClassStatus, string> = {
  AGENDADA: '#2563EB',
  EM_PREPARACAO: '#D97706',
  EM_CURSO: '#E11D48',
  CONCLUIDA: '#16A34A',
  CANCELADA: '#94A3B8',
  ADIADA: '#F59E0B',
};

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, white)`;

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
/** Chave de dia em hora local (YYYY-MM-DD). */
function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Dias da grelha mensal (semanas completas, a começar à segunda-feira). */
function buildGrid(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const offset = (first.getDay() + 6) % 7;
  const total = Math.ceil((offset + endOfMonth(anchor).getDate()) / 7) * 7;
  return Array.from(
    { length: total },
    (_, i) => new Date(first.getFullYear(), first.getMonth(), 1 - offset + i),
  );
}

export function CalendarView() {
  const router = useRouter();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [modality, setModality] = useState('ALL');
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));

  const from = startOfMonth(monthAnchor);
  const to = endOfMonth(monthAnchor);
  const params = { from: from.toISOString(), to: to.toISOString() };

  const { data, isLoading } = useApiQuery<LiveClassCalendarEvent[]>(
    queryKeys.liveClasses.calendar(params),
    '/live-classes/calendar',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const gridDays = useMemo(() => buildGrid(monthAnchor), [monthAnchor]);
  const todayKey = dayKey(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, LiveClassCalendarEvent[]>();
    for (const ev of data ?? []) {
      if (modality !== 'ALL' && ev.modality !== modality) continue;
      const key = dayKey(new Date(ev.start));
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.start.localeCompare(b.start));
    }
    return map;
  }, [data, modality]);

  const selectedEvents = byDay.get(selectedDay) ?? [];

  // Legenda: os estados presentes no mês; sem aulas, só "Agendada".
  const legend: LiveClassStatus[] = [
    ...new Set((data ?? []).map((ev) => ev.status)),
  ];
  if (legend.length === 0) legend.push('AGENDADA');

  function goToMonth(delta: number) {
    setMonthAnchor((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      setSelectedDay(dayKey(next));
      return next;
    });
  }

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
                <Video size={22} strokeWidth={1.75} />
              </span>
              <h3 className="font-display text-2xl font-bold">Aulas ao vivo</h3>
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
                    {STATUS_CFG[st]?.label ?? st}
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
                      setMonthAnchor(new Date());
                      setSelectedDay(dayKey(new Date()));
                    }}
                  >
                    Hoje
                  </Button>
                </div>
                <Select
                  variant="underline"
                  icon={List}
                  items={MODALITY_ITEMS}
                  value={modality}
                  onValueChange={setModality}
                  className="w-56"
                />
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
                  {gridDays.map((d) => {
                    const key = dayKey(d);
                    const inMonth = d.getMonth() === monthAnchor.getMonth();
                    const events = byDay.get(key) ?? [];
                    const isToday = key === todayKey;
                    const isSelected = key === selectedDay;
                    return (
                      <div
                        key={key}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedDay(key)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setSelectedDay(key);
                          }
                        }}
                        className={cn(
                          'min-h-24 cursor-pointer space-y-1 rounded-card border border-brand/10 p-2 shadow-[0_1px_3px_rgba(15,31,61,0.08)] transition-shadow hover:shadow-md',
                          inMonth ? 'bg-white' : 'bg-white/40',
                          isSelected && 'ring-2 ring-brand',
                        )}
                        style={
                          isToday
                            ? { background: tint(STATUS_COLOR.AGENDADA, 14) }
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
                        {events.slice(0, 2).map((ev) => {
                          const color = STATUS_COLOR[ev.status];
                          return (
                            <button
                              key={ev.id}
                              type="button"
                              title={ev.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/live-classes/${ev.liveClassId}`);
                              }}
                              className="block w-full break-words rounded-control px-1.5 py-1 text-left font-body text-micro font-semibold leading-tight text-brand transition hover:brightness-95"
                              style={{
                                background: tint(color, 14),
                                borderLeft: `3px solid ${color}`,
                              }}
                            >
                              <span className="font-bold">
                                {formatTime(ev.start)}
                              </span>{' '}
                              {ev.title}
                            </button>
                          );
                        })}
                        {events.length > 2 && (
                          <div className="font-body text-micro font-semibold text-brand-muted">
                            +{events.length - 2} mais
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="border-b border-border bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
              {formatDate(
                new Date(
                  Number(selectedDay.slice(0, 4)),
                  Number(selectedDay.slice(5, 7)) - 1,
                  Number(selectedDay.slice(8, 10)),
                ),
                {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                },
              )}
            </div>
            {selectedEvents.length === 0 ? (
              <div className="px-4 py-6 text-center font-body text-sm text-ink-faint">
                Sem aulas/sessões neste dia.
              </div>
            ) : (
              <div className="grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {selectedEvents.map((ev) => {
                  const isLive = ev.status === 'EM_CURSO';
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() =>
                        router.push(`/live-classes/${ev.liveClassId}`)
                      }
                      className="relative flex min-h-[150px] w-full flex-col justify-between overflow-hidden rounded-[14px] bg-gradient-to-br from-[#0F1F3D] via-[#14284f] to-[#1d3a8a] p-4 text-left text-white shadow-sm transition hover:brightness-110"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white">
                          <Video size={20} strokeWidth={1.75} />
                        </span>
                        {isLive ? (
                          <span className="flex items-center gap-1.5 rounded-full bg-[#E11D48] px-3 py-1 text-xs font-semibold">
                            <span className="h-2 w-2 rounded-full bg-white" />
                            Ao vivo
                          </span>
                        ) : (
                          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                            {STATUS_CFG[ev.status]?.label ?? ev.status}
                          </span>
                        )}
                      </div>
                      <div className="mt-3">
                        <div className="text-3xl font-bold leading-none">
                          {formatTime(ev.start)}
                        </div>
                        <div
                          className="mt-1.5 truncate text-sm text-white/80"
                          title={ev.title}
                        >
                          {ev.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-white/60">
                          {ev.courseTitle && <span>{ev.courseTitle}</span>}
                          {ev.instructorName && (
                            <span className="flex items-center gap-1">
                              <User size={12} strokeWidth={1.75} />
                              {ev.instructorName}
                            </span>
                          )}
                          <span>
                            {ev.sessionId ? 'Sessão · ' : ''}
                            {MODALITY_CFG[ev.modality]?.label ?? ev.modality}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
