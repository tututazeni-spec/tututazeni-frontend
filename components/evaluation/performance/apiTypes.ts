// components/evaluation/performance/apiTypes.ts
// Formas devolvidas por GET /evaluations/performance/:id/items,
// GET /evaluations/performance/history/:userId e pelo bloco `performance` de
// GET /evaluations/reports/overview. O servidor calcula tudo; aqui só se tipa.

export type RecommendationStatus =
  'PENDENTE' | 'EM_CURSO' | 'CONCLUIDA' | 'CANCELADA';

export const RECOMMENDATION_STATUS_LABELS: Record<
  RecommendationStatus,
  string
> = {
  PENDENTE: 'Pendente',
  EM_CURSO: 'Em curso',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
};

export interface ItemsStrength {
  id: number;
  competency: string;
  score: number;
  description: string;
  evidence: string | null;
  impact: string | null;
  comment: string | null;
}

export interface ItemsImprovement extends ItemsStrength {
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
}

export interface ItemsRecommendation {
  id: number;
  improvementAreaId: number | null;
  action: string;
  objective: string;
  actionType: string;
  successIndicator: string;
  priority: number;
  dueDate: string | null;
  notes: string | null;
  responsible: { id: number; fullName: string } | null;
  training: { id: number; title: string; status: string } | null;
  trainingParticipation: { status: string; completedAt: string | null } | null;
  pdiAction: { id: number; planId: number } | null;
  /** Estado efectivo: vem do PDI quando há ação ligada (`source: 'PDI'`). */
  status: RecommendationStatus;
  progressPct: number;
  overdue: boolean;
  source: 'PDI' | 'RECOMENDACAO';
}

export interface PerformanceItems {
  evaluationId: number;
  pdiPlanId: number | null;
  strengths: ItemsStrength[];
  improvements: ItemsImprovement[];
  recommendations: ItemsRecommendation[];
}

export interface HistoryEntry {
  evaluationId: number;
  period: string;
  type: string;
  cycleName: string | null;
  overallScore: number | null;
  ratingLabel: string | null;
  submittedAt: string;
  recommendations: {
    total: number;
    done: number;
    open: number;
    overdue: number;
  };
}

export interface EvaluationComparison {
  from: { period: string; overallScore: number | null };
  to: { period: string; overallScore: number | null };
  comparable: boolean;
  limitation: string | null;
  overallDelta: number | null;
  competencies: {
    competency: string;
    previous: number;
    current: number;
    delta: number;
  }[];
  strengthsMaintained: string[];
  strengthsNew: string[];
  improvementsResolved: string[];
  improvementsPending: string[];
  improvementsNew: string[];
  previousRecommendations: HistoryEntry['recommendations'];
}

export interface PerformanceHistory {
  userId: number;
  type: string;
  entries: HistoryEntry[];
  comparison: EvaluationComparison | null;
}

export interface CompetencyCount {
  competency: string;
  count: number;
  avgScore: number | null;
}

export interface PerformanceIndicators {
  byRating: { label: string; count: number }[];
  topStrengths: CompetencyCount[];
  recurringImprovements: CompetencyCount[];
  recommendations: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    overdue: number;
    trainingNeeds: number;
  };
  pdi: { plans: number; avgProgress: number | null };
}
