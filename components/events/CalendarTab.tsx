// components/events/CalendarTab.tsx
// Separador "Calendário" (docs/events.md ponto 3) — calendário central de
// eventos. 4 visualizações (Mês/Semana/Dia/Agenda) sobre o mesmo endpoint
// GET /events/calendar (intervalo de datas calculado aqui, conforme a
// visualização activa — mesmo padrão de components/live-classes/
// CalendarView.tsx, estendido com semana/dia e os filtros do spec (unidade,
// departamento, tipo, responsável, local, estado). Clicar num evento abre o
// DetailView já existente, tal como a aba "Eventos".

'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate, formatTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { STATUS_CFG, TYPE_CFG } from './constants';
import { DetailView } from './DetailView';
import { useDepartmentOptions, useUnitOptions } from './eventFormData';
import type { EventCalendarItem } from './types';

type View = 'month' | 'week' | 'day' | 'agenda';

const VIEW_ITEMS: Array<{ value: View; label: string }> = [
  { value: 'month', label: 'Mês' },
  { value: 'week', label: 'Semana' },
  { value: 'day', label: 'Dia' },
  { value: 'agenda', label: 'Agenda' },
];

const TYPE_ITEMS = [
  { value: 'ALL', label: 'Todos os tipos' },
  ...Object.entries(TYPE_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  ...Object.entries(STATUS_CFG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(d.getDate() + n);
  return r;
}
// Semana começa à Segunda — só afecta o alinhamento da grelha.
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const r = addDays(d, diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfWeek(d: Date) {
  const r = addDays(startOfWeek(d), 6);
  r.setHours(23, 59, 59, 999);
  return r;
}
function startOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}
function endOfDay(d: Date) {
  const r = new Date(d);
  r.setHours(23, 59, 59, 999);
  return r;
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}
function isSameDay(a: Date, b: Date) {
  return dayKey(a) === dayKey(b);
}

export function CalendarTab() {
  const [view, setView] = useState<View>('month');
  const [anchor, setAnchor] = useState(() => new Date());
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('ALL');
  const [unitId, setUnitId] = useState('ALL');
  const [location, setLocation] = useState('');
  const debouncedLocation = useDebounce(location);
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { options: departmentOptions } = useDepartmentOptions();
  const { options: unitOptions } = useUnitOptions();

  const range = useMemo(() => {
    if (view === 'week') return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
    if (view === 'day') return { from: startOfDay(anchor), to: endOfDay(anchor) };
    // month + agenda partilham o mesmo intervalo (grelha completa do mês).
    return { from: startOfWeek(startOfMonth(anchor)), to: endOfWeek(endOfMonth(anchor)) };
  }, [view, anchor]);

  const params = {
    from: range.from.toISOString(),
    to: range.to.toISOString(),
    type: type === 'ALL' ? undefined : type,
    status: status === 'ALL' ? undefined : status,
    departmentId: departmentId === 'ALL' ? undefined : departmentId,
    unitId: unitId === 'ALL' ? undefined : unitId,
    responsibleId: responsible ? responsible.id : undefined,
    location: debouncedLocation || undefined,
  };

  const { data, isLoading } = useApiQuery<EventCalendarItem[]>(
    queryKeys.events.calendar(params),
    '/events/calendar',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const byDay = useMemo(() => {
    const map = new Map<string, EventCalendarItem[]>();
    for (const ev of data ?? []) {
      const key = dayKey(new Date(ev.startAt));
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    return map;
  }, [data]);

  function step(delta: number) {
    setAnchor((d) => {
      if (view === 'month' || view === 'agenda') return new Date(d.getFullYear(), d.getMonth() + delta, 1);
      if (view === 'week') return addDays(d, delta * 7);
      return addDays(d, delta);
    });
  }

  const headerLabel =
    view === 'day'
      ? formatDate(anchor, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : view === 'week'
        ? `${formatDate(startOfWeek(anchor))} – ${formatDate(endOfWeek(anchor))}`
        : anchor.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' });

  if (detailId !== null) {
    return <DetailView eventId={detailId} onBack={() => setDetailId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button intent="ghost" size="sm" onClick={() => step(-1)} aria-label="Anterior">
            <ChevronLeft size={16} strokeWidth={1.75} />
          </Button>
          <span className="min-w-[160px] text-center font-body text-sm font-medium capitalize text-ink">
            {headerLabel}
          </span>
          <Button intent="ghost" size="sm" onClick={() => step(1)} aria-label="Seguinte">
            <ChevronRight size={16} strokeWidth={1.75} />
          </Button>
          <Button intent="ghost" size="sm" onClick={() => setAnchor(new Date())}>
            Hoje
          </Button>
        </div>
        <div className="flex gap-1 rounded-card bg-surface-sunken p-1">
          {VIEW_ITEMS.map((v) => (
            <Button
              key={v.value}
              size="sm"
              intent={view === v.value ? 'primary' : 'ghost'}
              onClick={() => setView(v.value)}
            >
              {v.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Select items={TYPE_ITEMS} value={type} onValueChange={setType} />
        <Select items={STATUS_ITEMS} value={status} onValueChange={setStatus} />
        <Select
          items={[{ value: 'ALL', label: 'Todos os departamentos' }, ...departmentOptions]}
          value={departmentId}
          onValueChange={setDepartmentId}
        />
        <Select
          items={[{ value: 'ALL', label: 'Todas as unidades' }, ...unitOptions]}
          value={unitId}
          onValueChange={setUnitId}
        />
        <Input
          placeholder="Local…"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-36"
        />
        <div className="w-56">
          <DepartmentUserPicker label="Responsável" htmlFor="cal-responsible" value={responsible} onChange={setResponsible} />
        </div>
      </div>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : view === 'month' ? (
        <MonthGrid anchor={anchor} range={range} byDay={byDay} onSelect={setDetailId} />
      ) : view === 'week' ? (
        <WeekList range={range} byDay={byDay} onSelect={setDetailId} />
      ) : view === 'day' ? (
        <DayList day={anchor} events={byDay.get(dayKey(anchor)) ?? []} onSelect={setDetailId} />
      ) : (
        <AgendaList byDay={byDay} onSelect={setDetailId} />
      )}
    </div>
  );
}

function EventChip({ ev, onSelect }: { ev: EventCalendarItem; onSelect: (id: number) => void }) {
  const typeCfg = TYPE_CFG[ev.type] ?? TYPE_CFG.CORPORATE;
  return (
    <button
      type="button"
      onClick={() => onSelect(ev.id)}
      className={cn(
        'flex w-full items-center gap-1 truncate rounded px-1.5 py-0.5 text-left font-body text-[11px]',
        typeCfg.cls,
      )}
      title={ev.title}
    >
      <span className="font-mono">{formatTime(ev.startAt)}</span>
      <span className="truncate">{ev.title}</span>
    </button>
  );
}

function MonthGrid({
  anchor,
  range,
  byDay,
  onSelect,
}: {
  anchor: Date;
  range: { from: Date; to: Date };
  byDay: Map<string, EventCalendarItem[]>;
  onSelect: (id: number) => void;
}) {
  const cells = useMemo(() => {
    const days: Date[] = [];
    let d = new Date(range.from);
    while (d <= range.to) {
      days.push(new Date(d));
      d = addDays(d, 1);
    }
    return days;
  }, [range]);
  const today = new Date();
  const WEEKDAY_LABELS = cells
    .slice(0, 7)
    .map((d) => d.toLocaleDateString('pt-AO', { weekday: 'short' }));

  return (
    <Card className="overflow-hidden p-0">
      <div className="grid grid-cols-7 border-b border-border bg-surface-sunken">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="px-2 py-1.5 text-center font-body text-xs font-medium capitalize text-ink-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day) => {
          const events = byDay.get(dayKey(day)) ?? [];
          const inMonth = day.getMonth() === anchor.getMonth();
          const visible = events.slice(0, 3);
          const overflow = events.length - visible.length;
          return (
            <div
              key={dayKey(day)}
              className={cn(
                'min-h-[92px] space-y-0.5 border-b border-r border-border p-1',
                !inMonth && 'bg-surface-sunken/40',
              )}
            >
              <div
                className={cn(
                  'mb-0.5 font-body text-xs',
                  isSameDay(day, today) ? 'font-bold text-primary' : inMonth ? 'text-ink-muted' : 'text-ink-faint',
                )}
              >
                {day.getDate()}
              </div>
              {visible.map((ev) => (
                <EventChip key={ev.id} ev={ev} onSelect={onSelect} />
              ))}
              {overflow > 0 && (
                <div className="px-1 font-body text-[11px] text-ink-faint">+{overflow} mais</div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function DayEventRow({ ev, onSelect }: { ev: EventCalendarItem; onSelect: (id: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ev.id)}
      className="flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left hover:bg-surface-sunken"
    >
      <span className="w-14 shrink-0 font-mono text-xs text-ink-faint">{formatTime(ev.startAt)}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-ink">{ev.title}</div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          {ev.location && <span>{ev.location}</span>}
          {ev.responsible && <span>{ev.responsible.fullName}</span>}
          <span>{ev.participants} inscrito{ev.participants === 1 ? '' : 's'}</span>
        </div>
      </div>
      <span className={cn('rounded px-2 py-0.5 font-body text-xs font-medium', TYPE_CFG[ev.type]?.cls)}>
        {TYPE_CFG[ev.type]?.label ?? ev.type}
      </span>
      <StatusBadge value={ev.status} map={STATUS_CFG} />
    </button>
  );
}

function WeekList({
  range,
  byDay,
  onSelect,
}: {
  range: { from: Date; to: Date };
  byDay: Map<string, EventCalendarItem[]>;
  onSelect: (id: number) => void;
}) {
  const days = useMemo(() => {
    const arr: Date[] = [];
    let d = new Date(range.from);
    for (let i = 0; i < 7; i++) {
      arr.push(new Date(d));
      d = addDays(d, 1);
    }
    return arr;
  }, [range]);

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const events = byDay.get(dayKey(day)) ?? [];
        return (
          <Card key={dayKey(day)} className="overflow-hidden p-0">
            <div className="border-b border-border bg-surface-sunken px-4 py-2 font-body text-xs font-medium capitalize text-ink-muted">
              {formatDate(day, { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
            {events.length === 0 ? (
              <div className="px-4 py-4 font-body text-xs text-ink-faint">Sem eventos</div>
            ) : (
              <div className="divide-y divide-border">
                {events.map((ev) => (
                  <DayEventRow key={ev.id} ev={ev} onSelect={onSelect} />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function DayList({
  day,
  events,
  onSelect,
}: {
  day: Date;
  events: EventCalendarItem[];
  onSelect: (id: number) => void;
}) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="Sem eventos neste dia"
        description="Ajusta a data ou os filtros para ver outros eventos."
      />
    );
  }
  return (
    <Card className="divide-y divide-border overflow-hidden p-0">
      {events.map((ev) => (
        <DayEventRow key={ev.id} ev={ev} onSelect={onSelect} />
      ))}
    </Card>
  );
}

function AgendaList({
  byDay,
  onSelect,
}: {
  byDay: Map<string, EventCalendarItem[]>;
  onSelect: (id: number) => void;
}) {
  const groups = useMemo(() => [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)), [byDay]);

  if (groups.length === 0) {
    return (
      <EmptyState
        title="Sem eventos neste período"
        description="Ajusta o mês ou os filtros para ver outras datas."
      />
    );
  }

  return (
    <div className="space-y-3">
      {groups.map(([day, events]) => (
        <Card key={day} className="overflow-hidden p-0">
          <div className="border-b border-border bg-surface-sunken px-4 py-2 font-body text-xs font-medium capitalize text-ink-muted">
            {formatDate(day, { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
          <div className="divide-y divide-border">
            {events.map((ev) => (
              <DayEventRow key={ev.id} ev={ev} onSelect={onSelect} />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
