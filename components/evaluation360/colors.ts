// components/evaluation360/colors.ts
// Paleta e helpers visuais partilhados por todos os componentes de
// apresentação de avaliação 360º — movidos verbatim de page.tsx para que
// deixem de estar duplicados/implícitos em cada ficheiro que os usa.

export const COLORS = {
  self: '#818cf8',
  manager: '#34d399',
  peer: '#60a5fa',
  benchmark: '#f59e0b44',
  bg: '#080d19',
  surface: '#111827',
  border: '#1e2a3a',
  text: '#f1f5f9',
  muted: '#64748b',
  accent: '#6366f1',
};

export const typeColor: Record<string, string> = {
  HARD_SKILL: '#3b82f6',
  SOFT_SKILL: '#8b5cf6',
  LEADERSHIP: '#f59e0b',
  VITALITY: '#22c55e',
};

export function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

export function scoreColor(score: number): string {
  if (score >= 4.2) return '#22c55e';
  if (score >= 3.5) return '#60a5fa';
  if (score >= 2.5) return '#f59e0b';
  return '#ef4444';
}
