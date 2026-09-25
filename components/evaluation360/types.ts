// components/evaluation360/types.ts
// Tipos do domínio "avaliação 360º". Usados por hooks/useEvaluation360.ts
// (dono dos dados reais — GET /evaluation360/*, ver esse ficheiro) e pelos
// componentes de apresentação em components/evaluation360/ (Evaluation360View,
// OverviewTab, RadarChart, CompetencyHeatmap, FeedbackTab,
// EvaluationFormTab) — page.tsx é só o container que liga o hook à
// Evaluation360View. Ver memory project_innova_component_separation_audit.

export type EvaluatorRole = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE' | 'EXTERNAL';
export type AlertType = 'STRENGTH' | 'GAP' | 'INFO';
export type TabId =
  | 'overview'
  | 'adminOverview'
  | 'radar'
  | 'competencies'
  | 'feedback'
  | 'cycles'
  | 'selfassessment'
  | 'form';

export interface CompetencyScore {
  id: string;
  name: string;
  category: string;
  type: 'HARD_SKILL' | 'SOFT_SKILL' | 'LEADERSHIP' | 'VITALITY';
  selfScore: number;
  othersScore: number; // média ponderada dos outros avaliadores
  managerScore: number;
  peerScore: number;
  // selfScore - othersScore (positivo = sobrestima-se); null quando ainda não
  // há dados suficientes de auto e/ou outros avaliadores para calcular a
  // lacuna — nunca apresentar isso como "0.0" (seria uma lacuna fictícia).
  gap: number | null;
  // Versões não-defaulted de selfScore/othersScore (que ficam a 0 quando
  // falta essa fonte, só para o radar/heatmap não terem um buraco na
  // geometria) — usadas só pela Legenda de Lacunas, para mostrar "Auto: X.X"
  // ou "Outros: X.X" (real, parcial) em vez de "Sem dados" sempre que já
  // exista pelo menos uma das duas fontes, mesmo sem a lacuna comparativa.
  selfRaw: number | null;
  othersRaw: number | null;
  benchmark: number; // média do cargo/nível
}

// Cabeçalho "de quem é este ecrã" — sempre disponível (é o próprio
// utilizador autenticado; regra: ninguém vê o resultado de outro, ver
// evaluation360.service.ts#getParticipantResult), mesmo antes de existir
// ParticipantResult calculado. Separado de ParticipantResult para o cartão
// de identidade (nome, departamento, foto) não depender de já haver
// resultado — só as pontuações é que dependem disso.
export interface ParticipantProfile {
  userId: string;
  fullName: string;
  position: string;
  department: string;
  avatarUrl?: string | null;
}

export interface ParticipantResult {
  userId: string;
  fullName: string;
  position: string;
  department: string;
  avatarUrl?: string | null;
  overallScore: number;
  weightedScore: number;
  selfScore: number;
  managerScore: number;
  peerScore: number;
  competencies: CompetencyScore[];
  strengths: CompetencyScore[];
  gaps: CompetencyScore[];
}

export interface CycleInfo {
  id: string;
  name: string;
  model: string;
  status: string;
  startDate: string;
  endDate: string;
  participantsCount: number;
  completedCount: number;
}

// Linha da aba "Avaliações 360°" (docs/evaluation360.md §2) — GET
// /evaluation360/cycles. Mais rica que CycleInfo (usado só para resolver o
// "ciclo activo" da vista pessoal): tem código, tipo, criado por e taxa de
// participação real (avaliadores que responderam / avaliadores convidados).
export interface Eval360CycleListItem {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName: string;
  createdAt: string;
  participantsCount: number;
  evaluatorsCount: number;
  completedParticipants: number;
  participationRate: number;
}

// Aba "Painel Geral" (admin/RH/gestor — docs/evaluation360.md §1). Distinta
// do separador pessoal "Visão Geral" (OverviewTab.tsx, os MEUS resultados) —
// ver decisão registada em memory project_innova_evaluation360_ninebox_calculated
// e a discussão desta sessão: mantém a vista pessoal intacta, isto é um
// separador novo só para quem gere o módulo.
export interface Evaluation360OverviewData {
  totalCycles: number;
  inPreparation: number;
  open: number;
  inProgress: number;
  completed: number;
  closed: number;
  evaluatedCount: number;
  invitedEvaluatorsCount: number;
  respondedEvaluatorsCount: number;
  participationRate: number;
  completionRate: number;
  avgOverall: number;
  competencyAverages: { competencyId: string; name: string; average: number }[];
  topCompetencies: { competencyId: string; name: string; average: number }[];
  bottomCompetencies: { competencyId: string; name: string; average: number }[];
  pendingAssignments: number;
  upcomingDeadline: { id: string; name: string; endDate: string }[];
  recentCompleted: { id: string; name: string; endDate: string; createdByName: string }[];
}

export interface ContinuousFeedback {
  id: string;
  fromName: string;
  type: 'RECOGNITION' | 'DEVELOPMENT' | 'CHECK_IN';
  message: string;
  competency?: string;
  createdAt: string;
}

// Usado pelo formulário de avaliação (EvaluationFormTab), vindo de
// GET /evaluation360/cycles/:cycleId/form?evaluateeId=...
export interface EvaluationQuestion {
  id: string;
  text: string;
  type: 'FREQUENCY' | 'LIKERT' | 'OPEN_TEXT';
  competency: string;
  isRequired: boolean;
}
