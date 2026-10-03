// components/processes/calendar-utils.ts
// Datas e agrupamento da aba «Calendário e Prazos» (docs/Modulo_Processes.md
// §10). Funções puras — a semana começa à segunda-feira e os dias são locais.

import type { CalendarItem } from './types';

export type CalendarMode = 'month' | 'week' | 'day' | 'timeline';

const pad = (n: number) => String(n).padStart(2, '0');

/** `YYYY-MM-DD` no fuso local (não UTC). */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function addDays(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  return r;
}

export function startOfWeek(d: Date): Date {
  const offset = (d.getDay() + 6) % 7; // segunda = 0
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -offset);
}

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const daysInMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

export interface CalendarRange {
  from: Date;
  to: Date;
  days: Date[];
}

export function rangeFor(mode: CalendarMode, anchor: Date): CalendarRange {
  let first: Date;
  let count: number;
  switch (mode) {
    case 'month':
      first = startOfWeek(startOfMonth(anchor));
      count = 42;
      break;
    case 'week':
      first = startOfWeek(anchor);
      count = 7;
      break;
    case 'day':
      first = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
      count = 1;
      break;
    case 'timeline':
      first = startOfMonth(anchor);
      count = daysInMonth(anchor);
      break;
  }
  const days = Array.from({ length: count }, (_, i) => addDays(first, i));
  const last = days[days.length - 1];
  return {
    from: first,
    to: new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59, 999),
    days,
  };
}

export function shiftAnchor(mode: CalendarMode, anchor: Date, dir: -1 | 1): Date {
  switch (mode) {
    case 'month':
    case 'timeline':
      return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
    case 'week':
      return addDays(anchor, 7 * dir);
    case 'day':
      return addDays(anchor, dir);
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function titleFor(mode: CalendarMode, anchor: Date): string {
  const fmt = (o: Intl.DateTimeFormatOptions, d = anchor) =>
    capitalize(d.toLocaleDateString('pt-PT', o));
  switch (mode) {
    case 'month':
    case 'timeline':
      return fmt({ month: 'long', year: 'numeric' });
    case 'day':
      return fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    case 'week': {
      const a = startOfWeek(anchor);
      const b = addDays(a, 6);
      return `${a.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' })} – ${b.toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  }
}

/** Agrupa por dia local do prazo; itens sem prazo ficam de fora do calendário. */
export function groupByDay(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const map = new Map<string, CalendarItem[]>();
  for (const it of items) {
    if (!it.dueAt) continue;
    const k = dayKey(new Date(it.dueAt));
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => new Date(a.dueAt as string).getTime() - new Date(b.dueAt as string).getTime());
  }
  return map;
}

export type ChipTone = 'done' | 'overdue' | 'soon' | 'normal';

export function toneOf(it: CalendarItem): ChipTone {
  if (it.status === 'COMPLETED') return 'done';
  if (it.isOverdue) return 'overdue';
  if (it.isDueSoon) return 'soon';
  return 'normal';
}

export const CHIP_CLASS: Record<ChipTone, string> = {
  done: 'bg-success-subtle text-success-ink',
  overdue: 'bg-danger-subtle text-danger-ink',
  soon: 'bg-warning-subtle text-warning-ink',
  normal: 'bg-info-subtle text-info-ink',
};

/** Valor para `<input type="datetime-local">` (fuso local). */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
