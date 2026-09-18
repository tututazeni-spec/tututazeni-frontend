// components/evaluation/types.ts
// Tipos do domínio "avaliação 360º/desempenho" — movidos verbatim de
// app/(platform)/evaluation/page.tsx.

export type Tab =
  | 'overview'
  | 'evaluations'
  | 'cycles'
  | 'templates'
  | 'criteria'
  | 'competencies'
  | 'pending'
  | 'results'
  | 'analytics'
  | 'calibration';

export interface MyProgress {
  completed: number;
  pending: number;
  completionRate: number;
}

export interface AnalyticsTopPerformer {
  user?: {
    fullName?: string;
    avatarUrl?: string;
    department?: { name?: string };
  };
  avgScore: number;
  percentile: number;
}

export interface AnalyticsByDepartment {
  department: string;
  avgScore: number;
}

export interface AnalyticsData {
  hasData: boolean;
  message?: string;
  kpis: {
    totalParticipants: number;
    avgScore?: number;
    participationRate: number;
    totalEvaluations: number;
  };
  distribution: Record<string, number>;
  topPerformers?: AnalyticsTopPerformer[];
  byDepartment?: AnalyticsByDepartment[];
}

export interface BiasedEvaluator {
  evaluatorId: number;
  avg: number;
  deviation: number;
}

export interface CalibrationParticipant {
  evaluated: {
    id: number;
    fullName?: string;
    avatarUrl?: string;
    position?: { name?: string };
    department?: { name?: string };
  };
  avgScore: number;
  percentile: number;
  dispersion?: number;
}

export interface CalibrationData {
  biasedEvaluators?: BiasedEvaluator[];
  globalAvg?: number;
  participants?: CalibrationParticipant[];
}

export interface Cycle {
  id: number;
  name: string;
  model: string;
  status: string;
  startDate: string;
  endDate: string;
  targetDeptIds?: number[];
  targetUnitIds?: number[];
  selfEvalDueDate?: string | null;
  managerEvalDueDate?: string | null;
  allowCalibration?: boolean;
  participation: { total: number; completed: number; rate: number };
}

// ── docs/modulo_evaluation.md pontos 1-2 (remodelação Parte 1) ──

export interface EvaluationObjective {
  objective: string;
  indicator?: string;
  target?: string;
  weight?: number;
  achievedResult?: string;
  percentage?: number;
  employeeComment?: string;
  evaluatorComment?: string;
}

export interface EvaluationRequestRow {
  key: string;
  id: number;
  evaluated: {
    id: number;
    fullName: string;
    avatarUrl?: string;
    employeeNumber?: string;
    department?: { id: number; name: string } | null;
    position?: { id: number; name: string } | null;
  };
  evaluator: { id: number; fullName: string; avatarUrl?: string } | null;
  type: string;
  purpose: string | null;
  name: string | null;
  cycle: { id: number; name: string; startDate: string; endDate: string } | null;
  period: string | null;
  status: string;
  progress: number;
  dueDate: string | null;
  stage: string | null;
  result: number | null;
  completedAt: string | null;
  evaluatorsCount: number;
}

export interface EvaluationRequestDetail extends EvaluationRequestRow {
  objectives?: EvaluationObjective[] | null;
  siblings: EvaluationRequestRow[];
}

export interface OverviewPersonal {
  scope: 'personal';
  progress: MyProgress;
  pending: EvalRequest[];
}

export interface OverviewOrganization {
  scope: 'organization';
  kpis: {
    inProgress: number;
    pending: number;
    completed: number;
    completionRate: number;
    avgScore: number;
    evaluatedCount: number;
  };
  distribution: Record<string, number>;
  toEvaluateCount: number;
  activeCycles: number;
  upcomingDeadlines: {
    id: number;
    dueDate: string | null;
    evaluated: { id: number; fullName: string; avatarUrl?: string };
  }[];
  alerts: { type: string; count: number }[];
}

export type OverviewDashboard = OverviewPersonal | OverviewOrganization;

export interface EvalRequest {
  id: number;
  type: string;
  status: string;
  dueDate?: string;
  evaluated: {
    id: number;
    fullName: string;
    avatarUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  cycle?: { id: number; name: string; endDate?: string };
}

// ── docs/modulo_evaluation.md pontos 4-7 ──

export interface EvalScale {
  id: number;
  name: string;
  description?: string | null;
  minValue: number;
  maxValue: number;
  isDefault: boolean;
  levels?: { id: number; value: number; label: string; description?: string | null }[];
}

export interface EvalCriteria {
  id: number;
  name: string;
  code?: string | null;
  description?: string | null;
  category?: string | null;
  weight: number;
  scaleId?: number | null;
  scale?: { id: number; name: string } | null;
  competencyId?: number | null;
  competency?: { id: number; name: string } | null;
  behavioralIndicators?: string | null;
  isActive: boolean;
}

export interface EvalTemplateCriterionLink {
  id: number;
  criteriaId: number;
  weight?: number | null;
  seq: number;
  criteria: EvalCriteria;
}

export interface EvalTemplate {
  id: number;
  name: string;
  description?: string | null;
  type: string;
  scaleId?: number | null;
  isDefault: boolean;
  isActive: boolean;
  criteria: EvalTemplateCriterionLink[];
  _count?: { criteria: number };
}

// Espelha CompetenciesService.getCompetencyGap/getCompetencyGapForUser
// (src/competencies/competencies.service.ts) — reutilizado tal e qual,
// sem duplicar o cálculo do lado do Evaluation.
export interface CompetencyGapItem {
  competency: { id: number; name: string; category?: string; scaleMax?: number };
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  met: boolean;
  priority: 'MANDATORY' | 'OPTIONAL';
  weight: number;
  recommendedCourses: { id: number; title: string }[];
}

export interface CompetencyGapView {
  gaps: CompetencyGapItem[];
  totalGap: number;
  mandatoryGaps: number;
  readinessPercent: number;
  positionId: number | null;
  userId: number;
  noPosition?: boolean;
}

// GET /evaluations/my-evaluations e /evaluations/user/:userId (findByUser)
// — usado na secção "Feedback recebido" do separador "Avaliações Pendentes".
export interface ReceivedEvaluation {
  id: number;
  type: string;
  period: string;
  overallScore: number;
  generalComment?: string | null;
  strengths?: string | null;
  improvements?: string | null;
  recommendations?: string | null;
  createdAt: string;
  evaluator: { id: number; fullName: string; avatarUrl?: string | null };
}

export interface EvalResults {
  evaluated: {
    id: number;
    fullName: string;
    position?: { name: string };
    department?: { name: string };
  };
  finalScore: number;
  scoreLabel: string;
  byType: Record<string, number>;
  competencies: Record<number, number>;
  concordance: {
    selfScore: number;
    othersScore: number;
    gap: number;
    label: string;
  } | null;
  totalEvaluators: number;
  qualitative: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  hasResults?: boolean;
}
