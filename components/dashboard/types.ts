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
      overdueActions?: number;
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
    department?: { name?: string };
  };
  xp?: number;
  enrollment?: { completed: number; inProgress: number };
  plan?: { progress: number; status?: string };
  lastScore?: number;
  alert?: boolean;
}

export interface ManagerDashboardData {
  teamSize?: number;
  kpis?: {
    activePlans?: number;
    completedPlans?: number;
    inProgress?: number;
    completedEnrollments?: number;
    pdpCoverage?: number;
    avgScore?: number;
    scoreTrend?: number;
    mandatoryRate?: number;
    engagementResponses?: number;
    avatarSessions?: number;
    pendingEvals?: number;
    overdueActions?: number;
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
  // Só presentes quando vindo de GET /dashboard-institutional/executive
  // (composição de DashboardService.getExecutiveDashboard()) — ver
  // OrgDashboard.tsx. Ausentes/undefined se esse lado da agregação falhar.
  talentHealth?: { healthScore: number; grade: 'A' | 'B' | 'C' | 'D' };
  enps?: { enps: number; promoterPct: number; total: number } | null;
  topTalent?: Array<{
    id: number;
    fullName: string;
    position?: { name?: string };
    points: number;
    score: number;
    talent: number;
  }>;
  risks?: Array<{ type: string; label: string; severity: string }>;
}

// ─── Executivo (GET /dashboard-institutional/executive) ───────────────────
// Único endpoint consumido pelo separador "Executivo" — compõe o resumo
// organizacional (DashboardService, acima) com o resumo institucional
// (CRM/conhecimento/alertas/tendência/geografia/módulos) num único payload.
// Ver src/dashboard-institutional/dashboard-institutional.service.ts#getExecutive.

export interface ExecutiveSummary {
  people: { total: number; newThisMonth: number };
  learning: {
    courses: number;
    activeEnrollments: number;
    completedThisYear: number;
    completionRate: number;
  };
  crm: {
    beneficiaries: number;
    partners: number;
    funders: number;
    totalFunding: number;
  };
  knowledge: {
    libraryItems: number;
    certificates: number;
    badgesIssued: number;
  };
}

export interface ExecutiveTrendPoint {
  month: string;
  users: number;
  enrollments: number;
  completions: number;
}

export interface ExecutiveAlerts {
  critical: number;
  warnings: number;
  reminders: number;
  details: Record<string, number>;
}

export interface ExecutiveGeographic {
  beneficiariesByProvince: Array<{
    province: string | null;
    _count: { id: number };
  }>;
}

// Cada bloco vem null se o respectivo módulo falhar na agregação
// (Promise.allSettled no backend) — nunca derruba o resto do painel.
export interface ExecutiveModulesOverview {
  engagement: {
    index: number;
    level: string;
    participationRate: number;
    enps: number | null;
  } | null;
  talentAndSuccession: {
    criticalPositions: number;
    withoutSuccessor: number;
    coverageRate: number;
    highRiskPositions: number;
  } | null;
  onboarding: {
    active: number;
    overdueTasks: number;
    avgSurveyScore: number;
  } | null;
  events: {
    total: number;
    totalParticipants: number;
  } | null;
  processes: {
    active: number;
    inProgress: number;
    overdueSteps: number;
  } | null;
  declarations: {
    pending: number;
    issued: number;
    total: number;
  } | null;
  audit: {
    totalEvents: number;
    todayEvents: number;
    criticalEvents: number;
  } | null;
  automation: {
    totalRules: number;
    activeRules: number;
    successRate: number;
  } | null;
  platform: {
    uptimePercent: number;
    openAlerts: number;
    criticalAlerts: number;
    integrationsWithErrors: number;
  } | null;
  okr: {
    activeCycles: number;
    objectiveCompletionRate: number;
  } | null;
  evaluationCycles: {
    activeCycles: number;
    pendingEvaluations: number;
    completionRate: number;
  } | null;
}

export interface ExecutiveDashboardData {
  organization: OrgDashboardData;
  summary: ExecutiveSummary;
  growthTrend: ExecutiveTrendPoint[];
  geographic: ExecutiveGeographic;
  alerts: ExecutiveAlerts;
  modules: ExecutiveModulesOverview;
}

export interface ExecutiveSnapshot {
  id: string;
  period: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  notes?: string | null;
  totalUsers: number;
  totalEnrollments: number;
  totalBeneficiaries: number;
  totalFunding: number;
  totalCertificates: number;
  completionRate: number;
  createdAt: string;
  createdBy?: { fullName?: string };
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
