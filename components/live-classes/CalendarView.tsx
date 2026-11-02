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
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { LiveClassCalendarEvent } from './types';

const MODALITY_ITEMS = [
  { value: 'ALL', label: 'Todas as modalidades' },
  { value: 'PRESENTIAL', label: 'Presencial' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'HYBRID', label: 'Híbrida' },
];

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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

  function goToMonth(delta: number) {
    setMonthAnchor((d) => {
      const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
      setSelectedDay(dayKey(next));
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button intent="ghost" size="sm" onClick={() => goToMonth(-1)}>
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[140px] text-center font-body text-sm font-medium capitalize text-ink">
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

      {isLoading ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <Card className="overflow-hidden p-0">
            <div className="grid grid-cols-7 border-b border-border bg-brand/60">
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="px-2 py-3 text-center text-xs font-medium uppercase tracking-wide text-white"
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
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
                    className={`min-h-[84px] cursor-pointer border-b border-r border-border p-1.5 hover:bg-surface-sunken ${
                      inMonth ? '' : 'bg-surface-sunken/50'
                    } ${isSelected ? 'ring-2 ring-inset ring-[#0F1F3D]' : ''}`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-body text-xs ${
                        isToday
                          ? 'bg-[#0F1F3D] font-medium text-white'
                          : inMonth
                            ? 'text-ink'
                            : 'text-ink-faint'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 2).map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          title={ev.title}
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/live-classes/${ev.liveClassId}`);
                          }}
                          className="flex w-full items-center gap-1 overflow-hidden rounded-md bg-gradient-to-br from-[#0F1F3D] via-[#14284f] to-[#1d3a8a] px-1.5 py-1 text-left font-body text-[11px] text-white transition hover:brightness-110"
                        >
                          {ev.status === 'EM_CURSO' ? (
                            <span
                              className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E11D48] ring-2 ring-white/40"
                              title="Ao vivo"
                            />
                          ) : (
                            <Video
                              size={11}
                              strokeWidth={1.75}
                              className="flex-shrink-0"
                            />
                          )}
                          <span className="flex-shrink-0 font-bold">
                            {formatTime(ev.start)}
                          </span>
                          <span className="truncate text-white/80">
                            {ev.title}
                          </span>
                        </button>
                      ))}
                      {events.length > 2 && (
                        <div className="px-1 font-body text-[11px] text-ink-faint">
                          +{events.length - 2} mais
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

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
