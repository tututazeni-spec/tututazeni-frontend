// components/automation/types.ts

export type Tab =
  | 'overview'
  | 'rules'
  | 'builder'
  | 'schedules'
  | 'executions'
  | 'approvals'
  | 'reports'
  | 'settings';

export type RuleStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ERROR';

export interface RuleStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export interface AutomationRule {
  id: number;
  name: string;
  active: boolean;
  category?: string;
  trigger: string;
  action: string;
  stats?: RuleStats;
  code?: string | null;
  description?: string | null;
  module?: string | null;
  status?: RuleStatus;
  ownerId?: string | null;
  ownerName?: string | null;
  ownerAvatarUrl?: string | null;
  priority?: number;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
  draft?: boolean;
  version?: number;
  publishedAt?: string | null;
}

export interface RulesExportResponse {
  filename: string;
  content: string;
}

export interface OverviewData {
  period: { from: string; to: string; granularity: string };
  cards: {
    totalRules: number;
    activeRules: number;
    executions: number;
    failedExecutions: number;
    waiting: number;
    timeSaved: {
      minutes: number;
      hours: number;
      estimate: boolean;
      basisMinutesPerExecution: number;
    };
  };
  byStatus: Record<string, number>;
  timeline: {
    date: string;
    total: number;
    success: number;
    failed: number;
    successRate: number | null;
  }[];
  byModule: { label: string; count: number }[];
  failureCauses: { label: string; count: number }[];
  successRate: number | null;
  truncated: boolean;
}

export interface RunAllResponse {
  executed: number;
}

export interface Execution {
  id: number;
  ruleId: number;
  status: string;
  error?: string | null;
  startedAt?: string | null;
}

export interface ExecutionsResponse {
  data: Execution[];
  meta?: { total: number };
}

export interface AutomationTemplate {
  name: string;
  description?: string;
  category?: string;
  /** Imagem de topo opcional; sem ela, o card usa uma ilustração pelo título. */
  imageUrl?: string;
  trigger: string;
  action: string;
}

export interface ApplyTemplateResponse {
  message?: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface RecentFail {
  ruleId: number;
  error?: string;
}

export interface AutomationStats {
  executions?: { total?: number; successRate?: number; failed?: number };
  rules?: { active?: number };
  byCategory?: CategoryCount[];
  recentFails?: RecentFail[];
}

// ── Construtor de Fluxos (§4) ─────────────────────────────────────

export interface AutomationRuleDetail extends AutomationRule {
  flow: { steps?: unknown[] } | null;
  actionParams?: Record<string, unknown>;
  conditions: { field: string; operator: string; value?: string }[];
  conditionsLogic: 'AND' | 'OR';
  tags: string[];
  departmentIds: string[];
  retryPolicy?: string | null;
  retryDelayMinutes?: number | null;
  maxRetries?: number | null;
  errorHandling?: string | null;
  notifyOnError?: boolean;
  activeFrom?: string | null;
  activeUntil?: string | null;
  publishedBy?: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    steps: number;
    actions: number;
    conditions: number;
    delays: number;
    maxDepth: number;
  } | null;
}

export interface TestStep {
  ref: string;
  type: 'action' | 'condition' | 'delay';
  label?: string;
  action?: string;
  decision?: 'yes' | 'no';
  minutes?: number;
  atMinute?: number;
  wouldRun?: boolean;
  message?: string;
}

export interface TestResult {
  dryRun: true;
  conditionsMatched: boolean;
  wouldRun: boolean;
  steps: TestStep[];
  message?: string;
}

export interface RuleVersion {
  id: string;
  version: number;
  note?: string | null;
  publishedAt: string;
  publishedByName?: string | null;
}

// ── Eventos (§5) ──────────────────────────────────────────────────

export interface CatalogEvent {
  key: string;
  label: string;
  trigger: string | null;
  implemented: boolean;
  activeRules: number;
  events30d: number;
}

export interface CatalogModule {
  module: string;
  label: string;
  actions: string[];
  events: CatalogEvent[];
}

export interface EventCatalog {
  modules: CatalogModule[];
  summary: {
    modules: number;
    events: number;
    implemented: number;
    proposed: number;
    listened: number;
  };
}

export interface AutomationEventRow {
  id: string;
  module: string;
  type: string;
  recordType?: string | null;
  recordId?: string | null;
  correlationId: string;
  depth: number;
  occurredAt: string;
  matchedRules: number;
  executed: number;
  skipped: number;
  status: string;
  note?: string | null;
}

// ── Agendamentos (§6) ─────────────────────────────────────────────

export type ScheduleType = 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ERROR';

