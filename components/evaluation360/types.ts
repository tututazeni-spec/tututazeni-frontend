// components/evaluation360/types.ts
// Tipos do domínio "avaliação 360º" — movidos verbatim de
// app/(platform)/evaluation360/page.tsx. Usados por hooks/useEvaluation360.ts
// (dono dos dados, mock por agora) e pelos componentes de apresentação em
// components/evaluation360/ (Evaluation360View, OverviewTab, RadarChart,
// CompetencyHeatmap, FeedbackTab, NineBoxGrid, EvaluationFormTab) — page.tsx
// é hoje só o container que liga o hook à Evaluation360View.
// Ver memory project_innova_component_separation_audit.

export type EvaluatorRole = 'SELF' | 'MANAGER' | 'PEER' | 'SUBORDINATE';
export type AlertType = 'STRENGTH' | 'GAP' | 'INFO';
export type TabId =
  | 'overview'
  | 'radar'
  | 'competencies'
  | 'feedback'
  | 'ninebox'
  | 'cycles'
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
  gap: number; // selfScore - othersScore (positivo = sobrestima-se)
  benchmark: number; // média do cargo/nível
}

export interface ParticipantResult {
  userId: string;
  fullName: string;
  position: string;
  department: string;
  overallScore: number;
  weightedScore: number;
  selfScore: number;
  managerScore: number;
  peerScore: number;
  competencies: CompetencyScore[];
  strengths: CompetencyScore[];
  gaps: CompetencyScore[];
  isEligiblePromotion: boolean;
  isEligibleBonus: boolean;
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

export interface NineBoxEntry {
  participantId: string;
  name: string;
  performance: 'LOW' | 'MID' | 'HIGH';
  potential: 'LOW' | 'MID' | 'HIGH';
  score: number;
}

export interface ContinuousFeedback {
  id: string;
  fromName: string;
  type: 'RECOGNITION' | 'DEVELOPMENT' | 'CHECK_IN';
  message: string;
  competency?: string;
  createdAt: string;
}

// Usado só pelo formulário de avaliação (EvaluationFormTab) — antes
// hardcoded no componente, agora dado do hook (virá de
// GET /evaluation360/forms/:formId/questions quando o backend existir).
export interface EvaluationQuestion {
  id: string;
  text: string;
  type: 'FREQUENCY' | 'LIKERT';
  competency: string;
}
