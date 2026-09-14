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

export type View =
  | 'overview'
  | 'my'
  | 'manager'
  | 'hr'
  | 'risks'
  | 'learning'
  | 'people'
  | 'pdi'
  | 'competencies'
  | 'engagement'
  | 'roi'
  | 'courses'
  | 'snapshots';

// ── Aprendizagem (GET /analytics/learning) ─────────────────────────────────

export interface CourseAnalyticsItem {
  id: number;
  courseId: number;
  totalEnrollments: number;
  totalCompleted: number;
  avgRating: number;
  totalRatings: number;
  updatedAt: string;
  course: {
    id: number;
    title: string;
    category: string | null;
    workloadHours: number | null;
    level?: string | null;
  };
}

export interface MonthlyCount {
  month: string;
  count: number;
}

export interface LearningAnalytics {
  byStatus: Record<string, number>;
  topCourses: CourseAnalyticsItem[];
  completionByCourse: Array<{
    courseId: number;
    courseTitle: string | null;
    completions: number;
  }>;
  avgAssessmentScore: number;
  certificationCount: number;
  totalHoursConsumed: number;
  monthlyEnrollments: MonthlyCount[];
}

// ── Pessoas (GET /analytics/people, /analytics/departments/:id) ───────────

export interface PeopleAnalytics {
  headcount: {
    total: number;
    hired: number;
    terminated: number;
    onLeave: number;
    turnoverRate: number;
  };
  byDepartment: DeptHeadcount[];
  byPosition: Array<{ id: number; name: string; count: number }>;
  diversity: { gender: Record<string, number> };
}

export interface DepartmentAnalytics {
  departmentId: number;
  headcount: number;
  completedCourses: number;
  avgPerformanceScore: number;
  activePDIs: number;
  pdiAdoptionRate: number;
  topCompetencies: Array<{
    name: string;
    category: string;
    count: number;
    avgLevel: number;
  }>;
}

// ── PDI (GET /analytics/pdi) ────────────────────────────────────────────────

export interface PDIAnalytics {
  byStatus: Record<string, number>;
  avgProgress: number;
  overdueActions: number;
  completedThisMonth: number;
  actionsByType: Array<{ type: string; count: number }>;
}

// ── Gaps de competências org-wide (GET /analytics/competency-gaps) ─────────

export interface CompetencyGapItem {
  name: string;
  category: string;
  avgCurrent: number;
  avgTarget: number;
  gap: number;
  count: number;
}

// ── Engagement (GET /analytics/engagement) ─────────────────────────────────

export interface EngagementMetrics {
  totalUsers: number;
  activeUsersLast30d: number;
  engagementRate: number;
  knowledgeInteractions: number;
  aiTutorSessions: number;
  microLearningAccess: number;
  leaderboard: Array<{
    userId: number;
    fullName: string;
    avatarUrl: string | null;
    points: number;
  }>;
}

// ── ROI de formação (GET /analytics/roi) ────────────────────────────────────

export interface TrainingROI {
  impacts: Array<{
    id: number;
    courseId: number;
    metric: string;
    impactRate: number;
    calculatedAt: string;
    course: { id: number; title: string } | null;
  }>;
  totalHoursInvested: number;
  totalCompletions: number;
  totalCertificates: number;
}

// ── Performance de cursos (GET /analytics/courses[/:id]) ───────────────────

export interface CoursePerformance {
  analytics: CourseAnalyticsItem[];
  feedbackStats: { _avg: { rating: number | null }; _count: number } | null;
  assessmentStats: { _avg: { score: number | null }; _count: number } | null;
}

// ── Snapshots (GET /analytics/snapshots) ────────────────────────────────────

export interface DashboardSnapshot {
  id: number;
  departmentId: number | null;
  totalUsers: number;
  totalCoursesCompleted: number;
  averageScore: number;
  activePlans: number;
  generatedAt: string;
  department: { id: number; name: string } | null;
}
