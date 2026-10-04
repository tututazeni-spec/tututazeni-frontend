// components/leave/AbsenceCalendarTab.tsx
// Separador "Calendário de Ausências" (docs/Modulo_Leave.md §6) — férias,
// licenças e ausências validadas em vista diária, semanal, mensal e anual,
// com filtros, cobertura por departamento, sobreposições, exportação e
// impressão. A privacidade é aplicada no backend: quem não é o titular nem o
// RH vê só "Férias" ou "Indisponível" e o período, nunca o motivo.

'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  Users,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDepartmentOptions } from '@/components/competencies/modelFormData';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useAbsenceCalendar, type CalendarFilters } from '@/hooks/useLeave';
import { apiClient } from '@/lib/apiClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useToast } from '@/providers/ToastProvider';
import { MONTH_NAMES, WEEKDAY_SHORT } from './constants';
import {
  entriesOn,
  monthMatrix,
  parseKey,
  periodLabel,
  shiftAnchor,
  todayKey,
  weekDays,
} from './calendarUtils';
import { downloadCsv } from './downloadCsv';
import { CAN_PICK_EMPLOYEE_ABSENCE, useEmployeeOptions } from './useEmployeeOptions';
import type {
  AbsenceCalendarData,
  CalendarEntry,
  CalendarView,
  CsvExport,
  LeaveType,
} from './types';

const ALL = 'ALL';
const VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

function Chip({ entry, compact = false }: { entry: CalendarEntry; compact?: boolean }) {
  const hours = entry.partial && entry.startTime && entry.endTime;
  return (
    <div
      className="truncate rounded-control bg-surface-sunken px-1.5 py-0.5 text-xs text-ink"
      style={{ borderLeft: `3px solid ${entry.color ?? 'var(--color-primary, #1d4ed8)'}` }}
      title={`${entry.userName} — ${entry.typeName}${hours ? ` (${entry.startTime}–${entry.endTime})` : ''}`}
    >
      {compact ? entry.userName : `${entry.userName} · ${entry.typeName}`}
      {hours && !compact ? ` · ${entry.startTime}–${entry.endTime}` : ''}
    </div>
  );
}

interface GridProps {
  data: AbsenceCalendarData;
  anchor: string;
  onPickDay: (day: string) => void;
}

function dayFlags(data: AbsenceCalendarData, day: string) {
  const s = data.days[day];
  return {
    low: !!s?.lowCoverage,
    overlap: !!s?.overlap,
    holiday: data.holidays.find((h) => h.date === day)?.name,
  };
}

function DayHeader({ day, flags }: { day: string; flags: ReturnType<typeof dayFlags> }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className={cn('font-semibold', flags.holiday ? 'text-danger-ink' : 'text-ink')}>
        {Number(day.slice(8))}
      </span>
      <span className="flex items-center gap-1">
        {flags.overlap && (
          <Users size={11} strokeWidth={1.75} aria-label="Sobreposição" className="text-warning-ink" />
        )}
        {flags.low && (
          <AlertTriangle size={11} strokeWidth={1.75} aria-label="Cobertura insuficiente" className="text-danger-ink" />
        )}
      </span>
    </div>
  );
}

