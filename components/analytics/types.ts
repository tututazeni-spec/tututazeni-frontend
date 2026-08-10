// components/analytics/types.ts
// Tipos do domínio de analytics (visão geral, dashboard pessoal,
// gestor, RH, riscos). Extraído de app/(platform)/analytics/page.tsx.

export interface OrgOverview {
  users: { total: number; active: number };
  courses: { total: number; published: number };
  enrollments: { total: number; completed: number; completionRate: number };
  pdi: { total: number; active: number; adoptionRate: number };
  engagement: {
    totalXp: number;
    totalBadges: number;
    totalLearningPaths: number;
  };
  performance: { avgScore: number };
}

export interface UserRef {
  fullName: string;
  avatarUrl: string | null;
}

export interface CollaboratorPdiSummary {
  id: number;
  name: string;
  actionsTotal: number;
  actionsDone: number;
  overdueActions: number;
}

export interface CollaboratorDashboard {
  learning: {
    completed: number;
    inProgress: number;
    totalHours: number;
    totalCourses: number;
  };
  xp: { total: number; badges: number };
  streak: { current: number; longest: number };
  pdi: CollaboratorPdiSummary[];
  competencies: Array<{
    name: string;
    category: string;
    currentLevel: number;
    targetLevel: number | null;
  }>;
}

export interface TeamMember extends UserRef {
  id: number;
  position?: { name: string };
  department?: { name: string };
}

export interface ManagerDashboard {
  team: TeamMember[];
  metrics: {
    headcount: number;
    enrollments: number;
    completions: number;
    completionRate: number;
    activePDIs: number;
    pdiAdoptionRate: number;
    avgPerformance: number;
    overdueActions: number;
  };
  competencyGaps: Array<{ name: string; avgGap: number; count: number }>;
  nineBox: Array<{
    userId: number;
    fullName: string;
    avatarUrl: string | null;
    performanceAxis: number;
    potentialAxis: number;
  }>;
  alerts: Array<{ type: string; message: string }>;
}

export interface RiskAlert {
  summary: {
    inactiveCount: number;
    overduePDICount: number;
    criticalActionCount: number;
  };
  inactiveCollaborators: Array<{
    id: number;
    fullName: string;
    avatarUrl: string | null;
  }>;
  overduePDIs: Array<{
    planId: number;
    planName: string;
    user: UserRef;
    daysOverdue: number;
  }>;
  criticalActions: Array<{
    actionId: number;
    actionTitle: string;
    user: UserRef;
    daysOverdue: number;
  }>;
}

export interface DeptHeadcount {
  id: number;
  name: string;
  count: number;
}

export interface HRDashboard {
  people: {
    total: number;
    hired: number;
    terminated: number;
    turnoverRate: number;
  };
  learning: {
    enrollments: number;
    completed: number;
    completionRate: number;
    abandoned: number;
    abandonRate: number;
  };
  pdi: {
    active: number;
    adoptionRate: number;
    pendingApproval: number;
    completed: number;
  };
  headcountByDept?: DeptHeadcount[];
}

export type View = 'overview' | 'my' | 'manager' | 'hr' | 'risks';
