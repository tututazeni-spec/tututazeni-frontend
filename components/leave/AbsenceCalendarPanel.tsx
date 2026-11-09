// components/leave/AbsenceCalendarPanel.tsx
// Painel do calendário de ausências, com o desenho "calendario ausencias.jpeg":
// barra lateral azul marinho (ícone, título e legenda) e, à direita, a
// navegação (setas, mês/ano, Dia/Semana/Mês/Ano) sobre a grelha em células
// suaves, com cada ausência num cartão azul com o nome do colaborador. Só
// apresenta: os dados, o período e a vista vêm de AbsenceCalendarTab.

'use client';

import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PeriodPills } from '@/components/ui/Pills';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
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
import type { AbsenceCalendarData, CalendarEntry, CalendarView } from './types';

const BLUE = '#2563EB';
const GREEN = '#16A34A';
const SIDEBAR_BG =
  'linear-gradient(170deg, #1E3A5F 0%, #0F1F3D 55%, #0A1630 100%)';

const VIEWS: Array<{ value: CalendarView; label: string }> = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

const tint = (color: string, percent: number) =>
  `color-mix(in srgb, ${color} ${percent}%, white)`;

/** Célula base: cartão branco de cantos redondos com sombra suave. */
const CELL =
  'rounded-card border border-brand/10 bg-white shadow-[0_1px_3px_rgba(15,31,61,0.08)]';

function Chip({
  entry,
  compact = false,
}: {
  entry: CalendarEntry;
  compact?: boolean;
}) {
  const color = entry.color ?? BLUE;
  const hours = entry.partial && entry.startTime && entry.endTime;
  return (
    <div
      className="break-words rounded-control px-1.5 py-1 text-micro font-semibold leading-tight text-brand"
      style={{ background: tint(color, 14), borderLeft: `3px solid ${color}` }}
      title={`${entry.userName} — ${entry.typeName}${hours ? ` (${entry.startTime}–${entry.endTime})` : ''}`}
    >
      {compact ? entry.userName : `${entry.userName} · ${entry.typeName}`}
      {hours && !compact ? ` · ${entry.startTime}–${entry.endTime}` : ''}
    </div>
  );
}

function dayFlags(data: AbsenceCalendarData, day: string) {
  const s = data.days[day];
  return {
    low: !!s?.lowCoverage,
    overlap: !!s?.overlap,
    holiday: data.holidays.find((h) => h.date === day)?.name,
  };
}

function DayHeader({
  day,
  flags,
}: {
  day: string;
  flags: ReturnType<typeof dayFlags>;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold text-brand">
        {Number(day.slice(8))}
      </span>
      <span className="flex items-center gap-1">
        {flags.overlap && (
          <Users
            size={12}
            strokeWidth={1.75}
            aria-label="Sobreposição"
            className="text-warning-ink"
          />
        )}
        {flags.low && (
          <AlertTriangle
            size={12}
            strokeWidth={1.75}
            aria-label="Cobertura insuficiente"
            className="text-danger-ink"
          />
        )}
      </span>
    </div>
  );
}

function HolidayName({ name }: { name: string }) {
  return (
    <p
      className="text-micro font-semibold leading-tight"
      style={{ color: GREEN }}
    >
      {name}
    </p>
  );
}

interface GridProps {
  data: AbsenceCalendarData;
  anchor: string;
  onPickDay: (day: string) => void;
}

function MonthGrid({ data, anchor, onPickDay }: GridProps) {
  const d = parseKey(anchor);
  const weeks = monthMatrix(d.getUTCFullYear(), d.getUTCMonth());
  const today = todayKey();
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-2">
        {WEEKDAY_SHORT.map((w) => (
          <div
            key={w}
            className="rounded-card bg-brand/[0.07] py-2 text-center font-body text-sm font-bold text-brand"
          >
            {w}
          </div>
        ))}
        {weeks.flat().map((day, i) => {
          if (!day)
            return (
              <div
                key={`b${i}`}
                className="min-h-24 rounded-card bg-white/40"
                aria-hidden
              />
            );
          const list = entriesOn(data.entries, day);
          const flags = dayFlags(data, day);
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onPickDay(day)}
              title={flags.holiday}
              className={cn(
                CELL,
                'min-h-24 space-y-1 p-2 text-left transition-shadow hover:shadow-md',
                flags.low && 'ring-1 ring-danger',
              )}
              style={isToday ? { background: tint(BLUE, 14) } : undefined}
            >
              <DayHeader day={day} flags={flags} />
              {flags.holiday && <HolidayName name={flags.holiday} />}
              {list.slice(0, 3).map((e) => (
                <Chip key={e.id} entry={e} compact />
              ))}
              {list.length > 3 && (
                <p className="text-micro font-semibold text-brand-muted">
                  +{list.length - 3} mais
                </p>
              )}
            </button>
          );
        })}
      </div>
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
              CELL,
              'min-h-40 space-y-1.5 p-2',
              flags.low && 'ring-1 ring-danger',
            )}
            style={day === today ? { background: tint(BLUE, 14) } : undefined}
          >
            <button
              type="button"
              onClick={() => onPickDay(day)}
              className="w-full text-left text-xs font-bold text-brand hover:underline"
            >
              {WEEKDAY_SHORT[i]} {formatDate(day)}
            </button>
            <DayHeader day={day} flags={flags} />
            {flags.holiday && <HolidayName name={flags.holiday} />}
            {list.length === 0 ? (
              <EmptyState variant="inline" title="Sem ausências" />
            ) : (
              list.map((e) => <Chip key={e.id} entry={e} />)
            )}
          </div>
        );
      })}
    </div>
  );
}

