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
// Espelha Eval360CycleStatus (prisma/schema.prisma): DRAFT, PUBLISHED,
// IN_PROGRESS, PROCESSING, COMPLETED, CANCELLED.
export const cycleStatusLabel: Record<string, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Agendada',
  IN_PROGRESS: 'Em andamento',
  PROCESSING: 'Em análise',
  COMPLETED: 'Concluída',
  CANCELLED: 'Arquivada',
};

export function cycleStatusText(status: string): string {
  return cycleStatusLabel[status] ?? status;
}

// Estados apresentáveis pedidos em docs/evaluation360.md §2 (Rascunho,
// Agendada, Aberta, Em andamento, Encerrada, Em análise, Concluída,
// Arquivada) — mais granulares que os 6 valores reais do enum: "Agendada"
// vs. "Aberta" e "Em andamento" vs. "Encerrada" distinguem-se pelas datas do
// ciclo, não por um valor de BD próprio (evita inflacionar o enum por uma
// diferença puramente de apresentação).
export function cycleStatusDisplay(
  status: string,
  startDate: string,
  endDate: string,
): string {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (status === 'PUBLISHED') return now < start ? 'Agendada' : 'Aberta';
  if (status === 'IN_PROGRESS') return now > end ? 'Encerrada' : 'Em andamento';
  return cycleStatusLabel[status] ?? status;
}

// Estados de CycleParticipant (aba "Avaliados", docs/evaluation360.md §4).
export const participantStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
};

// Estados de EvaluatorAssignment (aba "Avaliadores", docs/evaluation360.md
// §5). O documento pede 6 estados ("Iniciado" e "Em preenchimento"
// separados) mas o schema só distingue 5 (EvaluatorAssignmentStatus) — os
// dois colapsam em IN_PROGRESS, mesmo padrão de cycleStatusDisplay acima.
export const evaluatorAssignmentStatusLabel: Record<string, string> = {
  PENDING: 'Pendente',
  INVITED: 'Convite enviado',
  IN_PROGRESS: 'Em preenchimento',
  COMPLETED: 'Concluído',
  EXPIRED: 'Expirado',
};

// Tipos de avaliador (EvaluatorRole) — o documento pede 7 (Próprio, Gestor,
// Par, Subordinado, Cliente, Parceiro, Outro), o schema só modela 5; os
// últimos 3 (Cliente/Parceiro/Outro) colapsam em EXTERNAL, atribuível
// manualmente mas sem fluxo de sugestão automática (buildEvaluatorSuggestions
// só sugere SELF/MANAGER/PEER/SUBORDINATE).
export const evaluatorRoleLabel: Record<string, string> = {
  SELF: 'Próprio (Autoavaliação)',
  MANAGER: 'Gestor',
  PEER: 'Par',
  SUBORDINATE: 'Subordinado',
  EXTERNAL: 'Externo (cliente/parceiro/outro)',
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
