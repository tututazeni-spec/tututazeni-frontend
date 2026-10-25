// components/knowledge/utils.ts
// Formatação de "há X dias". Extraído de
// app/(platform)/knowledge/page.tsx.

import { daysAgo } from '@/lib/format';

/** "hoje" / "ontem" / "há N dias" até uma semana; depois a data. */
export function timeAgo(d: string): string {
  return daysAgo(d, { maxDays: 7 });
}
