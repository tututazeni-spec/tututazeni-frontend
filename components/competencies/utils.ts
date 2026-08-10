// components/competencies/utils.ts
// Mapeamento de nível de competência para cor (matriz/barra). Extraído
// de app/(platform)/competencies/page.tsx.

export function levelColor(level: number, max = 5): string {
  const pct = level / max;
  if (pct === 0) return 'bg-gray-100 text-gray-400';
  if (pct <= 0.25) return 'bg-red-100 text-red-700';
  if (pct <= 0.5) return 'bg-amber-100 text-amber-700';
  if (pct <= 0.75) return 'bg-blue-100 text-blue-700';
  return 'bg-emerald-100 text-emerald-700';
}

export function levelBarColor(level: number): string {
  if (level === 0) return 'bg-gray-200';
  if (level === 1) return 'bg-red-400';
  if (level === 2) return 'bg-amber-400';
  if (level === 3) return 'bg-blue-400';
  if (level === 4) return 'bg-emerald-400';
  return 'bg-emerald-600';
}
