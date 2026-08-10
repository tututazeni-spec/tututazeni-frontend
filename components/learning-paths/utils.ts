// components/learning-paths/utils.ts
// Formatação de horas e verificação de prazo expirado. Extraído de
// app/(platform)/learning-paths/page.tsx.

export function fmtHours(h: number): string {
  if (!h) return '—';
  return h < 1 ? `${h * 60}min` : `${h}h`;
}

export function isOverdue(deadline: string | null): boolean {
  return !!deadline && new Date() > new Date(deadline);
}
