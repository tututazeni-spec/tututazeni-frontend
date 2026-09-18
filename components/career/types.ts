// components/career/types.ts
// Tipos do domínio de carreira (perfil, trilhas, vagas internas, plano).
// Extraído de app/(platform)/career/page.tsx.

export interface CompetencyGap {
  competency: { id: number; name: string; category: string };
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  status: 'MET' | 'PARTIAL' | 'MISSING';
}

export interface PromotionEligibility {
  eligible: boolean;
  recommendation: string;
  criteria: {
    time: { met: boolean; value: number; required: number; label: string };
    performance: {
      met: boolean;
      value: number;
      required: number;
      label: string;
    };
    competencies: {
      met: boolean;
      value: number;
      required: number;
      label: string;
    };
  };
}

export interface CareerUserRef {
  fullName: string;
  avatarUrl?: string | null;
  position?: { name?: string };
  department?: { name?: string };
  points?: { points: number };
}

export interface CareerPlanSummary {
  title: string;
  goals?: { id: number }[];
  targetDate?: string;
}

export interface UserCompetency {
  id: number;
  name: string;
  category?: string;
  currentLevel?: number;
}

export interface CareerHistoryEntry {
  id: number;
  position?: { name?: string };
  startedAt: string;
  endedAt?: string | null;
}

export interface CareerStats {
  certificates: number;
  enrollments: number;
  userCompetencies: number;
  badgeAwards: number;
}

export interface MatchingVacancy {
  id: number;
  title: string;
  department?: { name?: string };
  matchScore?: number;
}

export interface CareerProfile {
  user: CareerUserRef;
  careerPlan: CareerPlanSummary | null;
  competencies: UserCompetency[];
  careerHistory: CareerHistoryEntry[];
  certificates: unknown[];
  completedCourses: unknown[];
  performanceHistory: unknown[];
  stats: CareerStats;
  insights: {
    competencyGaps: CompetencyGap[];
    promotionEligibility: PromotionEligibility | null;
    matchingVacancies: MatchingVacancy[];
  };
}

export interface CareerPathStep {
  id: number;
  order: number;
  position?: {
    name?: string;
    competencies?: Array<{ competency: { id: number; name: string } }>;
  };
  minMonthsRequired?: number;
  minPerformanceScore?: number;
  requiredCourseIds?: number[];
}

export interface CareerPath {
  id: number;
  name: string;
  type: string;
  description: string | null;
  steps: CareerPathStep[];
}

export interface InternalVacancy {
  id: number;
  title: string;
  type: string;
  status: string;
  matchScore?: number;
  applied?: boolean;
  applicationStatus?: string;
  position?: { name?: string };
  department?: { name?: string };
  _count: { applications: number };
  closingDate?: string;
}

// GET /career/vacancies/:id/applications (RH/Gestor/Admin) — revisão de
// candidatos, secção 5 (Oportunidades).
export interface VacancyApplication {
  id: number;
  status: 'PENDING' | 'REVIEWING' | 'SHORTLISTED' | 'REJECTED' | 'ACCEPTED';
  motivation: string | null;
  feedback: string | null;
  appliedAt: string;
  user: {
    id: number;
    fullName: string;
    avatarUrl?: string | null;
    email?: string;
    position?: { name?: string | null } | null;
    department?: { name?: string | null } | null;
  };
}

export interface Position {
  id: number;
  name: string;
  level: string | null;
}

export interface SimulationResult {
  targetPosition: { name: string };
  readinessScore: number;
  competencyGaps: CompetencyGap[];
  summary: {
    requirementsMet: number;
    totalRequirements: number;
    ready: boolean;
    estimatedTimeMonths?: number;
  };
  recommendedCourses: Array<{ id: number; title: string }>;
}

export interface CareerGoal {
  id: number;
  title: string;
  description?: string;
  status: string;
  progress: number;
}

export interface CareerPlan {
  title: string;
  description?: string;
  targetDate?: string;
  mentor?: { fullName: string };
  goals?: CareerGoal[];
}

// 'succession' existe no tipo e em TITLES mas nunca aparece em NAV nem é
// renderizado pela página — estado pré-existente inalcançável, preservado
// tal como no ficheiro original (não é um bug desta extracção).
export type View = 'dashboard' | 'paths' | 'vacancies' | 'plan' | 'succession';

// ─── Histórico (GET /career/me/history) ─────────────────────────────────────

export interface CareerHistory {
  positionHistory: Array<{
    id: number;
    startedAt: string;
    endedAt: string | null;
    position: { id: number; title: string } | null;
  }>;
  orgChanges: Array<{
    id: number;
    changeType: string;
    effectiveDate: string;
    fromDepartment: { id: number; name: string } | null;
    toDepartment: { id: number; name: string } | null;
    fromPosition: { id: number; name: string } | null;
    toPosition: { id: number; name: string } | null;
  }>;
  plans: Array<{
    id: number;
    title: string;
    status: string;
    currentRole: { id: number; name: string } | null;
    targetRole: { id: number; name: string } | null;
  }>;
  applications: Array<{
    id: number;
    status: string;
    appliedAt: string;
    vacancy: { id: number; title: string; type: string };
  }>;
  certificates: Array<{
    id: number;
    type: string;
    issuedAt: string;
    course: { id: number; title: string } | null;
    program: { id: number; name: string } | null;
  }>;
}

// ─── Famílias Profissionais (GET /career/job-families) ──────────────────────

export interface JobFamily {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  area: string | null;
  active: boolean;
}

// ─── Visão Geral (GET /career/overview) ─────────────────────────────────────

export interface CareerOverview {
  careerAnalytics: {
    overview: {
      totalUsers: number;
      usersWithActivePlan: number;
      pdiEngagementRate: string;
      activeVacancies: number;
      totalApplications: number;
      promotionRequests: number;
      avgCompetencyGap: number;
    };
  };
  careerPlansAnalytics: {
    plans: { active: number; completed: number };
    promotions: { approved: number };
    avgPromotionDays: number;
  };
  successionDashboard: {
    kpis: {
      totalCriticalPositions: number;
      withoutSuccessor: number;
      coverageRate: number;
      readinessIndex: number;
      highRiskPositions: number;
      avgMatchScore: number;
    };
  };
  employeesWithoutPlan: number;
  internalMovements: Array<{ changeType: string; count: number }>;
  evolutionByDepartment: Array<{ key: string; count: number }>;
  evolutionByUnit: Array<{ key: string; count: number }>;
  evolutionByPosition: Array<{ key: string; count: number }>;
  alerts: string[];
}
