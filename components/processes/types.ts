// components/processes/types.ts
// Tipos do domínio "processos" (BPM/SOP) — movidos verbatim de
// app/(platform)/processes/page.tsx.

export type ProcessStatus = 'DRAFT' | 'IN_REVIEW' | 'ACTIVE' | 'ARCHIVED';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type StepType =
  'START' | 'END' | 'TASK' | 'DECISION' | 'GATEWAY' | 'REVIEW';
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
