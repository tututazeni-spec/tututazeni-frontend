// components/processes/types.ts
// Tipos do domínio "processos" (BPM/SOP) — movidos verbatim de
// app/(platform)/processes/page.tsx.

export type ProcessStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'ARCHIVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StepType =
  | 'START'
  | 'END'
  | 'TASK'
  | 'DECISION'
  | 'GATEWAY'
  | 'REVIEW'
  | 'FORM'
  | 'PARALLEL'
  | 'WAIT_EVENT'
  | 'TIMER'
  | 'INTEGRATION'
  | 'AUTO_ACTION'
  | 'NOTIFICATION'
  | 'DOCUMENT';

export type ApprovalMode = 'SEQUENTIAL' | 'PARALLEL' | 'ANY';
export type RejectionRule = 'HOLD' | 'CANCEL' | 'RETURN' | 'BRANCH';
export type InstanceStatus =
  'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ON_HOLD';
export type TaskStatus =
  'WAITING' | 'PENDING' | 'COMPLETED' | 'REJECTED' | 'ESCALATED' | 'SKIPPED';

export interface ProcessStep {
  id: number;
  type: StepType;
  title: string;
  description: string | null;
  order: number;
  responsibleRole: string | null;
  slaHours: number | null;
  estimatedMinutes: number | null;
  requiresUpload: boolean;
  checklist: string[];
  responsible: { id: number; fullName: string } | null;
  // §5/§6
  dependsOnOrders: number[];
  parallel: boolean;
  reviewer?: { id: number; fullName: string } | null;
  formSchema?: string | null;
  exitConditions?: string | null;
  // §7/§8 — valores guardados pelo servidor (JSON como texto)
  config?: string | null;
  entryConditions?: string | null;
  requiredData?: string[];
  approverIds?: number[];
  approvalMode?: ApprovalMode;
  allowDelegation?: boolean;
  onReject?: RejectionRule;
  maxReturns?: number | null;
  successActions?: string | null;
  failureActions?: string | null;
  escalationAfterHours?: number | null;
  escalationToId?: number | null;
  escalationToRole?: string | null;
  calendarMode?: 'CALENDAR' | 'BUSINESS_DAYS';
  posX?: number | null;
  posY?: number | null;
}

export interface Process {
  id: number;
  code: string;
  title: string;
  description: string | null;
  objective: string | null;
  scope: string | null;
  version: string;
  status: ProcessStatus;
  riskLevel: RiskLevel;
  category: string | null;
  tags: string[];
  defaultSlaHours: number | null;
  estimatedMinutes: number | null;
  nextReviewDate: string | null;
  publishedAt: string | null;
  // §5 Modelos
  involvedModules: string[];
  effectiveFrom: string | null;
  reviewPolicy: string | null;
  confidentiality: string;
  accessRoles: string[];
  requiredDocuments: string[];
  approvalRules: string | null;
  startConditions: string | null;
  completionConditions: string | null;
  createdAt: string;
  updatedAt: string;
  owner: { id: number; fullName: string };
  department: { id: number; name: string } | null;
  steps: ProcessStep[];
  _count: { instances: number };
}

export interface StepProgress {
  id: number;
  stepId: number;
  stepOrder: number;
  status: TaskStatus;
  notes: string | null;
  completedAt: string | null;
  slaDeadline: string | null;
  duration: number | null;
  step: ProcessStep;
  completedBy: { id: number; fullName: string } | null;
}

export interface ProcessInstance {
  id: number;
  processId: number;
  processVersion: string;
  status: InstanceStatus;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  slaDeadline: string | null;
  process: { id: number; title: string; code: string; riskLevel: RiskLevel };
  initiatedBy: { id: number; fullName: string };
  targetUser: { id: number; fullName: string };
  stepProgress: StepProgress[];
  _count?: { stepProgress: number };
  // §17/§21: dados do resumo da instância (devolvidos por GET /processes/instances/:id)
  code?: string | null;
  title?: string | null;
  description?: string | null;
  priority?: ProcessPriority;
  sourceModule?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  currentResponsible?: { id: number; fullName: string } | null;
}

