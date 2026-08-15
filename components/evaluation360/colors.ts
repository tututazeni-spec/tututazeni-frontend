// components/evaluation360/colors.ts
// Paleta e helpers visuais partilhados por todos os componentes de
// apresentação de avaliação 360º. Migrado para CSS variables e semantic tokens.

// CSS variables referencing do módulo (dark theme para 360)
export const COLORS = {
  self: 'rgb(129, 140, 248)', // indigo-400
  manager: 'rgb(52, 211, 153)', // emerald-400
  peer: 'rgb(96, 165, 250)', // blue-400
  benchmark: 'rgba(245, 158, 11, 0.27)',
  bg: 'rgb(8, 13, 25)', // slate-950
  surface: 'rgb(17, 24, 39)', // slate-900
  border: 'rgb(30, 42, 58)', // slate-800
  text: 'rgb(241, 245, 249)', // slate-100
  muted: 'rgb(100, 116, 139)', // slate-500
  accent: 'rgb(99, 102, 241)', // indigo-500
};

// Cores para categorias de competência (data-viz exception — categorical encoding)
export const typeColor: Record<string, string> = {
  HARD_SKILL: 'rgb(59, 130, 246)', // blue-500
  SOFT_SKILL: 'rgb(139, 92, 246)', // violet-500
  LEADERSHIP: 'rgb(245, 158, 11)', // amber-500
  VITALITY: 'rgb(34, 197, 94)', // green-500
};

export function timeAgo(iso: string): string {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

// Função scoreColor: ordinal scale (higher = better)
// Mapeamento semântico: danger < warning < primary < success
export function scoreColor(score: number): string {
  if (score >= 4.2) return 'rgb(34, 197, 94)'; // success — green
  if (score >= 3.5) return 'rgb(96, 165, 250)'; // info — blue
  if (score >= 2.5) return 'rgb(245, 158, 11)'; // warning — amber
  return 'rgb(239, 68, 68)'; // danger — red
}