export interface AutomationSchedule {
  id: string;
  ruleId: number;
  name: string;
  type: ScheduleType;
  startDate: string;
  endDate?: string | null;
  time: string;
  timezone: string;
  daysOfWeek?: number[] | null;
  dayOfMonth?: number | null;
  cronExpression?: string | null;
  nextRunAt?: string | null;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  lastError?: string | null;
  runCount: number;
  status: ScheduleStatus;
  missedPolicy: 'RUN_ONCE' | 'RUN_ALL' | 'SKIP';
  ownerId?: string | null;
  ownerName?: string | null;
  ownerAvatarUrl?: string | null;
  rule?: { id: number; name: string; code?: string | null; active: boolean; draft: boolean };
  upcoming?: string[];
}

export interface Paginated<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number };
}

// ── Aprovações e Tarefas (§8) ─────────────────────────────────────

export type TaskStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED';
export type TaskKind = 'APPROVAL' | 'TASK';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface TaskPerson {
  id: number;
  name: string | null;
}

export interface AutomationTask {
  id: string;
  kind: TaskKind;
  title: string;
  description?: string | null;
  automation: { id: number; name: string | null } | null;
  executionId?: string | null;
  module?: string | null;
  record: { type: string; id: string } | null;
  approver: TaskPerson;
  substitute: TaskPerson | null;
  escalation: {
    toId: number;
    toName: string | null;
    afterHours?: number | null;
    escalatedAt?: string | null;
  } | null;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  dueAt?: string | null;
  overdue: boolean;
  decidedAt?: string | null;
  decidedBy: TaskPerson | null;
  decisionComment?: string | null;
}

export interface TaskHistoryEntry {
  at: string;
  by: number | null;
  action: string;
  comment?: string;
  from?: number;
  to?: number;
}

export interface AutomationTaskDetail extends AutomationTask {
  history: TaskHistoryEntry[];
  execution: {
    id: string;
    status: string;
    startedAt?: string | null;
    correlationId?: string | null;
  } | null;
  canDecide: boolean;
}

export interface TaskSummary {
  pending: number;
  overdue: number;
  decidedLast30Days: number;
  deadline: { onTime: number; late: number; onTimeRate: number | null };
}

// ── Configurações (§10) ───────────────────────────────────────────

export interface AutomationSettings {
  maxExecutionsPerMinute: number;
  maxConcurrentPerRule: number;
  maxEventDepth: number;
  requireApprovalCritical: boolean;
  failureAlertThreshold: number;
  failureAlertWindowMinutes: number;
  archiveAfterDays: number;
  retentionDays: number;
  deadLetterRetentionDays: number;
  auditRetentionDays: number;
  updatedAt: string | null;
  updatedBy: number | null;
}

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'test'
  | 'activate'
  | 'execute'
  | 'cancel'
  | 'delete';

export interface RoleGrant {
  roleCode: string;
  actions: Record<PermissionAction, boolean>;
  scope: 'ALL' | 'DEPARTMENT';
  locked: boolean;
  custom: boolean;
}

export interface PermissionMatrix {
  actions: PermissionAction[];
  scopes: string[];
  roles: RoleGrant[];
}

export interface PendingPublication {
  id: number;
  name: string;
  module?: string | null;
  trigger?: string | null;
  version: number;
  publishRequestedBy?: string | null;
  publishRequestedAt?: string | null;
  requestedByName: string | null;
}

export interface AuditRow {
  id: string;
  entity: string;
  action: string;
  entityId?: string | null;
  ruleId?: number | null;
  userId?: number | null;
  userName: string | null;
  before: unknown;
  after: unknown;
  note?: string | null;
  createdAt: string;
}

export type ConnectionType =
  | 'HTTP'
  | 'WEBHOOK'
  | 'SMTP'
  | 'SMS'
  | 'WHATSAPP'
  | 'OTHER';
export type ConnectionAuth = 'NONE' | 'BEARER' | 'BASIC' | 'API_KEY_HEADER';

export interface AutomationConnection {
  id: string;
  name: string;
  type: ConnectionType;
  baseUrl?: string | null;
  authType: ConnectionAuth;
  headerName?: string | null;
  username?: string | null;
  status: 'ACTIVE' | 'DISABLED';
  description?: string | null;
  hasSecret: boolean;
  lastTestStatus?: string | null;
  lastTestedAt?: string | null;
}

export interface DeadLetter {
  id: string;
  ruleId: number;
  ruleName: string | null;
  executionId?: string | null;
  attempts: number;
  errorCode?: string | null;
  errorMessage?: string | null;
  status: 'OPEN' | 'REPROCESSED' | 'DISCARDED';
  createdAt: string;
}

export interface DeadLetterSummary {
  open: number;
  reprocessed: number;
  discarded: number;
}

export interface CsvExport {
  filename: string;
  content: string;
}
