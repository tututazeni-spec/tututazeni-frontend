// lib/queryKeys.ts
// Factory central de query-keys. Manter as chaves num só sítio evita strings
// soltas, garante invalidação consistente e dedup correcto entre componentes.
//
// Convenção: cada recurso expõe `all`, `lists()`/`list(params)` e `detail(id)`.
// Invalidar `keys.beneficiaries.all` invalida listas e detalhes de uma vez.

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    my: () => [...queryKeys.dashboard.all, 'my'] as const,
    manager: (period?: string) =>
      [...queryKeys.dashboard.all, 'manager', period ?? 'MONTH'] as const,
    alerts: () => [...queryKeys.dashboard.all, 'alerts'] as const,
    search: (q: string) => [...queryKeys.dashboard.all, 'search', q] as const,
    // Separador "Executivo" — único endpoint consolidado
    // (GET /dashboard-institutional/executive), ver components/dashboard/OrgDashboard.tsx.
    executive: (period: string) =>
      [...queryKeys.dashboard.all, 'executive', period] as const,
    executiveSnapshots: () =>
      [...queryKeys.dashboard.all, 'executive', 'snapshots'] as const,
  },

  beneficiaries: {
    all: ['beneficiaries'] as const,
    lists: () => [...queryKeys.beneficiaries.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.beneficiaries.lists(), params] as const,
    detail: (id: string) =>
      [...queryKeys.beneficiaries.all, 'detail', id] as const,
    dashboard: () => [...queryKeys.beneficiaries.all, 'dashboard'] as const,
    followUps: (days: number) =>
      [...queryKeys.beneficiaries.all, 'follow-ups', days] as const,
    report: (params: Record<string, unknown>) =>
      [...queryKeys.beneficiaries.all, 'report', params] as const,
  },

  funders: {
    all: ['funders'] as const,
    lists: () => [...queryKeys.funders.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.funders.lists(), params] as const,
    detail: (id: string) => [...queryKeys.funders.all, 'detail', id] as const,
    dashboard: () => [...queryKeys.funders.all, 'dashboard'] as const,
    report: (params: Record<string, unknown>) =>
      [...queryKeys.funders.all, 'report', params] as const,
  },

  partners: {
    all: ['partners'] as const,
    lists: () => [...queryKeys.partners.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.partners.lists(), params] as const,
    detail: (id: string) => [...queryKeys.partners.all, 'detail', id] as const,
    dashboard: () => [...queryKeys.partners.all, 'dashboard'] as const,
    expiringContracts: (days: number) =>
      [...queryKeys.partners.all, 'expiring-contracts', days] as const,
    overdueMilestones: () =>
      [...queryKeys.partners.all, 'overdue-milestones'] as const,
    report: (params: Record<string, unknown>) =>
      [...queryKeys.partners.all, 'report', params] as const,
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
    directory: (search: string, departmentId?: number | string) =>
      [
        ...queryKeys.users.all,
        'directory',
        search,
        departmentId ?? '',
      ] as const,
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

  payslips: {
    all: ['payslips'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.payslips.all, 'detail', id] as const,
    annual: (year: string) =>
      [...queryKeys.payslips.all, 'annual', year] as const,
    compensation: () => [...queryKeys.payslips.all, 'compensation'] as const,
    salaryComponents: (filter: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'salary-components', filter] as const,
    compensationList: (filter: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'compensation-list', filter] as const,
    compensationHistory: (userId: number) =>
      [...queryKeys.payslips.all, 'compensation-history', userId] as const,
    adminList: (params: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'admin-list', params] as const,
    adminDetail: (id: number) =>
      [...queryKeys.payslips.all, 'admin-detail', id] as const,
    accessLogs: (id: number) =>
      [...queryKeys.payslips.all, 'access-logs', id] as const,
    dashboard: (period: string) =>
      [...queryKeys.payslips.all, 'dashboard', period] as const,
    disputes: (params: Record<string, unknown>) =>
      [...queryKeys.payslips.all, 'disputes', params] as const,
  },

  payroll: {
    all: ['payroll'] as const,
    runList: (params: Record<string, unknown>) =>
      [...queryKeys.payroll.all, 'run-list', params] as const,
    runDetail: (id: number) =>
      [...queryKeys.payroll.all, 'run-detail', id] as const,
    // Prefixo sem `params` — usado para invalidar TODAS as páginas/filtros
    // de recibos de um run de uma vez (React Query invalida por prefixo de
    // queryKey, exact:false por omissão).
    runPayslipsAll: (id: number) =>
      [...queryKeys.payroll.all, 'run-payslips', id] as const,
    runPayslips: (id: number, params: Record<string, unknown>) =>
      [...queryKeys.payroll.runPayslipsAll(id), params] as const,
    runExceptions: (id: number) =>
      [...queryKeys.payroll.all, 'run-exceptions', id] as const,
  },

  assessments: {
    all: ['assessments'] as const,
    list: () => [...queryKeys.assessments.all, 'list'] as const,
    myAttempts: () => [...queryKeys.assessments.all, 'my-attempts'] as const,
    detail: (id: number) =>
      [...queryKeys.assessments.all, 'detail', id] as const,
  },

  // Bucket separado de `assessments` (mesmo backend /assessments/*) para as
  // "Avaliações Formais" do módulo evaluation — evita invalidar por engano a
  // cache do catálogo LMS genérico ao gerir/participar numa avaliação formal.
  formalEvaluations: {
    all: ['formal-evaluations'] as const,
    list: () => [...queryKeys.formalEvaluations.all, 'list'] as const,
    available: () => [...queryKeys.formalEvaluations.all, 'available'] as const,
    results: (id: number) =>
      [...queryKeys.formalEvaluations.all, 'results', id] as const,
    attemptReview: (id: number) =>
      [...queryKeys.formalEvaluations.all, 'attempt-review', id] as const,
  },

  departments: {
    all: ['departments'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.departments.all, 'list', params] as const,
    tree: () => [...queryKeys.departments.all, 'tree'] as const,
    units: () => [...queryKeys.departments.all, 'units'] as const,
    detail: (id: number) =>
      [...queryKeys.departments.all, 'detail', id] as const,
    metrics: (id: number) =>
      [...queryKeys.departments.all, 'metrics', id] as const,
    comparative: () => [...queryKeys.departments.all, 'comparative'] as const,
  },

  competencies: {
    all: ['competencies'] as const,
    catalog: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'catalog', params] as const,
    detail: (id: number) =>
      [...queryKeys.competencies.all, 'detail', id] as const,
    myProfile: () => [...queryKeys.competencies.all, 'my-profile'] as const,
    myEvolution: () => [...queryKeys.competencies.all, 'my-evolution'] as const,
    skillMatrix: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'skill-matrix', params] as const,
    evaluations: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'evaluations', params] as const,
    // docs/módulo_competencies.md §7/§8
    gaps: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'gaps', params] as const,
    development: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'development', params] as const,
    dashboardGaps: () =>
      [...queryKeys.competencies.all, 'dashboard-gaps'] as const,
    overview: () => [...queryKeys.competencies.all, 'overview'] as const,
    top: () => [...queryKeys.competencies.all, 'top'] as const,
    gap: (userId: string | number) =>
      [...queryKeys.competencies.all, 'gap', userId] as const,
    // docs/módulo_competencies.md §3/§4 (Fase 2)
    levels: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'levels', params] as const,
    models: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'models', params] as const,
    modelDetail: (id: number) =>
      [...queryKeys.competencies.all, 'models', 'detail', id] as const,
    // docs/módulo_competencies.md §9
    reports: (params: Record<string, unknown>) =>
      [...queryKeys.competencies.all, 'reports', params] as const,
  },

  automation: {
    all: ['automation'] as const,
    rules: () => [...queryKeys.automation.all, 'rules'] as const,
    executions: (status: string) =>
      [...queryKeys.automation.all, 'executions', status] as const,
    templates: () => [...queryKeys.automation.all, 'templates'] as const,
    stats: () => [...queryKeys.automation.all, 'stats'] as const,
  },

  scalability: {
    all: ['scalability'] as const,
    dashboard: () => [...queryKeys.scalability.all, 'dashboard'] as const,
    integrations: () => [...queryKeys.scalability.all, 'integrations'] as const,
    automations: () => [...queryKeys.scalability.all, 'automations'] as const,
    alerts: () => [...queryKeys.scalability.all, 'alerts'] as const,
    sla: () => [...queryKeys.scalability.all, 'sla'] as const,
    contentDelivery: () =>
      [...queryKeys.scalability.all, 'content-delivery'] as const,
  },

  dashboardRh: {
    all: ['dashboard-rh'] as const,
    overview: () => [...queryKeys.dashboardRh.all, 'overview'] as const,
    alerts: () => [...queryKeys.dashboardRh.all, 'alerts'] as const,
    headcount: () => [...queryKeys.dashboardRh.all, 'headcount'] as const,
    headcountTrend: () =>
      [...queryKeys.dashboardRh.all, 'headcount-trend'] as const,
    anniversaries: () =>
      [...queryKeys.dashboardRh.all, 'anniversaries'] as const,
    performance: () => [...queryKeys.dashboardRh.all, 'performance'] as const,
    training: () => [...queryKeys.dashboardRh.all, 'training'] as const,
    correlations: () => [...queryKeys.dashboardRh.all, 'correlations'] as const,
    talent: () => [...queryKeys.dashboardRh.all, 'talent'] as const,
    turnover: () => [...queryKeys.dashboardRh.all, 'turnover'] as const,
    engagement: () => [...queryKeys.dashboardRh.all, 'engagement'] as const,
    skills: () => [...queryKeys.dashboardRh.all, 'skills'] as const,
    compliance: () => [...queryKeys.dashboardRh.all, 'compliance'] as const,
    attendance: () => [...queryKeys.dashboardRh.all, 'attendance'] as const,
    payroll: (period: string) =>
      [...queryKeys.dashboardRh.all, 'payroll', period] as const,
    predictions: () => [...queryKeys.dashboardRh.all, 'predictions'] as const,
    // Tier 2 — dados reais de outros módulos, mostrados dentro do dashboard-rh
    employeesHeadcount: () =>
      [...queryKeys.dashboardRh.all, 'employees-headcount'] as const,
    documentsDashboard: () =>
      [...queryKeys.dashboardRh.all, 'documents-dashboard'] as const,
  },

  evaluation: {
    all: ['evaluation'] as const,
    myProgress: () => [...queryKeys.evaluation.all, 'my-progress'] as const,
    pending: () => [...queryKeys.evaluation.all, 'pending'] as const,
    results: (userId: string | number) =>
      [...queryKeys.evaluation.all, 'results', userId] as const,
    cycles: () => [...queryKeys.evaluation.all, 'cycles'] as const,
    analytics: () => [...queryKeys.evaluation.all, 'analytics'] as const,
    overview: () => [...queryKeys.evaluation.all, 'overview'] as const,
    requests: (filters?: Record<string, unknown>) =>
      [...queryKeys.evaluation.all, 'requests', filters ?? {}] as const,
    requestDetail: (id: string | number) =>
      [...queryKeys.evaluation.all, 'requests', id] as const,
    criteria: (params?: Record<string, unknown>) =>
      [...queryKeys.evaluation.all, 'criteria', params ?? {}] as const,
    scales: () => [...queryKeys.evaluation.all, 'scales'] as const,
    templates: () => [...queryKeys.evaluation.all, 'templates'] as const,
    templateDetail: (id: string | number) =>
      [...queryKeys.evaluation.all, 'templates', id] as const,
    myEvaluations: (period?: string) =>
      [...queryKeys.evaluation.all, 'my-evaluations', period ?? null] as const,
    oneOnOne: (requestId: string | number) =>
      [
        ...queryKeys.evaluation.all,
        'requests',
        requestId,
        'one-on-one',
      ] as const,
    reports: (filters?: Record<string, unknown>) =>
      [...queryKeys.evaluation.all, 'reports', filters ?? {}] as const,
    settings: () => [...queryKeys.evaluation.all, 'settings'] as const,
  },

  // Módulo real de Avaliação 360º (src/evaluation360/, backend `/evaluation360`)
  // — distinto de `evaluation` acima, que é `/evaluations` (review de
  // performance geral). Ver frontend/hooks/useEvaluation360.ts.
  evaluation360: {
    all: ['evaluation360'] as const,
    competencies: (tag?: string) =>
      [...queryKeys.evaluation360.all, 'competencies', tag] as const,
    cycles: () => [...queryKeys.evaluation360.all, 'cycles'] as const,
    // Aba "Avaliações 360°" (docs/evaluation360.md §2) — lista filtrada,
    // chave própria para não colidir com o cache de cycles() (usado por
    // hooks/useEvaluation360.ts só para resolver o "ciclo activo").
    cyclesList: (filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycles-list', filters] as const,
    cycleDetail: (cycleId: string) =>
      [...queryKeys.evaluation360.all, 'cycle', cycleId] as const,
    result: (cycleId: string, participantId: string) =>
      [
        ...queryKeys.evaluation360.all,
        'result',
        cycleId,
        participantId,
      ] as const,
    nineBox: (cycleId: string) =>
      [...queryKeys.evaluation360.all, 'nine-box', cycleId] as const,
    feedbacks: (userId: string) =>
      [...queryKeys.evaluation360.all, 'feedbacks', userId] as const,
    form: (cycleId: string, evaluateeId: string) =>
      [...queryKeys.evaluation360.all, 'form', cycleId, evaluateeId] as const,
    progress: (cycleId: string, userId: string) =>
      [...queryKeys.evaluation360.all, 'progress', cycleId, userId] as const,
    myAssignments: (cycleId: string) =>
      [...queryKeys.evaluation360.all, 'my-assignments', cycleId] as const,
    deletedCycles: () =>
      [...queryKeys.evaluation360.all, 'cycles', 'deleted'] as const,
    overview: () => [...queryKeys.evaluation360.all, 'overview'] as const,
    // Aba "Avaliados" (docs/evaluation360.md §4).
    cycleParticipants: (cycleId: string, filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycle-participants', cycleId, filters] as const,
    participantDetail: (cycleId: string, userId: string) =>
      [...queryKeys.evaluation360.all, 'participant-detail', cycleId, userId] as const,
    // Aba "Avaliadores" (docs/evaluation360.md §5).
    cycleEvaluators: (cycleId: string, filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycle-evaluators', cycleId, filters] as const,
    // Aba "Questionários" (docs/evaluation360.md §6).
    questionnaires: (filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'questionnaires', filters] as const,
    questionnaireDetail: (id: string) =>
      [...queryKeys.evaluation360.all, 'questionnaire', id] as const,
    // Aba "Resultados" (docs/evaluation360.md §7) — só ADMIN/RH, ver
    // lib/roles.ts#EVAL_RESULTS_ADMIN_ROLES.
    cycleResults: (cycleId: string) =>
      [...queryKeys.evaluation360.all, 'cycle-results', cycleId] as const,
    // Aba "Feedback" (docs/evaluation360.md §8) — feedback qualitativo do
    // ciclo, distinto de feedbacks() acima (esse é feedback contínuo).
    cycleFeedback: (cycleId: string, filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycle-feedback', cycleId, filters] as const,
    // Aba "Relatórios" (docs/evaluation360.md §9).
    cycleReport: (cycleId: string, filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycle-report', cycleId, filters] as const,
    cycleEvolution: (filters: Record<string, string>) =>
      [...queryKeys.evaluation360.all, 'cycle-evolution', filters] as const,
  },

  analyticsPage: {
    all: ['analytics-page'] as const,
    overview: () => [...queryKeys.analyticsPage.all, 'overview'] as const,
    me: () => [...queryKeys.analyticsPage.all, 'me'] as const,
    manager: () => [...queryKeys.analyticsPage.all, 'manager'] as const,
    hr: () => [...queryKeys.analyticsPage.all, 'hr'] as const,
    risks: () => [...queryKeys.analyticsPage.all, 'risks'] as const,
    learning: () => [...queryKeys.analyticsPage.all, 'learning'] as const,
    people: () => [...queryKeys.analyticsPage.all, 'people'] as const,
    department: (departmentId: number) =>
      [...queryKeys.analyticsPage.all, 'department', departmentId] as const,
    pdi: () => [...queryKeys.analyticsPage.all, 'pdi'] as const,
    competencyGaps: () =>
      [...queryKeys.analyticsPage.all, 'competency-gaps'] as const,
    engagement: () => [...queryKeys.analyticsPage.all, 'engagement'] as const,
    roi: () => [...queryKeys.analyticsPage.all, 'roi'] as const,
    courses: () => [...queryKeys.analyticsPage.all, 'courses'] as const,
    courseDetail: (courseId: number) =>
      [...queryKeys.analyticsPage.all, 'courses', courseId] as const,
    snapshots: () => [...queryKeys.analyticsPage.all, 'snapshots'] as const,
  },

  performance: {
    all: ['performance'] as const,
    my: () => [...queryKeys.performance.all, 'my'] as const,
    currentCycle: () =>
      [...queryKeys.performance.all, 'current-cycle'] as const,
    cycles: () => [...queryKeys.performance.all, 'cycles'] as const,
    team: () => [...queryKeys.performance.all, 'team'] as const,
    nineBox: () => [...queryKeys.performance.all, '9box'] as const,
    analytics: () => [...queryKeys.performance.all, 'analytics'] as const,
  },

  leader: {
    all: ['leader'] as const,
    dashboard: () => [...queryKeys.leader.all, 'dashboard'] as const,
    recommendations: () =>
      [...queryKeys.leader.all, 'recommendations'] as const,
    team: (params?: Record<string, unknown>) =>
      [...queryKeys.leader.all, 'team', params ?? {}] as const,
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
    analyses: (filter?: Record<string, unknown>) =>
      [...queryKeys.roiImpact.all, 'analyses', filter ?? {}] as const,
    initiativeOptions: (type: string) =>
      [...queryKeys.roiImpact.all, 'initiative-options', type] as const,
  },

  rolesPermissions: {
    all: ['roles-permissions'] as const,
    roles: () => [...queryKeys.rolesPermissions.all, 'roles'] as const,
    role: (id: number) =>
      [...queryKeys.rolesPermissions.all, 'role', id] as const,
    matrix: () => [...queryKeys.rolesPermissions.all, 'matrix'] as const,
    governance: () =>
      [...queryKeys.rolesPermissions.all, 'governance'] as const,
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
    saved: () => [...queryKeys.reports.all, 'saved'] as const,
    insights: (params: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'insights', params] as const,
    view: (reportKey: string, params: Record<string, unknown>) =>
      [...queryKeys.reports.all, 'view', reportKey, params] as const,
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
    positions: () => [...queryKeys.career.all, 'positions'] as const,
    vacancies: (type: string, status?: string) =>
      [...queryKeys.career.all, 'vacancies', type, status ?? ''] as const,
    vacancyApplications: (vacancyId: number) =>
      [
        ...queryKeys.career.all,
        'vacancies',
        vacancyId,
        'applications',
      ] as const,
    plan: () => [...queryKeys.career.all, 'plan'] as const,
    overview: () => [...queryKeys.career.all, 'overview'] as const,
    history: (userId?: number) =>
      [...queryKeys.career.all, 'history', userId ?? 'me'] as const,
    jobFamilies: () => [...queryKeys.career.all, 'job-families'] as const,
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
    template: (id: number) =>
      [...queryKeys.onboarding.all, 'templates', id] as const,
    plans: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'plans', params] as const,
    plan: (id: number) => [...queryKeys.onboarding.all, 'plans', id] as const,
    stages: (templateId: number) =>
      [...queryKeys.onboarding.all, 'stages', templateId] as const,
    tasks: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'tasks', params] as const,
    documents: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'documents', params] as const,
    training: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'training', params] as const,
    checkins: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'checkins', params] as const,
    integrationEvaluations: () =>
      [...queryKeys.onboarding.all, 'integration-evaluations'] as const,
    reportsOverview: (params: Record<string, unknown>) =>
      [...queryKeys.onboarding.all, 'reports-overview', params] as const,
  },

  trainings: {
    all: ['trainings'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.trainings.all, 'list', params] as const,
    detail: (id: number) => [...queryKeys.trainings.all, 'detail', id] as const,
    my: () => [...queryKeys.trainings.all, 'my'] as const,
    adminDashboard: () =>
      [...queryKeys.trainings.all, 'admin-dashboard'] as const,
    manage: (params: Record<string, unknown>) =>
      [...queryKeys.trainings.all, 'manage', params] as const,
    results: (id: number) =>
      [...queryKeys.trainings.all, 'results', id] as const,
    calendar: (params: Record<string, unknown>) =>
      [...queryKeys.trainings.all, 'calendar', params] as const,
    history: (id: number) =>
      [...queryKeys.trainings.all, 'history', id] as const,
    reports: (params: Record<string, unknown>) =>
      [...queryKeys.trainings.all, 'reports', params] as const,
  },

  trainingPlans: {
    all: ['training-plans'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.trainingPlans.all, 'list', params] as const,
    detail: (id: number) =>
      [...queryKeys.trainingPlans.all, 'detail', id] as const,
    execution: (id: number) =>
      [...queryKeys.trainingPlans.all, 'execution', id] as const,
  },

  trainingTrainers: {
    all: ['training-trainers'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.trainingTrainers.all, 'list', params] as const,
    detail: (id: number) =>
      [...queryKeys.trainingTrainers.all, 'detail', id] as const,
  },

  trainingResources: {
    all: ['training-resources'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.trainingResources.all, 'list', params] as const,
    detail: (id: number) =>
      [...queryKeys.trainingResources.all, 'detail', id] as const,
  },

  acl: {
    all: ['acl'] as const,
    stats: () => [...queryKeys.acl.all, 'stats'] as const,
    myPermissions: () => [...queryKeys.acl.all, 'my-permissions'] as const,
    roles: () => [...queryKeys.acl.all, 'roles'] as const,
    matrix: () => [...queryKeys.acl.all, 'matrix'] as const,
    audit: (view: string, page: number) =>
      [...queryKeys.acl.all, 'audit', view, page] as const,
    policies: () => [...queryKeys.acl.all, 'policies'] as const,
  },

  succession: {
    all: ['succession'] as const,
    dashboard: () => [...queryKeys.succession.all, 'dashboard'] as const,
    orgChart: () => [...queryKeys.succession.all, 'org-chart'] as const,
    criticalPositions: () =>
      [...queryKeys.succession.all, 'critical-positions'] as const,
    criticalPosition: (id: number) =>
      [...queryKeys.succession.all, 'critical-position', id] as const,
    criticalPositionHistory: (id: number) =>
      [
        ...queryKeys.succession.all,
        'critical-position',
        id,
        'history',
      ] as const,
    positionSummary: (id: number) =>
      [...queryKeys.succession.all, 'position-summary', id] as const,
    talentPool: () => [...queryKeys.succession.all, 'talent-pool'] as const,
    matrix: () => [...queryKeys.succession.all, 'matrix'] as const,
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
    article: (id: number) =>
      [...queryKeys.knowledge.all, 'article', id] as const,
    adminDashboard: () =>
      [...queryKeys.knowledge.all, 'admin-dashboard'] as const,
  },

  aiTutor: {
    all: ['ai-tutor'] as const,
    sessions: () => [...queryKeys.aiTutor.all, 'sessions'] as const,
    session: (id: number) => [...queryKeys.aiTutor.all, 'session', id] as const,
    recommendations: () =>
      [...queryKeys.aiTutor.all, 'recommendations'] as const,
    overview: () => [...queryKeys.aiTutor.all, 'overview'] as const,
    knowledgeSources: () =>
      [...queryKeys.aiTutor.all, 'knowledge-sources'] as const,
    knowledgeSearch: (q: string) =>
      [...queryKeys.aiTutor.all, 'knowledge-search', q] as const,
    allSessions: (params?: Record<string, unknown>) =>
      [...queryKeys.aiTutor.all, 'all-sessions', params ?? {}] as const,
    history: () => [...queryKeys.aiTutor.all, 'history'] as const,
    analytics: () => [...queryKeys.aiTutor.all, 'analytics'] as const,
    settings: () => [...queryKeys.aiTutor.all, 'settings'] as const,
  },

  monitoring: {
    all: ['monitoring'] as const,
    indicators: (params: Record<string, unknown>) =>
      [...queryKeys.monitoring.all, 'indicators', params] as const,
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
    byDepartment: () =>
      [...queryKeys.enrollments.all, 'by-department'] as const,
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
    unreadCount: () =>
      [...queryKeys.notifications.all, 'unread-count'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
    stats: () => [...queryKeys.notifications.all, 'stats'] as const,
  },

  processes: {
    all: ['processes'] as const,
    library: (params: Record<string, unknown>) =>
      [...queryKeys.processes.all, 'library', params] as const,
    detail: (id: number) => [...queryKeys.processes.all, 'detail', id] as const,
    instance: (id: number) =>
      [...queryKeys.processes.all, 'instance', id] as const,
    myTasks: () => [...queryKeys.processes.all, 'my-tasks'] as const,
    dashboard: () => [...queryKeys.processes.all, 'dashboard'] as const,
  },

  leadership: {
    all: ['leadership'] as const,
    myDashboard: () => [...queryKeys.leadership.all, 'my-dashboard'] as const,
    teamDashboard: () =>
      [...queryKeys.leadership.all, 'team-dashboard'] as const,
    programs: (filter: string) =>
      [...queryKeys.leadership.all, 'programs', filter] as const,
    feedback360Summary: () =>
      [...queryKeys.leadership.all, 'feedback-360-summary'] as const,
    ranking: () => [...queryKeys.leadership.all, 'ranking'] as const,
    kudos: () => [...queryKeys.leadership.all, 'kudos'] as const,
    // Workspace de gestão do programa (Task 7). Uma key por recurso — invalidar
    // só a afectada por cada mutação.
    programDetail: (id: number) =>
      [...queryKeys.leadership.all, 'program', id] as const,
    candidates: (id: number) =>
      [...queryKeys.leadership.all, 'program', id, 'candidates'] as const,
    participant: (programId: number, userId: number) =>
      [
        ...queryKeys.leadership.all,
        'program',
        programId,
        'participant',
        userId,
      ] as const,
    outcomes: (id: number) =>
      [...queryKeys.leadership.all, 'program', id, 'outcomes'] as const,
    costs: (id: number) =>
      [...queryKeys.leadership.all, 'program', id, 'costs'] as const,
  },

  organization: {
    all: ['organization'] as const,
    stats: () => [...queryKeys.organization.all, 'stats'] as const,
    headcount: () => [...queryKeys.organization.all, 'headcount'] as const,
    chart: (depth: number) =>
      [...queryKeys.organization.all, 'chart', depth] as const,
    departments: (search: string) =>
      [...queryKeys.organization.all, 'departments', search] as const,
    positions: (level: string) =>
      [...queryKeys.organization.all, 'positions', level] as const,
    timeline: () => [...queryKeys.organization.all, 'timeline'] as const,
  },

  developmentPlans: {
    all: ['development-plans'] as const,
    my: () => [...queryKeys.developmentPlans.all, 'my'] as const,
    myStats: () => [...queryKeys.developmentPlans.all, 'my-stats'] as const,
    detail: (id: number) =>
      [...queryKeys.developmentPlans.all, 'detail', id] as const,
    teamDashboard: () =>
      [...queryKeys.developmentPlans.all, 'team-dashboard'] as const,
  },

  executiveReports: {
    all: ['executive-reports'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.executiveReports.all, 'list', params] as const,
    stats: () => [...queryKeys.executiveReports.all, 'stats'] as const,
    detail: (id: number) =>
      [...queryKeys.executiveReports.all, 'detail', id] as const,
    templates: () => [...queryKeys.executiveReports.all, 'templates'] as const,
  },

  instructor: {
    all: ['instructor'] as const,
    profile: () => [...queryKeys.instructor.all, 'profile'] as const,
    dashboard: () => [...queryKeys.instructor.all, 'dashboard'] as const,
    cohorts: (status: string) =>
      [...queryKeys.instructor.all, 'cohorts', status] as const,
    cohortDetail: (id: number) =>
      [...queryKeys.instructor.all, 'cohort-detail', id] as const,
    atRisk: () => [...queryKeys.instructor.all, 'at-risk'] as const,
  },

  events: {
    all: ['events'] as const,
    catalog: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'catalog', params] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'list', params] as const,
    dashboard: () => [...queryKeys.events.all, 'dashboard'] as const,
    my: () => [...queryKeys.events.all, 'my'] as const,
    detail: (id: number) => [...queryKeys.events.all, 'detail', id] as const,
    organizerDashboard: () =>
      [...queryKeys.events.all, 'organizer-dashboard'] as const,
    calendar: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'calendar', params] as const,
    participants: (eventId: number, params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'detail', eventId, 'participants', params] as const,
    allSessions: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'sessions', params] as const,
    logistics: (eventId: number) =>
      [...queryKeys.events.all, 'detail', eventId, 'logistics'] as const,
    speakers: (eventId: number, params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'detail', eventId, 'speakers', params] as const,
    allCommunications: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'communications', params] as const,
    checkins: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'checkins', params] as const,
    sessionAttendance: (eventId: number, sessionId: number) =>
      [...queryKeys.events.all, 'detail', eventId, 'sessions', sessionId, 'attendance'] as const,
    evaluations: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'evaluations', params] as const,
    reports: (params: Record<string, unknown>) =>
      [...queryKeys.events.all, 'reports', params] as const,
  },

  liveClasses: {
    all: ['live-classes'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'list', params] as const,
    detail: (id: number) =>
      [...queryKeys.liveClasses.all, 'detail', id] as const,
    upcoming: () => [...queryKeys.liveClasses.all, 'upcoming'] as const,
    dashboard: () => [...queryKeys.liveClasses.all, 'dashboard'] as const,
    calendar: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'calendar', params] as const,
    sessions: (id: number) =>
      [...queryKeys.liveClasses.all, 'detail', id, 'sessions'] as const,
    allSessions: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'sessions', params] as const,
    participants: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'participants', params] as const,
    instructors: () => [...queryKeys.liveClasses.all, 'instructors'] as const,
    virtualRooms: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'virtual-rooms', params] as const,
    recordings: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'recordings', params] as const,
    materials: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'materials', params] as const,
    evaluations: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'evaluations', params] as const,
    evaluationsSummary: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'evaluations-summary', params] as const,
    reports: (params: Record<string, unknown>) =>
      [...queryKeys.liveClasses.all, 'reports', params] as const,
    settings: () => [...queryKeys.liveClasses.all, 'settings'] as const,
  },

  declarations: {
    all: ['declarations'] as const,
    templates: () => [...queryKeys.declarations.all, 'templates'] as const,
    purposes: () => [...queryKeys.declarations.all, 'purposes'] as const,
    myDocs: () => [...queryKeys.declarations.all, 'my-docs'] as const,
    allDocs: () => [...queryKeys.declarations.all, 'all-docs'] as const,
    workPending: () => [...queryKeys.declarations.all, 'work-pending'] as const,
    workSubmissions: () =>
      [...queryKeys.declarations.all, 'work-submissions'] as const,
    docDashboard: () =>
      [...queryKeys.declarations.all, 'doc-dashboard'] as const,
    workDashboard: () =>
      [...queryKeys.declarations.all, 'work-dashboard'] as const,
  },

  documents: {
    all: ['documents'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.documents.all, 'list', params] as const,
    dashboard: () => [...queryKeys.documents.all, 'dashboard'] as const,
    tags: () => [...queryKeys.documents.all, 'tags'] as const,
    detail: (id: number) => [...queryKeys.documents.all, 'detail', id] as const,
    pendingReads: () => [...queryKeys.documents.all, 'pending-reads'] as const,
    favorites: () => [...queryKeys.documents.all, 'favorites'] as const,
    recent: () => [...queryKeys.documents.all, 'recent'] as const,
    complianceOverview: () =>
      [...queryKeys.documents.all, 'compliance-overview'] as const,
    readStatus: (id: number) =>
      [...queryKeys.documents.all, 'read-status', id] as const,
  },

  careerPlans: {
    all: ['career-plans'] as const,
    my: () => [...queryKeys.careerPlans.all, 'my'] as const,
    roles: () => [...queryKeys.careerPlans.all, 'roles'] as const,
    analytics: () => [...queryKeys.careerPlans.all, 'analytics'] as const,
    list: (filters: Record<string, unknown>) =>
      [...queryKeys.careerPlans.all, 'list', filters] as const,
    detail: (id: number) =>
      [...queryKeys.careerPlans.all, 'detail', id] as const,
  },

  talentDevelopment: {
    all: ['talent-development'] as const,
    pool: (tier: string) =>
      [...queryKeys.talentDevelopment.all, 'pool', tier] as const,
    matrix: () => [...queryKeys.talentDevelopment.all, 'matrix'] as const,
    plans: (status: string) =>
      [...queryKeys.talentDevelopment.all, 'plans', status] as const,
    trainingNeeds: () =>
      [...queryKeys.talentDevelopment.all, 'training-needs'] as const,
    skillHeatmap: () =>
      [...queryKeys.talentDevelopment.all, 'skill-heatmap'] as const,
    mentoring: (status: string) =>
      [...queryKeys.talentDevelopment.all, 'mentoring', status] as const,
    analytics: () => [...queryKeys.talentDevelopment.all, 'analytics'] as const,
    health: () => [...queryKeys.talentDevelopment.all, 'health'] as const,
  },

  contentLibrary: {
    all: ['content-library'] as const,
    recommended: () =>
      [...queryKeys.contentLibrary.all, 'recommended'] as const,
    trending: () => [...queryKeys.contentLibrary.all, 'trending'] as const,
    new: () => [...queryKeys.contentLibrary.all, 'new'] as const,
    continueWatching: () =>
      [...queryKeys.contentLibrary.all, 'continue-watching'] as const,
    mandatory: () => [...queryKeys.contentLibrary.all, 'mandatory'] as const,
    catalogue: (params: Record<string, unknown>) =>
      [...queryKeys.contentLibrary.all, 'catalogue', params] as const,
    myProgress: () => [...queryKeys.contentLibrary.all, 'my-progress'] as const,
    myStats: () => [...queryKeys.contentLibrary.all, 'my-stats'] as const,
    bookmarks: () => [...queryKeys.contentLibrary.all, 'bookmarks'] as const,
    analytics: () => [...queryKeys.contentLibrary.all, 'analytics'] as const,
  },

  avatarTraining: {
    all: ['avatar-training'] as const,
    recommended: () =>
      [...queryKeys.avatarTraining.all, 'recommended'] as const,
    myHistory: (limit: number) =>
      [...queryKeys.avatarTraining.all, 'my-history', limit] as const,
    scenarios: (params: Record<string, unknown>) =>
      [...queryKeys.avatarTraining.all, 'scenarios', params] as const,
    leaderboard: () =>
      [...queryKeys.avatarTraining.all, 'leaderboard'] as const,
    analytics: () => [...queryKeys.avatarTraining.all, 'analytics'] as const,
  },

  engagement: {
    all: ['engagement'] as const,
    dashboard: () => [...queryKeys.engagement.all, 'dashboard'] as const,
    mySummary: () => [...queryKeys.engagement.all, 'my-summary'] as const,
    surveys: (params: Record<string, unknown>) =>
      [...queryKeys.engagement.all, 'surveys', params] as const,
    recognitionFeed: () =>
      [...queryKeys.engagement.all, 'recognition', 'feed'] as const,
    recognitionLeaderboard: () =>
      [...queryKeys.engagement.all, 'recognition', 'leaderboard'] as const,
    feedback: (type: string) =>
      [...queryKeys.engagement.all, 'feedback', type] as const,
    index: () => [...queryKeys.engagement.all, 'index'] as const,
    heatmap: (metric: string) =>
      [...queryKeys.engagement.all, 'heatmap', metric] as const,
  },

  competencyMap: {
    all: ['competency-map'] as const,
    my: () => [...queryKeys.competencyMap.all, 'my'] as const,
    myRadar: () => [...queryKeys.competencyMap.all, 'my', 'radar'] as const,
    skills: (params: Record<string, unknown>) =>
      [...queryKeys.competencyMap.all, 'skills', params] as const,
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
    myCertificates: () =>
      [...queryKeys.courses.all, 'my-certificates'] as const,
    adminDashboard: () =>
      [...queryKeys.courses.all, 'admin-dashboard'] as const,
    lessonQuiz: (lessonId: number) =>
      [...queryKeys.courses.all, 'lesson-quiz', lessonId] as const,
    quizAttempt: (quizId: number) =>
      [...queryKeys.courses.all, 'quiz-attempt', quizId] as const,
    cohorts: (courseId: number) =>
      [...queryKeys.courses.all, 'cohorts', courseId] as const,
    cohortDetail: (cohortId: number) =>
      [...queryKeys.courses.all, 'cohort-detail', cohortId] as const,
    cohortAttendance: (cohortId: number, date: string) =>
      [...queryKeys.courses.all, 'cohort-attendance', cohortId, date] as const,
    categoriesManaged: () =>
      [...queryKeys.courses.all, 'categories-managed'] as const,
    reports: () => [...queryKeys.courses.all, 'reports'] as const,
  },
} as const;
