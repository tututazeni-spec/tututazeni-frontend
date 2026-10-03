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
  rule?: { id: number; name: string; code?: string | null; active: boolean; draft: boolean };
  upcoming?: string[];
}

export interface Paginated<T> {
  data: T[];
  meta?: { total: number; page: number; limit: number };
}
