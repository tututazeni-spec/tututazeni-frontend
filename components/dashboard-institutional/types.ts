// components/dashboard-institutional/types.ts

export interface Summary {
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

export interface TrendPoint {
  month: string;
  users: number;
  enrollments: number;
  completions: number;
}

export interface Alerts {
  critical: number;
  warnings: number;
  reminders: number;
  details: Record<string, number>;
}

// Cada bloco vem null se o respectivo módulo falhar na agregação
// (Promise.allSettled no backend) — nunca derruba o resto do painel.
export interface ModulesOverview {
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
