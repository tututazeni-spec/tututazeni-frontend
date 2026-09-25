// components/roi-impact/types.ts
// Formas dos dados de ROI/impacto vindos da API: executivo,
// aprendizagem, retenção, performance, simulador e programas.
// Extraído de app/(platform)/roi-impact/page.tsx.

export type Tab =
  | 'executive'
  | 'roi-analysis'
  | 'learning'
  | 'retention'
  | 'performance'
  | 'simulator'
  | 'programs';

export interface RoiBreakdown {
  key: string | number | null;
  avgRoi: number;
  count: number;
}

export interface TopInitiative {
  id: number;
  name: string;
  initiativeType: string;
  initiative: string | null;
  roiPercent: number | null;
  computedBenefit: number | null;
}

export interface ExecutiveData {
  headline?: {
    overallRoi?: number;
    totalBenefit?: number;
    totalCost?: number;
    costPerLearner?: number | null;
    costPerHour?: number | null;
    impactedEmployees?: number;
    activeMeasuring?: number;
    positiveRoiInitiatives?: number;
    negativeOrIndeterminateInitiatives?: number;
    status?: string;
    narrative?: string;
  };
  domains?: {
    learning?: { roi?: number; cost?: number; completions?: number };
    retention?: { savedValue?: number; turnoverRate?: number };
    performance?: { lift?: number; benefit?: number };
  };
  byDepartment?: RoiBreakdown[];
  byUnit?: RoiBreakdown[];
  byInitiativeType?: RoiBreakdown[];
  roiEvolution?: RoiBreakdown[];
  topInitiatives?: TopInitiative[];
  alerts?: Array<{ severity: string; message: string }>;
  topInsights?: string[];
  confidence?: string;
}

// ─────────────────────────────────────────────────────────────────
// ROI da Formação (docs/roi-impact.md §2)
// ─────────────────────────────────────────────────────────────────

export type RoiInitiativeType = 'CURSO' | 'FORMACAO' | 'PERCURSO' | 'PDI' | 'MENTORIA' | 'EVENTO';

export type RoiAnalysisStatus =
  | 'EM_PREPARACAO'
  | 'EM_MEDICAO'
  | 'DADOS_INSUFICIENTES'
  | 'CALCULADO'
  | 'VALIDADO'
  | 'REVISTO'
  | 'ARQUIVADO';

export type RoiBenefitType =
  | 'PRODUTIVIDADE'
  | 'QUALIDADE'
  | 'REDUCAO_ERROS'
  | 'REDUCAO_ROTATIVIDADE'
  | 'REDUCAO_ACIDENTES'
  | 'AUMENTO_VENDAS'
  | 'REDUCAO_TEMPO_CICLO'
  | 'SATISFACAO_CLIENTE'
  | 'OUTRO';

export interface RoiAnalysisRow {
  id: number;
  name: string;
  initiativeType: RoiInitiativeType;
  initiative: string | null;
  departmentId: number | null;
  unit: string | null;
  participants: number;
  totalCost: number;
  costPerParticipant: number | null;
  estimatedBenefit: number | null;
  realizedBenefit: number | null;
  roiPercent: number | null;
  paybackMonths: number | null;
  confidenceLevel: string | null;
  status: RoiAnalysisStatus;
  measurementPeriodDays: number | null;
}

export interface RoiAnalysisListData {
  total: number;
  analyses: RoiAnalysisRow[];
}

export interface InitiativeOption {
  id: number;
  label: string;
}

export interface CourseImpact {
  course?: { title?: string; category?: string };
  completions?: number;
  roi?: number;
  bcr?: number;
}

export interface LearningData {
  volume?: { completed?: number; completionRate?: number };
  financial?: {
    roi?: number;
    hoursEstimated?: number;
    costEstimated?: number;
    benefitEstimated?: number;
  };
  topCourses?: CourseImpact[];
  insights?: string[];
}

export interface RetentionData {
  headcount?: { active?: number };
  turnoverRate?: number;
  turnoverTrend?: number;
  retentionRate?: number;
  savedValue?: number;
  saved?: number;
  prevTurnoverRate?: number;
  insights?: string[];
}

export interface SimulateSnapshot {
  completionRate?: number;
  cost?: number;
  benefit?: number;
  roi?: number;
}

export interface SimulateResult {
  narrative: string;
  current: SimulateSnapshot;
  projected: SimulateSnapshot;
  delta: { roiLift: number; benefitDelta: number; costDelta: number };
}

export interface ProgramsData {
  total?: number;
  avgRoi?: number;
  topByRoi?: unknown[];
  programs?: CourseImpact[];
}

export interface PerformanceData {
  before?: number;
  after?: number;
  lift?: number | null;
  monetised?: { productivityBenefit?: number };
  highPerformers?: number;
  atRisk?: number;
  insights?: string[];
  confidence?: string;
}
