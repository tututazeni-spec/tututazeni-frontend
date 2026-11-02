// components/live-classes/CalendarView.tsx
// Separador "Calendário" (docs/aulas-ao-vivo.md secção 4) — grelha mensal
// navegável (mês anterior/seguinte) + detalhe do dia seleccionado.

'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, List, User } from 'lucide-react';
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
                          className="block w-full truncate rounded bg-[#0F1F3D]/10 px-1 py-0.5 text-left font-body text-[11px] text-ink hover:bg-[#0F1F3D]/20"
                        >
                          {formatTime(ev.start)} {ev.title}
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
              <div className="divide-y divide-border">
                {selectedEvents.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() =>
                      router.push(`/live-classes/${ev.liveClassId}`)
                    }
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken"
                  >
                    <span className="w-14 flex-shrink-0 font-mono text-xs text-ink-faint">
                      {formatTime(ev.start)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {ev.title}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-faint">
                        {ev.courseTitle && <span>{ev.courseTitle}</span>}
                        {ev.instructorName && (
                          <span className="flex items-center gap-1">
                            <User size={12} strokeWidth={1.75} />
                            {ev.instructorName}
                          </span>
                        )}
                        {ev.sessionId && <span>Sessão</span>}
                      </div>
                    </div>
                    <span className="rounded px-2 py-0.5 font-body text-xs font-medium bg-surface-sunken text-ink-muted">
                      {MODALITY_CFG[ev.modality]?.label ?? ev.modality}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[ev.status]?.cls ?? ''}`}
                    >
                      {STATUS_CFG[ev.status]?.label ?? ev.status}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