export interface MyTask extends StepProgress {
  instance: {
    id: number;
    process: { code: string; title: string };
    targetUser: { fullName: string };
  };
}

export interface PaginatedProcesses {
  data: Process[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Dashboard {
  processes: { active: number; draft: number; inReview: number };
  instances: { inProgress: number; completed: number };
  compliance: { overdueSteps: number; slaComplianceRate: number | null };
  recentInstances: ProcessInstance[];
  // Visão Geral (docs/Modulo_Processes.md §3)
  alerts: Array<{ level: 'danger' | 'warning' | 'info'; message: string; count: number }>;
  kpis: {
    total: number;
    running: number;
    overdue: number;
    completed: number;
    pendingApprovals: number;
    avgDurationHours: number | null;
    onTimeRate: number | null;
  };
  charts: {
    byStatus: Array<{ label: string; count: number }>;
    createdVsCompleted: Array<{ month: string; created: number; completed: number }>;
    bySourceModule: Array<{ label: string; count: number }>;
    byDepartment: Array<{ label: string; count: number }>;
    avgDurationByType: Array<{ label: string; hours: number }>;
    onTimeRateByMonth: Array<{ month: string; rate: number | null }>;
    mostDelayedSteps: Array<{ title: string; count: number }>;
    workloadByResponsible: Array<{ label: string; count: number }>;
  };
  definitions: Record<string, string>;
  truncated: boolean;
  filterOptions: {
    departments: Array<{ id: number; name: string }>;
    units: Array<{ id: number; name: string }>;
    categories: string[];
    responsibles: Array<{ id: number; fullName: string }>;
  };
}

export type TabKey =
  | 'overview'
  | 'all'
  | 'templates'
  | 'tasks'
  | 'approvals'
  | 'workflows'
  | 'automations'
  | 'calendar'
  | 'documents'
  | 'reports'
  | 'history'
  | 'settings';

export type Nav =
  | { view: TabKey }
  | { view: 'viewer'; processId: number }
  | { view: 'runner'; instanceId: number; processId: number | null };

// ─── §4 Todos os Processos ───────────────────────────────────────────────────
export type ProcessPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type DeadlineSituation = 'ON_TIME' | 'AT_RISK' | 'OVERDUE' | 'NONE';

export interface PersonRef {
  id: number;
  fullName: string;
}

export interface InstanceRow {
  id: number;
  code: string;
  name: string;
  description: string | null;
  type: string | null;
  template: { id: number; code: string; title: string; version: string };
  sourceModule: string | null;
  entity: { type: string | null; id: string | null; target: PersonRef };
  unit: { id: number; name: string } | null;
  department: { id: number; name: string } | null;
  requester: PersonRef;
  currentResponsible: PersonRef | null;
  currentStep: { title: string; type: StepType } | null;
  priority: ProcessPriority;
  status: InstanceStatus;
  archived: boolean;
  progress: number;
  createdAt: string;
  startedAt: string;
  dueAt: string | null;
  updatedAt: string;
  completedAt: string | null;
  elapsedHours: number;
  remainingHours: number | null;
  deadlineSituation: DeadlineSituation;
}

export interface PaginatedInstances {
  data: InstanceRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface InstanceFilterOptions {
  sourceModules: string[];
  categories: string[];
  templates: Array<{ id: number; code: string; title: string }>;
  departments: Array<{ id: number; name: string }>;
  units: Array<{ id: number; name: string }>;
}

// ─── §6 Tarefas e Etapas ─────────────────────────────────────────────────────
export type TaskState =
  | 'WAITING'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'SKIPPED'
  | 'CANCELLED';

export interface TaskView {
  instanceId: number;
  stepId: number;
  code: string;
  name: string;
  type: StepType;
  description: string | null;
  stage: number;
  process: {
    id: number;
    code: string;
    title: string;
    instanceCode: string | null;
    instanceTitle: string;
    priority: ProcessPriority;
    target: PersonRef;
  };
  assignee: PersonRef | null;
  reviewer: PersonRef | null;
  assignedAt: string | null;
  startedAt: string | null;
  dueAt: string | null;
  status: TaskState;
  isOverdue: boolean;
  dependencies: Array<{ order: number; title: string; status: TaskState; done: boolean }>;
  evidenceIds: number[];
  requiresUpload: boolean;
  result: string | null;
  notes: string | null;
  completedAt: string | null;
  completedBy: PersonRef | null;
  blockedReason: string | null;
  returnCount: number;
  returnReason: string | null;
  checklist: { items: string[]; done: string[] };
  permissions: { canAct: boolean; canReview: boolean; canManage: boolean };
}

export interface StepComment {
  id: number;
  kind: 'COMMENT' | 'CLARIFICATION' | 'SYSTEM';
  body: string;
  createdAt: string;
  author: PersonRef;
}

export interface TaskDetail extends TaskView {
  comments: StepComment[];
  events: Array<{ id: number; action: string; createdAt: string; user: PersonRef }>;
}

export interface PaginatedTasks {
  data: TaskView[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  scope: 'mine' | 'all';
}

// ─── §5 Modelos ──────────────────────────────────────────────────────────────
export interface TemplateValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  simulation: Array<{ wave: number; steps: string[] }>;
  code: string;
  version: string;
}

export interface TemplateVersionRow {
  version: string;
  current: boolean;
  status: string | null;
  createdAt: string;
}

// ─── §8 Simulação de fluxos ──────────────────────────────────────────────────
export interface FlowSimulation {
  processId: number;
  code: string;
  version: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  trace: Array<{
    wave: number;
    steps: Array<{
      order: number;
      title: string;
      type: StepType;
      outcome: 'EXECUTED' | 'AUTOMATIC' | 'SKIPPED';
      result: string | null;
    }>;
  }>;
  reachedEnd: boolean;
  executed: number;
  skipped: number;
}

// ─── §10 Calendário e Prazos ─────────────────────────────────────────────────
export type CalendarKind = 'TASK' | 'PROCESS';

export interface CalendarDependency {
  order: number;
  title: string;
  status: string;
  done: boolean;
}

export interface CalendarItem {
  key: string;
  kind: CalendarKind;
  instanceId: number;
  stepId: number | null;
  code: string;
  title: string;
  processTitle: string;
  processCode: string;
  assignee: PersonRef | null;
  department: { id: number; name: string } | null;
  startAt: string | null;
  dueAt: string | null;
  durationHours: number | null;
  status: string;
  priority: ProcessPriority;
  dependencies: CalendarDependency[];
  approvalDueAt: string | null;
  completedAt: string | null;
  isOverdue: boolean;
  isDueSoon: boolean;
  hasConflict: boolean;
}

export interface CalendarConflict {
  assigneeId: number;
  assigneeName: string;
  day: string;
  totalHours: number;
  capacityHours: number;
  itemKeys: string[];
}

export interface CalendarResponse {
  range: { from: string; to: string };
  scope: 'mine' | 'all';
  truncated: boolean;
  data: CalendarItem[];
  conflicts: CalendarConflict[];
  summary: { total: number; overdue: number; dueSoon: number; conflicts: number };
}

export interface DeadlineChange {
  id: number;
  at: string;
  author: PersonRef;
  previousDueAt: string | null;
  newDueAt: string | null;
  reason: string | null;
}

// ─── §11 Documentos ──────────────────────────────────────────────────────────
export type DocValidation = 'REQUESTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type DocEffectiveStatus = DocValidation | 'EXPIRED';
export type DocConfidentiality = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface ProcessDocumentRow {
  id: number;
  instance: {
    id: number;
    code: string;
    title: string;
    status: InstanceStatus;
    process: { id: number; code: string; title: string };
  };
  stepId: number | null;
  name: string;
  docType: string;
  origin: 'ATTACHED' | 'GENERATED' | 'REQUESTED';
  relatedEntity: { type: string | null; id: string | null } | null;
  source:
    | {
        kind: 'REPOSITORY';
        id: number;
        code: string | null;
        title: string;
        fileName: string | null;
        mimeType: string;
      }
    | { kind: 'LIBRARY'; id: string; title: string }
    | null;
  fileUrl: string | null;
  fileRestricted: boolean;
  generated: boolean;
  version: string;
  author: PersonRef | null;
  addedBy: PersonRef | null;
  issuedAt: string | null;
  validUntil: string | null;
  expired: boolean;
  expiringSoon: boolean;
  daysLeft: number | null;
  validationStatus: DocValidation;
  effectiveStatus: DocEffectiveStatus;
  required: boolean;
  approver: PersonRef | null;
  decidedAt: string | null;
  decidedBy: PersonRef | null;
  decisionNote: string | null;
  confidentiality: DocConfidentiality;
  viewRoles: string[];
  viewerIds: number[];
  signatureRequired: boolean;
  signatureStatus: 'PENDING' | 'SIGNED' | null;
  signedAt: string | null;
  signedBy: PersonRef | null;
  requestedFrom: PersonRef | null;
  requestedBy: PersonRef | null;
  requestedAt: string | null;
  requestNote: string | null;
  retentionUntil: string | null;
  archivedAt: string | null;
  archiveReason: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: { canManage: boolean; canDecide: boolean };
}

export interface PaginatedProcessDocuments {
  data: ProcessDocumentRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: { requested: number; pending: number; expiring: number; expired: number };
}

export type RequirementState = 'OK' | 'MISSING' | 'REQUESTED' | 'PENDING' | 'REJECTED' | 'EXPIRED';

export interface DocRequirement {
  name: string;
  state: RequirementState;
  documentId: number | null;
}

export interface InstanceDocuments {
  instance: { id: number; code: string | null; title: string };
  documents: ProcessDocumentRow[];
  requirements: DocRequirement[];
  missing: number;
}

export interface DocumentVersions {
  current: string;
  versions: Array<{
    id: number;
    version: string;
    documentId: number | null;
    note: string | null;
    validUntil: string | null;
    createdAt: string;
    author: PersonRef;
  }>;
  repository: Array<{
    versionNumber: number;
    changeDescription: string;
    createdAt: string;
    uploadedBy: PersonRef;
  }>;
}

export interface DocumentSources {
  repository: Array<{
    id: number;
    title: string;
    documentCode: string | null;
    category: string;
    version: string;
    sensitivity: string;
    expiresAt: string | null;
  }>;
  library: Array<{ id: string; title: string; code: string; type: string; version: string }>;
}

export interface DocumentTemplate {
  id: number;
  name: string;
  description: string | null;
  type: string;
}

// ─── §12 Indicadores e Relatórios ────────────────────────────────────────────
export type ReportGroupBy =
  | 'department'
  | 'template'
  | 'category'
  | 'sourceModule'
  | 'responsible'
  | 'priority'
  | 'month';

export type ReportRecordIndicator =
  | 'total'
  | 'completed'
  | 'onTime'
  | 'late'
  | 'returned'
  | 'rejected'
  | 'reopened'
  | 'overdue'
  | 'backlogInstances'
  | 'backlogTasks'
  | 'pendingApprovals'
  | 'workload'
  | 'automationFailures';

export interface RateIndicator {
  value: number | null;
  numerator: number;
  denominator: number;
}

export interface ReportGroupRow {
  key: string;
  label: string;
  total: number;
  completed: number;
  overdue: number;
  cancelled: number;
  completionRate: number | null;
  onTimeRate: number | null;
  avgHours: number | null;
}

export interface ProcessReport {
  range: { from: string; to: string };
  truncated: boolean;
  indicators: {
    completionRate: RateIndicator;
    onTimeRate: RateIndicator;
    avgCompletionHours: { value: number | null; samples: number };
    avgHoursByStep: Array<{ stepTitle: string; hours: number; samples: number }>;
    rejectionRate: RateIndicator;
    returnRate: RateIndicator;
    volume: { value: number; byMonth: Array<{ month: string; count: number }> };
    reopenRate: RateIndicator;
  };
  snapshot: {
    backlogInstances: number;
    backlogTasks: number;
    overdueInstances: number;
    overdueTasks: number;
    pendingApprovals: number;
  };
  workload: Array<{ assigneeId: number; fullName: string; open: number; overdue: number }>;
  automation: { total: number; failed: number; failureRate: number | null };
  groupBy: ReportGroupBy;
  groups: ReportGroupRow[];
  definitions: Record<string, string>;
}

export interface ReportRecord {
  kind: 'INSTANCE' | 'TASK' | 'APPROVAL' | 'EXECUTION';
  id: string;
  code: string;
  title: string;
  status: string;
  owner: string | null;
  startedAt: string | null;
  dueAt: string | null;
  completedAt: string | null;
  instanceId: number | null;
  detail: string | null;
}

export interface PaginatedReportRecords {
  data: ReportRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── §13 Histórico e Auditoria ───────────────────────────────────────────────
export type AuditSource = 'INTERFACE' | 'API' | 'AUTOMATION' | 'SYSTEM';

export interface AuditEvent {
  id: number;
  action: string;
  label: string;
  createdAt: string;
  actor: { id: number; fullName: string; role: string | null };
  source: AuditSource | null;
  result: 'SUCCESS' | 'FAILED';
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  errorMessage: string | null;
  correlationId: string | null;
  template: { id: number; code: string; title: string } | null;
  instance: { id: number; code: string; title: string | null } | null;
  stepId: number | null;
  hash: string;
}

export interface PaginatedAuditEvents {
  data: AuditEvent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditEventDetail extends AuditEvent {
  meta: Record<string, unknown> | null;
  approval: {
    id: number;
    status: string;
    decision: string | null;
    justification: string | null;
    decidedAt: string | null;
  } | null;
  document: {
    id: number;
    name: string;
    version: string;
    validationStatus: string;
    versions: Array<{ id: number; version: string; createdAt: string }>;
  } | null;
  previousEvent: { id: number; action: string; label: string; createdAt: string } | null;
  nextEvent: {
    id: number;
    action: string;
    label: string;
    createdAt: string;
    source: AuditSource | null;
  } | null;
}

export interface AuditFilterOptions {
  actions: Array<{ value: string; label: string }>;
  users: Array<{ id: number; fullName: string }>;
}

export interface AuditAttempt {
  kind: 'INTEGRATION' | 'AUTOMATION';
  id: string;
  at: string;
  name: string;
  status: string;
  attempts: number;
  error: string | null;
  instanceId: number | null;
  correlationId: string | null;
}

export interface PaginatedAuditAttempts {
  data: AuditAttempt[];
  total: number;
  page: number;
  limit: number;
}

// ─── §14 Configurações ───────────────────────────────────────────────────────
export interface ProcessSettingSection {
  key: string;
  title: string;
  description: string;
  enforced: boolean;
  value: unknown;
  defaultValue: unknown;
  version: number;
  isDefault: boolean;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface ProcessSettingVersion {
  version: number;
  reason: string | null;
  createdAt: string;
  changedBy: { id: number; fullName: string };
  value: unknown;
}

// ─── §15 Integrações ─────────────────────────────────────────────────────────
export type IntegrationModuleStatus = 'ACTIVE' | 'CONFIGURED' | 'NO_ACTIVITY' | 'ERRORS';

export interface IntegrationModuleRow {
  key: string;
  label: string;
  description: string;
  note: string | null;
  status: IntegrationModuleStatus;
  instances: number;
  openInstances: number;
  templates: number;
  events: number;
  failedEvents: number;
  lastActivityAt: string | null;
  inboundAllowed: boolean;
}

export interface IntegrationOverview {
  inboundEnabled: boolean;
  restrictedToModules: boolean;
  summary: { total: number; active: number; configured: number; withErrors: number; noActivity: number };
  modules: IntegrationModuleRow[];
  unmappedModules: string[];
}

export interface IntegrationLog {
  id: number;
  module: string;
  event: string;
  status: 'RECEIVED' | 'SUCCESS' | 'FAILED' | 'DUPLICATE' | 'REJECTED';
  attempts: number;
  processCode: string | null;
  instanceId: number | null;
  errorMessage: string | null;
  correlationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedIntegrationLogs {
  data: IntegrationLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
