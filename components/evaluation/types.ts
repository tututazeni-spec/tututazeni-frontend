// components/evaluation/types.ts
// Tipos do domínio "avaliação 360º/desempenho" — movidos verbatim de
// app/(platform)/evaluation/page.tsx.

export type Tab =
  | 'overview'
  | 'evaluations'
  | 'cycles'
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
