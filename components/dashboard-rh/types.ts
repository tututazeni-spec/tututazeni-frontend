// components/dashboard-rh/types.ts
// Tipos do domínio "dashboard RH / people analytics" — movidos verbatim
// de app/(platform)/dashboard-rh/page.tsx.

export type Panel =
  | 'overview'
  | 'headcount'
  | 'turnover'
  | 'performance'
  | 'training'
  | 'engagement'
  | 'talent'
  | 'correlations';

export interface Alert {
  type: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  count?: number;
}

export interface DeptCount {
  id?: number;
  name?: string;
  count: number;
}

export interface OverviewKpis {
  headcount?: { total?: number; status?: string };
  turnover?: { rate?: number; status?: string };
  newHires?: { count?: number; trend?: number };
  performance?: { avg?: number };
  pdpCoverage?: { pct?: number; status?: string };
  completions?: { count?: number };
  engagement?: { surveyResponses?: number };
  mandatoryCompliance?: number;
}

export interface OverviewData {
  kpis?: OverviewKpis;
  distribution?: { byDepartment?: DeptCount[] };
}

export interface HeadcountData {
  total?: number;
  active?: number;
  turnoverRate?: number;
  avgTenureMonths?: number;
  byTenure?: Record<string, number>;
}

export interface HeadcountTrendPoint {
  month: string;
  count: number;
}

export interface AnniversaryUser {
  fullName: string;
  avatarUrl?: string;
  years: number;
}

export interface PerformanceDeptScore {
  department: string;
  avgScore: number;
}

export interface PerformanceData {
  avgScore?: number;
  status?: string;
  total?: number;
  hiPos?: number;
  hiPoRatio?: number;
  atRisk?: number;
  distribution?: Record<string, number>;
  byDepartment?: PerformanceDeptScore[];
  insights?: string[];
}

export interface TrainingTopCourse {
  course?: { title?: string; category?: string };
  courseId?: number;
  count: number;
}

export interface TrainingData {
  completed?: number;
  completionRate?: number;
  mandatoryRate?: number;
  mandatoryStatus?: string;
  estimatedHours?: number;
  topCourses?: TrainingTopCourse[];
  insights?: string[];
}

export interface CorrelationBucket {
  insight: string;
  highTrainingAvgPerf?: number;
  lowTrainingAvgPerf?: number;
  lift?: number;
}

export interface EngagementCorrelation {
  insight: string;
  highEngAvgPerf?: number;
  lowEngAvgPerf?: number;
}

export interface CorrelationsData {
  sampleSize?: number;
  trainingVsPerformance?: CorrelationBucket;
  engagementVsPerformance?: EngagementCorrelation;
}

export interface SuccessionPlan {
  candidate?: { fullName?: string; avatarUrl?: string };
  position?: { name?: string };
  readiness?: string;
}

export interface PositionAtRisk {
  name: string;
  level: number;
}

export interface TalentData {
  coverageRate?: number;
  successionPlans?: SuccessionPlan[];
  hiPoCount?: number;
  positionsAtRisk?: PositionAtRisk[];
}
