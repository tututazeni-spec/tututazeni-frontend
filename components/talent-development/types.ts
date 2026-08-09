// components/talent-development/types.ts
// Tipos do domínio "talent development" — movidos verbatim de
// app/(platform)/talent-development/page.tsx.

export type Tab = 'pool' | 'plans' | 'skill-gaps' | 'mentoring' | 'analytics';
export type Tier = 'HIGH' | 'MEDIUM' | 'DEVELOPING';

export interface TalentUser {
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl?: string;
    position?: { name: string };
    department?: { name: string };
  };
  scores: {
    talent: number;
    competency: number;
    performance: number;
    potential: number;
    engagement: number;
  };
  tier: Tier;
  activePlan: { id: number; name: string; overallProgress: number } | null;
  nineBox: { performanceAxis: number; potentialAxis: number } | null;
}

export interface Plan {
  id: number;
  name: string;
  status: string;
  priority: string;
  overallProgress: number;
  user: { fullName: string; avatarUrl?: string; department?: { name: string } };
  manager?: { fullName: string };
  stats: { total: number; completed: number; overdue: number };
  startDate?: string;
  endDate?: string;
}

export interface HealthScore {
  healthScore: number;
  grade: string;
  total: number;
  metrics: {
    pdpCoverage: number;
    skillsAssessment: number;
    reviewedRate: number;
    mentoringRate: number;
    hiPoRatio: number;
  };
}

export interface DashboardData {
  kpis: {
    totalUsers: number;
    usersWithActivePlan: number;
    pdpCoverage: number;
    totalPlans: number;
    completedActions: number;
    overdueActions: number;
    actionCompletion: number;
    activeMentorings: number;
  };
  plansByStatus: { status: string; count: number }[];
  topTrainingNeeds: {
    skill: { name: string };
    avgGap: number;
    count: number;
  }[];
  recentCompletions: { name: string; user: { fullName: string } }[];
}

export interface NineBoxCell {
  box: string;
  label: string;
  count: number;
}

export interface NineBoxResponse {
  matrix: NineBoxCell[];
}

export interface PoolMeta {
  tierCounts: Record<string, number>;
}

export interface ListMeta {
  total: number;
}

export interface TrainingNeed {
  skill?: { name: string } | null;
  competency?: { name: string } | null;
  category: string;
  count: number;
  avgGap: number;
}

export interface SkillHeatmapRow {
  skill: string;
  departments: Array<{ department: string; avgLevel: number | null }>;
}

export interface MentoringPair {
  id: number;
  status: string;
  reverseMentoring?: boolean;
  objective?: string | null;
  durationMonths?: number | null;
  mentor: { fullName: string; avatarUrl?: string };
  mentee: { fullName: string; avatarUrl?: string };
  _count?: { sessions: number };
}
