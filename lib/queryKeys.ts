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
  },

  beneficiaries: {
    all: ['beneficiaries'] as const,
    lists: () => [...queryKeys.beneficiaries.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
      [...queryKeys.beneficiaries.lists(), params] as const,
    detail: (id: string) =>
      [...queryKeys.beneficiaries.all, 'detail', id] as const,
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

  academic: {
    all: ['academic'] as const,
    programs: (params: Record<string, unknown>) =>
      [...queryKeys.academic.all, 'programs', params] as const,
    program: (id: string) =>
      [...queryKeys.academic.all, 'program', id] as const,
    transcript: () => [...queryKeys.academic.all, 'transcript'] as const,
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
