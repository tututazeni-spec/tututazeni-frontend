// lib/queryKeys.ts
// Factory central de query-keys. Manter as chaves num só sítio evita strings
// soltas, garante invalidação consistente e dedup correcto entre componentes.
//
// Convenção: cada recurso expõe `all`, `lists()`/`list(params)` e `detail(id)`.
// Invalidar `keys.beneficiaries.all` invalida listas e detalhes de uma vez.

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    my: () => [...queryKeys.dashboard.all, 'my'] as const,
    manager: () => [...queryKeys.dashboard.all, 'manager'] as const,
    organization: (period: string) =>
      [...queryKeys.dashboard.all, 'organization', period] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
    search: (q: string) => [...queryKeys.dashboard.all, 'search', q] as const,
    institutionalSummary: () =>
      [...queryKeys.dashboard.all, 'institutional', 'summary'] as const,
    institutionalTrend: (months: number) =>
      [...queryKeys.dashboard.all, 'institutional', 'trend', months] as const,
    institutionalAlerts: () =>
      [...queryKeys.dashboard.all, 'institutional', 'alerts'] as const,
  },

  beneficiaries: {
    all: ['beneficiaries'] as const,
    lists: () => [...queryKeys.beneficiaries.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.beneficiaries.lists(), params] as const,
    detail: (id: string) =>
      [...queryKeys.beneficiaries.all, 'detail', id] as const,
  },

  funders: {
    all: ['funders'] as const,
    lists: () => [...queryKeys.funders.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.funders.lists(), params] as const,
    detail: (id: string) => [...queryKeys.funders.all, 'detail', id] as const,
  },

  partners: {
    all: ['partners'] as const,
    lists: () => [...queryKeys.partners.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.partners.lists(), params] as const,
    detail: (id: string) => [...queryKeys.partners.all, 'detail', id] as const,
  },

  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.users.lists(), params] as const,
    detail: (id: number | string) =>
      [...queryKeys.users.all, 'detail', id] as const,
    stats: (id: number | string) =>
      [...queryKeys.users.all, 'stats', id] as const,
    auditLogs: (id: number | string) =>
      [...queryKeys.users.all, 'audit-logs', id] as const,
    team: (id: number | string) =>
      [...queryKeys.users.all, 'team', id] as const,
    adminDashboard: () => [...queryKeys.users.all, 'admin-dashboard'] as const,
    directory: (search: string) =>
      [...queryKeys.users.all, 'directory', search] as const,
  },

  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.employees.lists(), params] as const,
    headcount: () => [...queryKeys.employees.all, 'headcount'] as const,
    detail: (id: string | number) =>
      [...queryKeys.employees.all, 'detail', id] as const,
  },

  library: {
    all: ['library'] as const,
    items: (params: Record<string, unknown>) =>
      [...queryKeys.library.all, 'items', params] as const,
    item: (id: string) => [...queryKeys.library.all, 'item', id] as const,
  },

  certification: {
    all: ['certification'] as const,
    myCertificates: () =>
      [...queryKeys.certification.all, 'my-certificates'] as const,
    templates: () => [...queryKeys.certification.all, 'templates'] as const,
    verify: (code: string) =>
      [...queryKeys.certification.all, 'verify', code] as const,
  },

  academic: {
    all: ['academic'] as const,
    programs: (params: Record<string, unknown>) =>
      [...queryKeys.academic.all, 'programs', params] as const,
    program: (id: string) =>
      [...queryKeys.academic.all, 'program', id] as const,
    transcript: () => [...queryKeys.academic.all, 'transcript'] as const,
  },

  payslips: {
    all: ['payslips'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.payslips.all, 'detail', id] as const,
    annual: (year: string) =>
      [...queryKeys.payslips.all, 'annual', year] as const,
  },

  assessments: {
    all: ['assessments'] as const,
    list: () => [...queryKeys.assessments.all, 'list'] as const,
    myAttempts: () => [...queryKeys.assessments.all, 'my-attempts'] as const,
    detail: (id: number) =>
      [...queryKeys.assessments.all, 'detail', id] as const,
  },

  departments: {
    all: ['departments'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.departments.all, 'list', params] as const,
    tree: () => [...queryKeys.departments.all, 'tree'] as const,
    detail: (id: number) => [...queryKeys.departments.all, 'detail', id] as const,
    metrics: (id: number) =>
      [...queryKeys.departments.all, 'metrics', id] as const,
    comparative: () => [...queryKeys.departments.all, 'comparative'] as const,
  },

  competencies: {
    all: ['competencies'] as const,
    catalog: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'catalog', params] as const,
    myProfile: () => [...queryKeys.competencies.all, 'my-profile'] as const,
    myEvolution: () => [...queryKeys.competencies.all, 'my-evolution'] as const,
    skillMatrix: (deptId: string) =>
      [...queryKeys.competencies.all, 'skill-matrix', deptId] as const,
    dashboardGaps: () =>
      [...queryKeys.competencies.all, 'dashboard-gaps'] as const,
    top: () => [...queryKeys.competencies.all, 'top'] as const,
  },

  automation: {
    all: ['automation'] as const,
    rules: () => [...queryKeys.automation.all, 'rules'] as const,
    executions: (status: string) =>
      [...queryKeys.automation.all, 'executions', status] as const,
    templates: () => [...queryKeys.automation.all, 'templates'] as const,
    stats: () => [...queryKeys.automation.all, 'stats'] as const,
  },

  dashboardRh: {
    all: ['dashboard-rh'] as const,
    overview: () => [...queryKeys.dashboardRh.all, 'overview'] as const,
    alerts: () => [...queryKeys.dashboardRh.all, 'alerts'] as const,
    headcount: () => [...queryKeys.dashboardRh.all, 'headcount'] as const,
    headcountTrend: () => [...queryKeys.dashboardRh.all, 'headcount-trend'] as const,
    anniversaries: () => [...queryKeys.dashboardRh.all, 'anniversaries'] as const,
    performance: () => [...queryKeys.dashboardRh.all, 'performance'] as const,
    training: () => [...queryKeys.dashboardRh.all, 'training'] as const,
    correlations: () => [...queryKeys.dashboardRh.all, 'correlations'] as const,
    talent: () => [...queryKeys.dashboardRh.all, 'talent'] as const,
  },

  evaluation: {
    all: ['evaluation'] as const,
    myProgress: () => [...queryKeys.evaluation.all, 'my-progress'] as const,
    pending: () => [...queryKeys.evaluation.all, 'pending'] as const,
    results: (userId: string | number) =>
      [...queryKeys.evaluation.all, 'results', userId] as const,
    cycles: () => [...queryKeys.evaluation.all, 'cycles'] as const,
    analytics: () => [...queryKeys.evaluation.all, 'analytics'] as const,
  },

  analyticsPage: {
    all: ['analytics-page'] as const,
    overview: () => [...queryKeys.analyticsPage.all, 'overview'] as const,
    me: () => [...queryKeys.analyticsPage.all, 'me'] as const,
    manager: () => [...queryKeys.analyticsPage.all, 'manager'] as const,
    hr: () => [...queryKeys.analyticsPage.all, 'hr'] as const,
    risks: () => [...queryKeys.analyticsPage.all, 'risks'] as const,
  },

  performance: {
    all: ['performance'] as const,
    my: () => [...queryKeys.performance.all, 'my'] as const,
    currentCycle: () => [...queryKeys.performance.all, 'current-cycle'] as const,
    team: () => [...queryKeys.performance.all, 'team'] as const,
    nineBox: () => [...queryKeys.performance.all, '9box'] as const,
    analytics: () => [...queryKeys.performance.all, 'analytics'] as const,
  },

  leader: {
    all: ['leader'] as const,
    dashboard: () => [...queryKeys.leader.all, 'dashboard'] as const,
    recommendations: () => [...queryKeys.leader.all, 'recommendations'] as const,
    team: () => [...queryKeys.leader.all, 'team'] as const,
    pipeline: () => [...queryKeys.leader.all, 'pipeline'] as const,
    plans: () => [...queryKeys.leader.all, 'plans'] as const,
  },

  roiImpact: {
    all: ['roi-impact'] as const,
    executive: () => [...queryKeys.roiImpact.all, 'executive'] as const,
    learning: () => [...queryKeys.roiImpact.all, 'learning'] as const,
    retention: () => [...queryKeys.roiImpact.all, 'retention'] as const,
    performance: () => [...queryKeys.roiImpact.all, 'performance'] as const,
    programs: () => [...queryKeys.roiImpact.all, 'programs'] as const,
  },

  rolesPermissions: {
    all: ['roles-permissions'] as const,
    roles: () => [...queryKeys.rolesPermissions.all, 'roles'] as const,
    matrix: () => [...queryKeys.rolesPermissions.all, 'matrix'] as const,
    governance: () => [...queryKeys.rolesPermissions.all, 'governance'] as const,
  },

  apiIntegrations: {
    all: ['api-integrations'] as const,
    list: () => [...queryKeys.apiIntegrations.all, 'list'] as const,
    webhooks: () => [...queryKeys.apiIntegrations.all, 'webhooks'] as const,
    apiKeys: () => [...queryKeys.apiIntegrations.all, 'api-keys'] as const,
    stats: () => [...queryKeys.apiIntegrations.all, 'stats'] as const,
  },

  search: {
    all: ['search'] as const,
    suggestions: () => [...queryKeys.search.all, 'suggestions'] as const,
    history: () => [...queryKeys.search.all, 'history'] as const,
  },

  reports: {
    all: ['reports'] as const,
    templates: () => [...queryKeys.reports.all, 'templates'] as const,
    insights: (params: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'insights', params] as const,
  },

  audit: {
    all: ['audit'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.audit.all, 'list', params] as const,
    stats: () => [...queryKeys.audit.all, 'stats'] as const,
    anomalies: () => [...queryKeys.audit.all, 'anomalies'] as const,
    integrity: () => [...queryKeys.audit.all, 'integrity'] as const,
  },

  career: {
    all: ['career'] as const,
    me: () => [...queryKeys.career.all, 'me'] as const,
    paths: () => [...queryKeys.career.all, 'paths'] as const,
    vacancies: (type: string) =>
      [...queryKeys.career.all, 'vacancies', type] as const,
    plan: () => [...queryKeys.career.all, 'plan'] as const,
  },

  history: {
    all: ['history'] as const,
    timeline: (params: Record<string, unknown>) =>
      [...queryKeys.history.all, 'timeline', params] as const,
    milestones: () => [...queryKeys.history.all, 'milestones'] as const,
    stats: () => [...queryKeys.history.all, 'stats'] as const,
    auditStats: () => [...queryKeys.history.all, 'audit-stats'] as const,
    upcoming: () => [...queryKeys.history.all, 'upcoming'] as const,
  },

  onboarding: {
    all: ['onboarding'] as const,
    my: () => [...queryKeys.onboarding.all, 'my'] as const,
    dashboard: () => [...queryKeys.onboarding.all, 'dashboard'] as const,
    templates: () => [...queryKeys.onboarding.all, 'templates'] as const,
  },

  trainings: {
    all: ['trainings'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.trainings.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.trainings.all, 'detail', id] as const,
    my: () => [...queryKeys.trainings.all, 'my'] as const,
    adminDashboard: () =>
      [...queryKeys.trainings.all, 'admin-dashboard'] as const,
  },

  acl: {
    all: ['acl'] as const,
    stats: () => [...queryKeys.acl.all, 'stats'] as const,
    myPermissions: () => [...queryKeys.acl.all, 'my-permissions'] as const,
    roles: () => [...queryKeys.acl.all, 'roles'] as const,
    matrix: () => [...queryKeys.acl.all, 'matrix'] as const,
    audit: (view: string) => [...queryKeys.acl.all, 'audit', view] as const,
    policies: () => [...queryKeys.acl.all, 'policies'] as const,
  },

  succession: {
    all: ['succession'] as const,
    dashboard: () => [...queryKeys.succession.all, 'dashboard'] as const,
    orgChart: () => [...queryKeys.succession.all, 'org-chart'] as const,
    criticalPositions: () =>
      [...queryKeys.succession.all, 'critical-positions'] as const,
    positionSummary: (id: number) =>
      [...queryKeys.succession.all, 'position-summary', id] as const,
    talentPool: () => [...queryKeys.succession.all, 'talent-pool'] as const,
  },

  microLearning: {
    all: ['micro-learning'] as const,
    feed: (params: Record<string, unknown>) =>
      [...queryKeys.microLearning.all, 'feed', params] as const,
    dashboard: () => [...queryKeys.microLearning.all, 'dashboard'] as const,
    saved: () => [...queryKeys.microLearning.all, 'saved'] as const,
  },

  knowledge: {
    all: ['knowledge'] as const,
    categories: () => [...queryKeys.knowledge.all, 'categories'] as const,
    trending: () => [...queryKeys.knowledge.all, 'trending'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.knowledge.all, 'list', params] as const,
    article: (id: number) => [...queryKeys.knowledge.all, 'article', id] as const,
    adminDashboard: () =>
      [...queryKeys.knowledge.all, 'admin-dashboard'] as const,
  },

  aiTutor: {
    all: ['ai-tutor'] as const,
    sessions: () => [...queryKeys.aiTutor.all, 'sessions'] as const,
    session: (id: number) => [...queryKeys.aiTutor.all, 'session', id] as const,
    recommendations: () =>
      [...queryKeys.aiTutor.all, 'recommendations'] as const,
  },

  lms: {
    all: ['lms'] as const,
    sessions: (params: Record<string, unknown>) =>
      [...queryKeys.lms.all, 'sessions', params] as const,
    myPaths: () => [...queryKeys.lms.all, 'my-paths'] as const,
    myAnalytics: () => [...queryKeys.lms.all, 'my-analytics'] as const,
    paths: (params: Record<string, unknown>) =>
      [...queryKeys.lms.all, 'paths', params] as const,
  },

  monitoring: {
    all: ['monitoring'] as const,
    myEvaluations: () => [...queryKeys.monitoring.all, 'my-evaluations'] as const,
    evaluationsToComplete: () =>
      [...queryKeys.monitoring.all, 'evaluations-to-complete'] as const,
    indicators: (params: Record<string, unknown>) =>
      [...queryKeys.monitoring.all, 'indicators', params] as const,
    okrs: (params: Record<string, unknown>) =>
      [...queryKeys.monitoring.all, 'okrs', params] as const,
  },

  leave: {
    all: ['leave'] as const,
    types: () => [...queryKeys.leave.all, 'types'] as const,
    myBalance: () => [...queryKeys.leave.all, 'my-balance'] as const,
    myRequests: () => [...queryKeys.leave.all, 'my-requests'] as const,
    dashboard: () => [...queryKeys.leave.all, 'dashboard'] as const,
    pendingApprovals: () =>
      [...queryKeys.leave.all, 'pending-approvals'] as const,
  },

  enrollments: {
    all: ['enrollments'] as const,
    my: () => [...queryKeys.enrollments.all, 'my'] as const,
    lists: () => [...queryKeys.enrollments.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.enrollments.lists(), params] as const,
    compliance: () => [...queryKeys.enrollments.all, 'compliance'] as const,
    adminDashboard: () =>
      [...queryKeys.enrollments.all, 'admin-dashboard'] as const,
    team: () => [...queryKeys.enrollments.all, 'team'] as const,
  },

  attendance: {
    all: ['attendance'] as const,
    dashboard: () => [...queryKeys.attendance.all, 'dashboard'] as const,
    my: (params: Record<string, unknown>) =>
      [...queryKeys.attendance.all, 'my', params] as const,
    leaveBalance: () => [...queryKeys.attendance.all, 'leave-balance'] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    my: (params: Record<string, unknown>) =>
      [...queryKeys.notifications.all, 'my', params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
    stats: () => [...queryKeys.notifications.all, 'stats'] as const,
  },

  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.courses.lists(), params] as const,
    detail: (id: number | string) =>
      [...queryKeys.courses.all, 'detail', id] as const,
    progress: (id: number | string) =>
      [...queryKeys.courses.all, 'progress', id] as const,
    categories: () => [...queryKeys.courses.all, 'categories'] as const,
    myEnrollments: () => [...queryKeys.courses.all, 'my-enrollments'] as const,
    myCertificates: () => [...queryKeys.courses.all, 'my-certificates'] as const,
    adminDashboard: () => [...queryKeys.courses.all, 'admin-dashboard'] as const,
  },
} as const;
