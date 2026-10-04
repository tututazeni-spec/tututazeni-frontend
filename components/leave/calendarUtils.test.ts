import { describe, expect, it } from 'vitest';
import {
  entriesOn,
  monthMatrix,
  periodLabel,
  shiftAnchor,
  weekDays,
} from './calendarUtils';
import type { CalendarEntry } from './types';

describe('calendarUtils', () => {
  it('monthMatrix alinha o dia 1 à segunda-feira e preenche semanas completas', () => {
    // 1 out 2026 é quinta-feira → 3 células vazias antes.
    const weeks = monthMatrix(2026, 9);
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3]).toBe('2026-10-01');
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });

  it('weekDays devolve segunda a domingo', () => {
    const days = weekDays('2026-10-14');
    expect(days[0]).toBe('2026-10-12');
    expect(days[6]).toBe('2026-10-18');
  });

  it('shiftAnchor avança por vista', () => {
    expect(shiftAnchor('day', '2026-10-14', 1)).toBe('2026-10-15');
    expect(shiftAnchor('week', '2026-10-14', -1)).toBe('2026-10-07');
    expect(shiftAnchor('month', '2026-10-14', 1)).toBe('2026-11-01');
    expect(shiftAnchor('year', '2026-10-14', -1)).toBe('2025-01-01');
  });

  it('periodLabel por vista', () => {
    expect(periodLabel('year', '2026-10-14')).toBe('2026');
    expect(periodLabel('month', '2026-10-14')).toBe('Out 2026');
  });

  it('entriesOn inclui os dias de início e fim', () => {
    const entry = {
      id: 'L-1',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    } as CalendarEntry;
    expect(entriesOn([entry], '2026-10-05')).toHaveLength(1);
    expect(entriesOn([entry], '2026-10-07')).toHaveLength(1);
    expect(entriesOn([entry], '2026-10-08')).toHaveLength(0);
  });
});
