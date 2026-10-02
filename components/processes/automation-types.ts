// components/processes/automation-types.ts
// Tipos da aba «Automações» (docs/Modulo_Processes.md §9).

export interface AutomationConditions {
  logic: 'AND' | 'OR';
  rows: Array<{ field: string; operator: string; value?: string }>;
}

export type RetryPolicy = 'NONE' | 'FIXED' | 'EXPONENTIAL';
export type ErrorHandling = 'LOG' | 'NOTIFY_OWNER' | 'DISABLE_RULE';
export type ExecutionStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';

export interface AutomationRule {
  id: number;
  code: string | null;
  name: string;
  description: string | null;
  trigger: string;
  triggerLabel: string;
  action: string;
  actionLabel: string;
  sourceModule: string | null;
  entity: string | null;
  conditions: AutomationConditions | null;
  recipients: string[];
  actionParams: Record<string, unknown>;
  priority: number;
  active: boolean;
  activeFrom: string | null;
  activeUntil: string | null;
  frequency: string | null;
  maxRetries: number | null;
  retryPolicy: RetryPolicy | null;
  retryDelayMinutes: number | null;
  errorHandling: ErrorHandling | null;
  lastRunAt: string | null;
  lastRunStatus: ExecutionStatus | null;
  runCount: number;
  ownerId: string | null;
  createdAt: string;
  updatedAt: string;
  stats: { success: number; failed: number };
}

export interface AutomationList {
  data: AutomationRule[];
  kpis: { total: number; active: number; executions24h: number; failed24h: number };
}

export interface AutomationExecution {
  id: string;
  status: ExecutionStatus;
  startedAt: string;
  finishedAt: string | null;
  attempt: number;
  nextRetryAt: string | null;
  errorMessage: string | null;
  result: Record<string, unknown>;
  payload: Record<string, unknown>;
}

export interface AutomationDetail extends AutomationRule {
  executions: AutomationExecution[];
}

export interface CatalogEvent {
  value: string;
  label: string;
  module: string;
  entity: string;
  description: string;
}

export interface CatalogActionParam {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

export interface CatalogAction {
  value: string;
  label: string;
  description: string;
  params: CatalogActionParam[];
  needsRecipients?: boolean;
}

export interface AutomationTemplate {
  key: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  actionParams: Record<string, unknown>;
  recipients?: string[];
  conditions?: AutomationConditions;
  maxRetries?: number;
  retryPolicy?: RetryPolicy;
  errorHandling?: ErrorHandling;
}

export interface AutomationCatalog {
  events: CatalogEvent[];
  actions: CatalogAction[];
  recipients: Array<{ value: string; label: string }>;
  fields: Array<{ value: string; label: string }>;
  operators: Array<{ value: string; label: string }>;
  retryPolicies: Array<{ value: string; label: string }>;
  errorHandling: Array<{ value: string; label: string }>;
  templates: AutomationTemplate[];
}

export interface AutomationTestResult {
  mode: 'SIMULATION' | 'EXECUTION';
  matches: boolean;
  wouldRun?: boolean;
  executed?: boolean;
  reason?: string;
  action?: string;
  recipients?: Array<{ token: string; userIds: number[] }>;
  result?: Record<string, unknown>;
}

/** Corpo enviado em POST/PUT /processes/automations (ProcessAutomationDto). */
export interface AutomationInput {
  name: string;
  description?: string;
  code?: string;
  trigger: string;
  entity?: string;
  conditions?: AutomationConditions;
  action: string;
  actionParams?: Record<string, unknown>;
  recipients?: string[];
  priority?: number;
  activeFrom?: string;
  activeUntil?: string;
  active?: boolean;
  frequency?: string;
  maxRetries?: number;
  retryPolicy?: RetryPolicy;
  retryDelayMinutes?: number;
  errorHandling?: ErrorHandling;
}
