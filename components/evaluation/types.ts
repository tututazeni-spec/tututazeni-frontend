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

// docs/modulo_evaluation.md ponto 9 — "Comparar equipas"/"Distribuição de
// resultados" (sempre sobre o ciclo inteiro, não o filtro de departamento).
export interface CalibrationByDepartment {
  department: string;
  avgScore: number;
  count: number;
}

export interface CalibrationData {
  biasedEvaluators?: BiasedEvaluator[];
  globalAvg?: number;
  participants?: CalibrationParticipant[];
  byDepartment?: CalibrationByDepartment[];
  distribution?: { exceptional: number; above: number; expected: number; below: number };
}

export interface CalibrationHistoryEntry {
  evaluatedId: number;
  calibratedBy: { id: number; fullName: string } | null;
  previousScore: number | null;
  calibratedScore: number | null;
  reason: string | null;
  cycleId: number | null;
  createdAt: string;
}

// docs/modulo_evaluation.md ponto 10 — "Conversa 1:1"
export interface OneOnOneMeetingView {
  id: number;
  scheduledAt: string;
  status: string;
  agenda?: string | null;
  minutes?: string | null;
  actionItems?: string | null;
  nextMeetingDate?: string | null;
  completedAt?: string | null;
}

export interface OneOnOneMinutes {
  discussionPoints?: string;
  strengths?: string;
  developmentAreas?: string;
  commitments?: string;
  objectivesSet?: string;
  observations?: string;
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
  // docs/modulo_evaluation.md ponto 8 — Objetivos/Comentários/Evolução
  objectives?: {
    total: number;
    avgAchievement: number | null;
    items: EvaluationObjective[];
  };
  comments?: {
    manager: { evaluatorId: number; comment: string | null }[];
    self: { evaluatorId: number; comment: string | null }[];
  };
  evolution?: {
    history: { period: string; avgScore: number; evals: number }[];
    trend: number | null;
  };
}

// docs/modulo_evaluation.md ponto 11 — Relatórios
export interface EvaluationReportGroup {
  id: number;
  name: string;
  count: number;
  avgScore: number;
}

export interface EvaluationCompetencyGap {
  competencyId: number;
  name: string;
  avgScore: number;
  gap: number;
}

export interface EvaluationReportsOverview {
  totalEvaluations: number;
  avgScore: number;
  completionRate: number;
  distribution: { exceptional: number; above: number; expected: number; below: number };
  byDepartment: EvaluationReportGroup[];
  byUnit: EvaluationReportGroup[];
  byPosition: EvaluationReportGroup[];
  byManager: EvaluationReportGroup[];
  evolution: { period: string; avgScore: number; count: number }[];
  competencyGaps: EvaluationCompetencyGap[];
  objectivesAchieved: { total: number; avgAchievement: number | null };
}

// docs/modulo_evaluation.md ponto 12 — Configurações
export interface EvaluationSettings {
  scales: EvalScale[];
  criteriaCount: number;
  templatesCount: number;
  evalTypes: string[];
  evalPurposes: string[];
  populationTypes: string[];
  cycleStatuses: string[];
  approvalFlow: string[];
  resultsVisibilityOptions: string[];
}