function MonthGrid({ data, anchor, onPickDay }: GridProps) {
  const d = parseKey(anchor);
  const weeks = monthMatrix(d.getUTCFullYear(), d.getUTCMonth());
  const today = todayKey();
  return (
    <div className="grid grid-cols-7 gap-1">
      {WEEKDAY_SHORT.map((w) => (
        <div key={w} className="px-1 py-1 text-xs font-medium text-ink-faint">
          {w}
        </div>
      ))}
      {weeks.flat().map((day, i) => {
        if (!day) return <div key={`b${i}`} className="min-h-24 rounded-control bg-surface-sunken/40" />;
        const list = entriesOn(data.entries, day);
        const flags = dayFlags(data, day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => onPickDay(day)}
            title={flags.holiday}
            className={cn(
              'min-h-24 space-y-1 rounded-control border bg-surface p-1.5 text-left transition-colors hover:bg-surface-sunken',
              day === today ? 'border-primary' : 'border-border',
              flags.low && 'ring-1 ring-danger',
            )}
          >
            <DayHeader day={day} flags={flags} />
            {flags.holiday && (
              <p className="truncate text-[10px] text-danger-ink">{flags.holiday}</p>
            )}
            {list.slice(0, 3).map((e) => (
              <Chip key={e.id} entry={e} compact />
            ))}
            {list.length > 3 && (
              <p className="text-[10px] text-ink-faint">+{list.length - 3} mais</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

function WeekGrid({ data, anchor, onPickDay }: GridProps) {
  const today = todayKey();
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
      {weekDays(anchor).map((day, i) => {
        const list = entriesOn(data.entries, day);
        const flags = dayFlags(data, day);
        return (
          <div
            key={day}
            className={cn(
              'min-h-40 space-y-1 rounded-control border bg-surface p-2',
              day === today ? 'border-primary' : 'border-border',
              flags.low && 'ring-1 ring-danger',
            )}
          >
            <button
              type="button"
              onClick={() => onPickDay(day)}
              className="w-full text-left text-xs font-medium text-ink-muted hover:text-ink"
            >
              {WEEKDAY_SHORT[i]} {formatDate(day)}
            </button>
            <DayHeader day={day} flags={flags} />
            {flags.holiday && <p className="text-[10px] text-danger-ink">{flags.holiday}</p>}
            {list.length === 0 ? (
              <p className="text-[10px] text-ink-faint">Sem ausências</p>
            ) : (
              list.map((e) => <Chip key={e.id} entry={e} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayList({ data, anchor }: { data: AbsenceCalendarData; anchor: string }) {
  const list = entriesOn(data.entries, anchor);
  const flags = dayFlags(data, anchor);
  return (
    <div className="space-y-2">
      {flags.holiday && <p className="text-sm text-danger-ink">Feriado: {flags.holiday}</p>}
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink-faint">Sem ausências neste dia.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((e) => (
            <li key={e.id} className="flex items-center gap-3 rounded-control border border-border bg-surface p-2 text-sm">
              <span
                aria-hidden
                className="h-8 w-1 rounded-full"
                style={{ backgroundColor: e.color ?? 'var(--color-primary, #1d4ed8)' }}
              />
              <div className="flex-1">
                <p className="font-medium text-ink">{e.userName}</p>
                <p className="text-xs text-ink-faint">{e.department ?? '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-ink">{e.typeName}</p>
                <p className="text-xs text-ink-faint">
                  {e.startTime && e.endTime
                    ? `${e.startTime}–${e.endTime}`
                    : `${formatDate(e.startDate)}${e.endDate !== e.startDate ? ` → ${formatDate(e.endDate)}` : ''}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function YearGrid({ data, anchor, onPickDay }: GridProps) {
  const year = parseKey(anchor).getUTCFullYear();
  const today = todayKey();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTH_NAMES.map((name, m) => (
        <div key={name}>
          <p className="mb-1 text-xs font-semibold text-ink-muted">{name}</p>
          <div className="grid grid-cols-7 gap-0.5">
            {monthMatrix(year, m)
              .flat()
              .map((day, i) => {
                if (!day) return <div key={`b${i}`} className="h-6" />;
                const absent = data.days[day]?.absent ?? 0;
                const flags = dayFlags(data, day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => onPickDay(day)}
                    title={`${formatDate(day)} — ${absent} ausente(s)${flags.holiday ? ` · ${flags.holiday}` : ''}`}
                    className={cn(
                      'h-6 rounded-sm text-[10px] transition-colors',
                      absent === 0
                        ? 'bg-surface-sunken text-ink-faint'
                        : absent === 1
                          ? 'bg-primary-subtle text-ink'
                          : 'bg-primary text-canvas',
                      flags.holiday && 'text-danger-ink',
                      flags.low && 'ring-1 ring-danger',
                      day === today && 'outline outline-1 outline-primary',
                    )}
                  >
                    {Number(day.slice(8))}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

export interface AbsenceCalendarTabProps {
  leaveTypes: LeaveType[];
}

export function AbsenceCalendarTab({ leaveTypes }: AbsenceCalendarTabProps) {
  const role = useCurrentRole();
  const notify = useToast();
  const isReviewer = !!role && CAN_PICK_EMPLOYEE_ABSENCE.includes(role);
  const [filters, setFilters] = useState<CalendarFilters>({
    view: 'month',
    date: todayKey(),
    unitId: '',
    departmentId: '',
    managerId: '',
    userId: '',
    leaveTypeCode: '',
  });
  const { data, loading } = useAbsenceCalendar(filters);
  const departments = useDepartmentOptions();
  const people = useEmployeeOptions('leave-calendar', isReviewer);

  const set = (patch: Partial<CalendarFilters>) =>
    setFilters((f) => ({ ...f, ...patch }));
  const pick = (v: string) => (v === ALL ? '' : v);
  const goTo = (day: string) => set({ view: 'day', date: day });

  const exportCsv = useApiMutation(
    () =>
      apiClient.get<CsvExport>('/leave/absence-calendar/export', {
        params: { ...filters },
      }),
    {
      onSuccess: (r) => downloadCsv(r.filename, r.content),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const legend = new Map<string, string | null>();
  data?.entries.forEach((e) => legend.set(e.typeName, e.color));
  const nameById = new Map(data?.entries.map((e) => [e.userId, e.userName]));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-ink">Calendário de Ausências</h2>
          <p className="text-xs text-ink-faint">
            Férias, licenças e ausências validadas. O motivo nunca é mostrado;
            fora do RH, só aparece «Férias» ou «Indisponível».
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button intent="ghost" onClick={() => window.print()}>
            <Printer size={15} strokeWidth={1.75} /> Imprimir
          </Button>
          {(data?.canExport ?? isReviewer) && (
            <Button
              intent="secondary"
              loading={exportCsv.isPending}
              onClick={() => exportCsv.mutate(undefined)}
            >
              <Download size={15} strokeWidth={1.75} /> Exportar
            </Button>
          )}
        </div>
      </div>

      <Card className="p-4 print:hidden">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Select
            className="w-full"
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: pick(v) })}
            items={[{ value: ALL, label: 'Todos os departamentos' }, ...departments.options]}
          />
          {isReviewer && (
            <>
              <Select
                className="w-full"
                value={filters.managerId || ALL}
                onValueChange={(v) => set({ managerId: pick(v) })}
                items={[{ value: ALL, label: 'Todas as equipas' }, ...people]}
              />
              <Select
                className="w-full"
                value={filters.userId || ALL}
                onValueChange={(v) => set({ userId: pick(v) })}
                items={[{ value: ALL, label: 'Todos os colaboradores' }, ...people]}
              />
            </>
          )}
          <Select
            className="w-full"
            value={filters.leaveTypeCode || ALL}
            onValueChange={(v) => set({ leaveTypeCode: pick(v) })}
            items={[
              { value: ALL, label: 'Todos os tipos' },
              ...leaveTypes.map((t) => ({ value: t.code, label: t.name })),
            ]}
          />
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-1">
          <IconButton
            icon={ChevronLeft}
            label="Período anterior"
            intent="ghost"
            onClick={() => set({ date: shiftAnchor(filters.view, filters.date, -1) })}
          />
          <Button intent="ghost" onClick={() => set({ date: todayKey() })}>
            Hoje
          </Button>
          <IconButton
            icon={ChevronRight}
            label="Período seguinte"
            intent="ghost"
            onClick={() => set({ date: shiftAnchor(filters.view, filters.date, 1) })}
          />
          <span className="ml-2 text-sm font-semibold text-ink">
            {periodLabel(filters.view, filters.date)}
          </span>
        </div>
        <div className="flex gap-1 rounded-panel border border-border bg-surface p-1">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => set({ view: v.value })}
              className={cn(
                'rounded-control px-3 py-1 text-sm font-medium transition-colors',
                filters.view === v.value
                  ? 'bg-primary text-canvas'
                  : 'text-ink-muted hover:bg-surface-sunken hover:text-ink',
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-16 bg-surface-sunken rounded-control"
        />
      ) : data ? (
        <>
          {filters.view === 'month' && (
            <MonthGrid data={data} anchor={filters.date} onPickDay={goTo} />
          )}
          {filters.view === 'week' && (
            <WeekGrid data={data} anchor={filters.date} onPickDay={goTo} />
          )}
          {filters.view === 'day' && <DayList data={data} anchor={filters.date} />}
          {filters.view === 'year' && (
            <YearGrid data={data} anchor={filters.date} onPickDay={goTo} />
          )}

          {legend.size > 0 && (
            <ul className="flex flex-wrap gap-3 text-xs text-ink-muted">
              {[...legend.entries()].map(([name, color]) => (
                <li key={name} className="flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: color ?? 'var(--color-primary, #1d4ed8)' }}
                  />
                  {name}
                </li>
              ))}
            </ul>
          )}

          {(data.alerts.length > 0 || data.overlaps.length > 0) && (
            <div className="grid gap-4 md:grid-cols-2">
              {data.alerts.length > 0 && (
                <Card className="p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                    <AlertTriangle size={14} strokeWidth={1.75} className="text-danger-ink" />
                    Cobertura insuficiente
                  </h3>
                  <ul className="space-y-1 text-sm text-ink-muted">
                    {data.alerts.slice(0, 15).map((a, i) => (
                      <li key={`${a.date}-${a.departmentId}-${i}`}>
                        {formatDate(a.date)} · {a.department ?? 'Sem departamento'}:{' '}
                        {a.absent} de {a.headcount} ausentes — disponibilidade{' '}
                        <strong className="text-ink">{a.availabilityPercent}%</strong>{' '}
                        (mínimo {a.minAvailabilityPercent}%)
                      </li>
                    ))}
                  </ul>
                  {data.alerts.length > 15 && (
                    <p className="mt-1 text-xs text-ink-faint">
                      +{data.alerts.length - 15} dia(s) com alerta.
                    </p>
                  )}
                </Card>
              )}
              {data.overlaps.length > 0 && (
                <Card className="p-4">
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
                    <Users size={14} strokeWidth={1.75} className="text-warning-ink" />
                    Sobreposição de ausências
                  </h3>
                  <ul className="space-y-1 text-sm text-ink-muted">
                    {data.overlaps.slice(0, 15).map((o, i) => (
                      <li key={`${o.date}-${o.departmentId}-${i}`}>
                        {formatDate(o.date)} · {o.department ?? 'Sem departamento'}:{' '}
                        {o.userIds.map((id) => nameById.get(id) ?? `#${id}`).join(', ')}
                      </li>
                    ))}
                  </ul>
                  {data.overlaps.length > 15 && (
                    <p className="mt-1 text-xs text-ink-faint">
                      +{data.overlaps.length - 15} dia(s) com sobreposição.
                    </p>
                  )}
                </Card>
              )}
            </div>
          )}
          <p className="text-xs text-ink-faint">
            Cobertura calculada sobre dias úteis (sem fins de semana nem
            feriados). O limite de ausência vem da política de cada
            departamento; o sistema avisa mas não recusa pedidos.
          </p>
        </>
      ) : null}
    </div>
  );
}
