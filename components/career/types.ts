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
