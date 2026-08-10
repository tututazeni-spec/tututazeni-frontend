// components/trainings/utils.ts
// Formatação de data e de horas de carga horária. Extraído de
// app/(platform)/trainings/page.tsx.

import { formatDateTime } from '@/lib/format';

// fmtDate mostra data+hora (mantido com este nome nos vários usos abaixo).
export const fmtDate = (d: string | null) =>
  formatDateTime(d, { year: 'numeric' });

export function fmtHours(h: number | null) {
  if (!h) return '—';
  return h < 1 ? `${h * 60}min` : `${h}h`;
}
