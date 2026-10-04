// components/leave/calendarUtils.ts
// Aritmética de datas do Calendário de Ausências. Tudo em UTC sobre chaves
// 'YYYY-MM-DD' — as mesmas que o backend devolve — para o dia nunca deslizar
// com o fuso horário do browser.

import { MONTH_NAMES } from './constants';
import type { CalendarEntry, CalendarView } from './types';

export const DAY_MS = 24 * 3600 * 1000;

export const parseKey = (key: string): Date => new Date(`${key}T00:00:00.000Z`);
export const keyOf = (d: Date): string => d.toISOString().slice(0, 10);
export const addDays = (d: Date, n: number): Date =>
  new Date(d.getTime() + n * DAY_MS);

export function todayKey(): string {
  const n = new Date();
  return keyOf(new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())));
}

/** Segunda = 0 … Domingo = 6. */
export const weekdayIndex = (d: Date): number => (d.getUTCDay() + 6) % 7;

export function shiftAnchor(
  view: CalendarView,
  anchor: string,
  dir: -1 | 1,
): string {
  const d = parseKey(anchor);
  switch (view) {
    case 'day':
      return keyOf(addDays(d, dir));
    case 'week':
      return keyOf(addDays(d, 7 * dir));
    case 'year':
      return keyOf(new Date(Date.UTC(d.getUTCFullYear() + dir, 0, 1)));
    default:
      return keyOf(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + dir, 1)));
  }
}

export function periodLabel(view: CalendarView, anchor: string): string {
  const d = parseKey(anchor);
  const y = d.getUTCFullYear();
  switch (view) {
    case 'day':
      return `${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]} ${y}`;
    case 'week': {
      const monday = addDays(d, -weekdayIndex(d));
      const sunday = addDays(monday, 6);
      return `${monday.getUTCDate()} ${MONTH_NAMES[monday.getUTCMonth()]} – ${sunday.getUTCDate()} ${MONTH_NAMES[sunday.getUTCMonth()]} ${sunday.getUTCFullYear()}`;
    }
    case 'year':
      return String(y);
    default:
      return `${MONTH_NAMES[d.getUTCMonth()]} ${y}`;
  }
}

/** Semanas (Seg–Dom) de um mês; células fora do mês vêm a `null`. */
export function monthMatrix(year: number, month: number): Array<Array<string | null>> {
  const first = new Date(Date.UTC(year, month, 1));
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: Array<string | null> = Array(weekdayIndex(first)).fill(null);
  for (let day = 1; day <= daysInMonth; day++)
    cells.push(keyOf(new Date(Date.UTC(year, month, day))));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: Array<Array<string | null>> = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export function weekDays(anchor: string): string[] {
  const d = parseKey(anchor);
  const monday = addDays(d, -weekdayIndex(d));
  return Array.from({ length: 7 }, (_, i) => keyOf(addDays(monday, i)));
}

export const entriesOn = (entries: CalendarEntry[], day: string): CalendarEntry[] =>
  entries.filter((e) => e.startDate <= day && e.endDate >= day);
