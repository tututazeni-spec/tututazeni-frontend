// components/evaluation360/colors.ts
// Paleta e helpers visuais partilhados pelos componentes de apresentação de
// avaliação 360º. O chrome (fundo, superfície, bordas, texto) usa os tokens
// semânticos do design system directamente nas classes/CSS vars — aqui ficam
// só as cores de série de data-viz (codificação categórica/ordinal), que são
// uma excepção documentada (ver memory project_innova_design_system_rollout_vaga3).

// Cores de série para os avaliadores (data-viz — categorical encoding)
export const COLORS = {
  self: 'rgb(129, 140, 248)', // indigo-400
  manager: 'rgb(52, 211, 153)', // emerald-400
  peer: 'rgb(96, 165, 250)', // blue-400
  benchmark: 'rgba(245, 158, 11, 0.27)',
};

// Cores para categorias de competência (data-viz exception — categorical encoding)
export const typeColor: Record<string, string> = {
  HARD_SKILL: 'rgb(59, 130, 246)', // blue-500
  SOFT_SKILL: 'rgb(139, 92, 246)', // violet-500
  LEADERSHIP: 'rgb(245, 158, 11)', // amber-500
  VITALITY: 'rgb(34, 197, 94)', // green-500
};

// Rótulos PT das categorias de competência (alinhados com
// components/competencies/constants.ts → CATEGORY_CFG)
export const typeLabel: Record<string, string> = {
  HARD_SKILL: 'Competências Técnicas',
  SOFT_SKILL: 'Competências Comportamentais',
  LEADERSHIP: 'Liderança',
  VITALITY: 'Vitalidade',
};

// Rótulos PT dos estados de um ciclo de avaliação. CycleInfo.status é uma
// string livre (vem do backend em maiúsculas/inglês) — a UI mostra sempre o
// rótulo traduzido, com fallback para o valor cru se aparecer um estado novo.
export const cycleStatusLabel: Record<string, string> = {
  DRAFT: 'Rascunho',
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em Curso',
  ACTIVE: 'Em Curso',
  COMPLETED: 'Completo',
  ARCHIVED: 'Arquivado',
  CANCELLED: 'Cancelado',
};

export function cycleStatusText(status: string): string {
  return cycleStatusLabel[status] ?? status;
}

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
