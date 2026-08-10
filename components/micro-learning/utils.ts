// components/micro-learning/utils.ts
// Formatação de duração de conteúdo (segundos → "Xmin Ys"). Extraído
// de app/(platform)/micro-learning/page.tsx.

export function fmtDuration(seconds: number | null): string {
  if (!seconds) return '—';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}min ${s}s` : `${m}min`;
}
