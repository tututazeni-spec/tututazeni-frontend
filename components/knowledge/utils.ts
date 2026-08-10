// components/knowledge/utils.ts
// Formatação de "há X dias". Extraído de
// app/(platform)/knowledge/page.tsx.

import { formatDate as fmtDate } from '@/lib/format';

export function timeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 7) return `há ${days} dias`;
  return fmtDate(d);
}
