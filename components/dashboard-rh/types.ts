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
  | 'skills'
  | 'compliance'
  | 'attendance'
  | 'payroll'
  | 'predictions'
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

// ─── Turnover ────────────────────────────────────────────────────

export interface AtRiskUser {
  user?: {
    id?: number;
    fullName?: string;
    department?: { name?: string };
    position?: { name?: string };
  };
  score?: number;
  risk?: 'HIGH' | 'MEDIUM';
}

export interface TurnoverData {
  turnoverRate?: number;
  retentionRate?: number;
  totalLeft?: number;
  leftLast3Months?: number;
  avgTenureYears?: number;
  atRiskUsers?: AtRiskUser[];
  insights?: string[];
}

// ─── Engagement ──────────────────────────────────────────────────

export interface EngagementDeptRow {
  department: string;
  responses: number;
}

export interface EngagementData {
  engagementScore?: number | null;
  participationRate?: number;
  status?: string;
  activeSurveys?: number;
  recognitions?: number;
  avatarSessions?: number;
  badgeAwards?: number;
  byDepartment?: EngagementDeptRow[];
  insights?: string[];
}

// ─── Skills ──────────────────────────────────────────────────────

export interface SkillRow {
  competency?: { id?: number; name?: string; type?: string };
  count: number;
  avgLevel: number;
  avgGap: number;
}

export interface SkillsData {
  totalUsers?: number;
  assessed?: number;
  assessmentRate?: number;
  totalCompetencies?: number;
  criticalGaps?: number;
  topGaps?: SkillRow[];
  topStrengths?: SkillRow[];
}

// ─── Compliance ──────────────────────────────────────────────────

export interface ComplianceCert {
  id: number;
  title?: string | null;
  issuedAt: string;
  user?: { id?: number; fullName?: string; department?: { name?: string } };
}

export interface ComplianceData {
  mandatory?: number;
  mandatoryDone?: number;
  mandatoryRate?: number;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
  status?: string;
  auditEvents?: number;
  recentCerts?: ComplianceCert[];
}

// ─── Payroll ─────────────────────────────────────────────────────

export interface PayrollData {
  period: string;
  headcount?: number;
  totalGross?: number;
  totalNet?: number;
  totalDeductions?: number;
  avgGross?: number;
}

// ─── Predictions ─────────────────────────────────────────────────

export interface TurnoverRiskUser {
  user?: {
    id?: number;
    fullName?: string;
    avatarUrl?: string;
    department?: { name?: string };
  };
  score?: number;
  tenureMonths?: number;
  riskLevel?: 'HIGH' | 'MEDIUM';
  reason?: string;
}

export interface PredictionsData {
  turnoverRisk?: TurnoverRiskUser[];
  summary?: {
    atRiskCount?: number;
    lowPerfCount?: number;
    engagementResponses?: number;
  };
}

// ─── Attendance (AttendanceService.getDashboard — hoje real) ────

export interface AttendanceListItem {
  id: number;
  name?: string;
  clockIn?: string | null;
  status?: string;
}

export interface AttendanceData {
  date?: string;
  kpis?: {
    totalPresent?: number;
    totalAbsent?: number;
    totalLate?: number;
    checkedInNow?: number;
    pendingLeaves?: number;
    pendingJustifications?: number;
    pendingOvertime?: number;
    attendanceRate?: number;
  };
  presentList?: AttendanceListItem[];
  absentList?: AttendanceListItem[];
  lateList?: AttendanceListItem[];
}

// ─── Tier 2 — dados reais de outros módulos ──────────────────────

export interface EmployeesHeadcountData {
  total?: number;
  byStatus?: { status: string; _count: number }[];
  byDepartment?: { department: string | null; _count: number }[];
  bySeniority?: { seniority: string | null; _count: number }[];
  byContractType?: { contractType: string | null; _count: number }[];
  byWorkMode?: { workMode: string | null; _count: number }[];
  recentHires?: number;
}

export interface DocumentsDashboardData {
  kpis?: {
    total?: number;
    active?: number;
    expired?: number;
    expiringSoon?: number;
    archived?: number;
    newThisMonth?: number;
    recentDownloads?: number;
    totalSizeGB?: number;
  };
  byCategory?: { category: string; _count: number }[];
}
