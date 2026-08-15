// components/dashboard/types.ts
// Tipos do domínio "dashboard" — movidos verbatim de
// app/(platform)/dashboard/page.tsx. Usados pelos componentes de
// apresentação em components/dashboard/ (atoms, ColaboradorDashboard,
// ManagerDashboard, OrgDashboard, GlobalSearch).

export interface Alert {
  type: string;
  message: string;
  priority: 'URGENT' | 'ATTENTION' | 'INFORMATIVE';
  actionUrl?: string;
}

export interface MyDashboardData {
  user?: {
    fullName?: string;
    avatarUrl?: string;
    position?: { name?: string };
    department?: { name?: string };
  };
  development?: {
    activePlan?: {
      status: string;
      name: string;
      progress: number;
      completedActions: number;
      goals: number;
    };
  };
  gamification?: {
    level?: { label: string; level: number; nextAt: number };
    totalPoints?: number;
    recentBadges?: unknown[];
  };
  learning?: { inProgress?: number; completed?: number };
  engagement?: { pendingSurveys?: number };
  pendingItems?: Array<{ priority: string; label: string }>;
  skills?: Array<{ name: string; current: number; target?: number }>;
}

export interface ManagerTeamMember {
  user: {
    id: number;
    fullName: string;
    avatarUrl?: string;
    position?: { name?: string };
  };
  plan?: { progress: number };
  lastScore?: number;
  alert?: boolean;
}

export interface ManagerDashboardData {
  teamSize?: number;
  kpis?: {
    activePlans?: number;
    pdpCoverage?: number;
    avgScore?: number;
    scoreTrend?: number;
    mandatoryRate?: number;
  };
  team?: ManagerTeamMember[];
  alerts?: Array<{ priority: string; message: string }>;
}

export interface OrgDepartment {
  id: number;
  name: string;
  headcount: number;
}

export interface OrgTopContent {
  content?: { title?: string; type?: string };
  views: number;
}

export interface OrgDashboardData {
  kpis?: {
    headcount?: { active?: number; new?: number; newTrend?: number };
    learning?: {
      completions?: number;
      completionsTrend?: number;
      trainingHours?: number;
    };
    development?: { activePlans?: number; coverage?: number };
    performance?: { avgScore?: number };
    talent?: { hiPos?: number; successionCoverage?: number };
    engagement?: { activeSurveys?: number };
  };
  departments?: OrgDepartment[];
  insights?: string[];
  topContent?: OrgTopContent[];
}

export interface SearchUserResult {
  id: number;
  fullName: string;
  avatarUrl?: string;
  position?: { name?: string };
  department?: { name?: string };
}

export interface SearchCourseResult {
  id: number;
  title: string;
}

export interface SearchResults {
  users?: SearchUserResult[];
  courses?: SearchCourseResult[];
}

// Partilhado entre os 3 sub-dashboards e a página principal — todos leem a
// mesma key /dashboard/alerts (React Query dedup, 1 pedido em vez de 4).
export const ALERTS_POLL_MS = 60_000;
