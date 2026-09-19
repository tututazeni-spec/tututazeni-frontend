// components/live-classes/CalendarView.tsx
// Separador "Calendário" (docs/aulas-ao-vivo.md secção 4) — visualização em
// agenda (lista agrupada por dia), navegável por mês. Mesmo padrão de
// components/trainings/CalendarView.tsx.

'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
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

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function CalendarView() {
  const router = useRouter();
  const [monthAnchor, setMonthAnchor] = useState(() => new Date());
  const [modality, setModality] = useState('ALL');

  const from = startOfMonth(monthAnchor);
  const to = endOfMonth(monthAnchor);
  const params = { from: from.toISOString(), to: to.toISOString() };

  const { data, isLoading } = useApiQuery<LiveClassCalendarEvent[]>(
    queryKeys.liveClasses.calendar(params),
    '/live-classes/calendar',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const groups = useMemo(() => {
    const byDay = new Map<string, LiveClassCalendarEvent[]>();
    for (const ev of data ?? []) {
      if (modality !== 'ALL' && ev.modality !== modality) continue;
      const key = dayKey(new Date(ev.start));
      const arr = byDay.get(key) ?? [];
      arr.push(ev);
      byDay.set(key, arr);
    }
    return [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data, modality]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[140px] text-center font-body text-sm font-medium text-ink">
            {monthAnchor.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })}
          </span>
          <Button
            intent="ghost"
            size="sm"
            onClick={() => setMonthAnchor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <Button intent="ghost" size="sm" onClick={() => setMonthAnchor(new Date())}>
            Hoje
          </Button>
        </div>
        <Select items={MODALITY_ITEMS} value={modality} onValueChange={setModality} className="w-44" />
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Sem aulas/sessões neste período"
          description="Ajusta o mês ou os filtros para ver outras datas."
        />
      ) : (
        <div className="space-y-3">
          {groups.map(([day, events]) => (
            <Card key={day} className="overflow-hidden p-0">
              <div className="border-b border-border bg-surface-sunken px-4 py-2 font-body text-xs font-medium text-ink-muted">
                {formatDate(day, { weekday: 'long', day: '2-digit', month: 'long' })}
              </div>
              <div className="divide-y divide-border">
                {events.map((ev) => (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => router.push(`/live-classes/${ev.liveClassId}`)}
                    className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken"
                  >
                    <span className="w-14 flex-shrink-0 font-mono text-xs text-ink-faint">
                      {formatTime(ev.start)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">{ev.title}</div>
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
                    <span className={`rounded px-2 py-0.5 font-body text-xs font-medium ${STATUS_CFG[ev.status]?.cls ?? ''}`}>
                      {STATUS_CFG[ev.status]?.label ?? ev.status}
                    </span>
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