function DayList({
  data,
  anchor,
}: {
  data: AbsenceCalendarData;
  anchor: string;
}) {
  const list = entriesOn(data.entries, anchor);
  const flags = dayFlags(data, anchor);
  return (
    <div className="space-y-2">
      {flags.holiday && (
        <p className="text-sm font-semibold" style={{ color: GREEN }}>
          Feriado: {flags.holiday}
        </p>
      )}
      {list.length === 0 ? (
        <EmptyState variant="inline" title="Sem ausências neste dia" />
      ) : (
        <ul className="space-y-2">
          {list.map((e) => {
            const color = e.color ?? BLUE;
            return (
              <li
                key={e.id}
                className={cn(CELL, 'flex items-center gap-3 p-3 text-sm')}
                style={{ borderLeft: `4px solid ${color}` }}
              >
                <div className="flex-1">
                  <p className="font-semibold text-brand">{e.userName}</p>
                  <p className="text-xs text-brand-muted">
                    {e.department ?? '—'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand">{e.typeName}</p>
                  <p className="text-xs text-brand-muted">
                    {e.startTime && e.endTime
                      ? `${e.startTime}–${e.endTime}`
                      : `${formatDate(e.startDate)}${e.endDate !== e.startDate ? ` → ${formatDate(e.endDate)}` : ''}`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function YearGrid({ data, anchor, onPickDay }: GridProps) {
  const year = parseKey(anchor).getUTCFullYear();
  const today = todayKey();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {MONTH_NAMES.map((name, m) => (
        <div key={name} className={cn(CELL, 'p-2')}>
          <p className="mb-1 text-xs font-bold text-brand">{name}</p>
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
                      'h-6 rounded-control text-micro transition-colors',
                      absent === 0
                        ? 'bg-brand/[0.05] text-brand-muted'
                        : absent === 1
                          ? 'bg-blue-100 text-brand'
                          : 'bg-blue-600 text-white',
                      flags.holiday && 'font-bold',
                      flags.low && 'ring-1 ring-danger',
                      day === today && 'outline outline-1 outline-brand',
                    )}
                    style={
                      flags.holiday && absent === 0
                        ? { color: GREEN }
                        : undefined
                    }
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

export interface AbsenceCalendarPanelProps {
  data: AbsenceCalendarData | null | undefined;
  loading: boolean;
  view: CalendarView;
  date: string;
  onViewChange: (view: CalendarView) => void;
  onDateChange: (date: string) => void;
}

export function AbsenceCalendarPanel({
  data,
  loading,
  view,
  date,
  onViewChange,
  onDateChange,
}: AbsenceCalendarPanelProps) {
  // Legenda: os tipos presentes no período, com a cor de cada um; sem dados,
  // o rótulo genérico "Ausência" a azul. O feriado é sempre a verde.
  const types = new Map<string, string>();
  data?.entries.forEach((e) => types.set(e.typeName, e.color ?? BLUE));
  const legend: Array<{ name: string; color: string }> = [
    ...(types.size > 0
      ? [...types.entries()].map(([name, color]) => ({ name, color }))
      : [{ name: 'Ausência', color: BLUE }]),
    { name: 'Feriado', color: GREEN },
  ];
  const goTo = (day: string) => {
    onViewChange('day');
    onDateChange(day);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[24px] border border-brand/10 bg-white shadow-[0_8px_24px_rgba(15,31,61,0.12)] lg:flex-row print:shadow-none">
      <aside
        className="flex flex-col gap-4 p-5 text-white lg:w-52 lg:shrink-0"
        style={{ background: SIDEBAR_BG }}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-card border-2 border-white">
          <CalendarDays size={22} strokeWidth={1.75} />
        </span>
        <h3 className="font-display text-2xl font-bold">Ausências</h3>
        <hr className="border-white/25" />
        <ul className="space-y-3">
          {legend.map((l) => (
            <li
              key={l.name}
              className="flex items-center gap-2.5 font-body text-sm font-semibold"
            >
              <span
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: l.color }}
              />
              {l.name}
            </li>
          ))}
        </ul>
      </aside>

      <div className="min-w-0 flex-1 space-y-4 bg-surface-sunken p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <IconButton
              icon={ChevronLeft}
              label="Período anterior"
              intent="ghost"
              className="rounded-full border border-brand/15 bg-white shadow-sm"
              onClick={() => onDateChange(shiftAnchor(view, date, -1))}
            />
            <h3 className="font-display text-xl font-bold text-brand">
              {periodLabel(view, date)}
            </h3>
            <IconButton
              icon={ChevronRight}
              label="Período seguinte"
              intent="ghost"
              className="rounded-full border border-brand/15 bg-white shadow-sm"
              onClick={() => onDateChange(shiftAnchor(view, date, 1))}
            />
            <Button
              intent="ghost"
              size="sm"
              onClick={() => onDateChange(todayKey())}
            >
              Hoje
            </Button>
          </div>
          <PeriodPills
            label="Vista do calendário"
            options={VIEWS}
            value={view}
            onChange={onViewChange}
          />
        </div>

        {loading && !data ? (
          <Skeleton
            rows={5}
            wrapperClassName="space-y-2"
            itemClassName="h-16 bg-white rounded-card"
          />
        ) : data ? (
          <>
            {view === 'month' && (
              <MonthGrid data={data} anchor={date} onPickDay={goTo} />
            )}
            {view === 'week' && (
              <WeekGrid data={data} anchor={date} onPickDay={goTo} />
            )}
            {view === 'day' && <DayList data={data} anchor={date} />}
            {view === 'year' && (
              <YearGrid data={data} anchor={date} onPickDay={goTo} />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
