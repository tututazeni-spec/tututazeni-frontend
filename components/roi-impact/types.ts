// components/roi-impact/types.ts
// Formas dos dados de ROI/impacto vindos da API: executivo,
// aprendizagem, retenção, performance, simulador e programas.
// Extraído de app/(platform)/roi-impact/page.tsx.

export type Tab =
  | 'executive'
  | 'learning'
  | 'retention'
  | 'performance'
  | 'simulator'
  | 'programs';

export interface ExecutiveData {
  headline?: {
    overallRoi?: number;
    totalBenefit?: number;
    totalCost?: number;
    status?: string;
    narrative?: string;
  };
  domains?: {
    learning?: { roi?: number; cost?: number; completions?: number };
    retention?: { savedValue?: number; turnoverRate?: number };
    performance?: { lift?: number; benefit?: number };
  };
  alerts?: Array<{ severity: string; message: string }>;
  topInsights?: string[];
  confidence?: string;
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
