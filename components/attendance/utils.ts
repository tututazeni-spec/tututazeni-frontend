// components/attendance/utils.ts
// Formatação de minutos em "Xh Ym". Extraído de
// app/(platform)/attendance/page.tsx.

export function MinutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m > 0 ? ` ${m}m` : ''}`;
}
