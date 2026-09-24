// components/onboarding/types.ts
// Tipos do domínio de onboarding (plano do colaborador, tarefas,
// documentos, pesquisas, dashboard, templates). Extraído de
// app/(platform)/onboarding/page.tsx.

export type OnboardingStatus =
  'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'ON_HOLD';
export type TaskStatus =
  'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'SKIPPED';
export type TaskCategory =
  | 'DOCUMENTS'
  | 'IT_ACCESS'
  | 'TRAINING'
  | 'SOCIAL'
  | 'BENEFITS'
  | 'ADMIN'
  | 'MEETING'
  | 'POLICIES'
  | 'EVALUATION'
  | 'ONE_ON_ONE';
export type TaskPhase =
  | 'PRE_BOARDING'
  | 'DAY_1'
  | 'WEEK_1'
  | 'DAY_30'
  | 'DAY_60'
  | 'DAY_90'
  | 'INTEGRATION'
  | 'FOLLOW_UP'
  | 'CONCLUSION';
// Espelham os enums Prisma TaskType / ResponsibleRole (schema.prisma).
export type TaskType =
  'TASK' | 'COURSE' | 'LEARNING_PATH' | 'PROCESS' | 'DOCUMENT' | 'MEETING';
export type ResponsibleRole =
  'SELF' | 'HR' | 'MANAGER' | 'IT' | 'BUDDY' | 'EXTERNAL';
export type DocStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TemplateTask {
  id: number;
  templateId: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  type: TaskType;
  phase: TaskPhase;
  responsible: ResponsibleRole;
  isMandatory: boolean;
  dueDayOffset: number | null;
  xpReward: number;
  requiresApproval: boolean;
  requiresEvidence: boolean;
  seq: number;
}

export interface TaskInstance {
  id: number;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  evidenceComment: string | null;
  evidenceUrl: string | null;
  skipReason: string | null;
  templateTask: TemplateTask;
}

export interface OnboardingPlan {
  id: number;
  userId: number;
  status: OnboardingStatus;
  startDate: string;
  expectedEndDate: string | null;
  completedAt: string | null;
  xpEarned: number;
  progress?: number;
  completedTasks?: number;
  totalTasks?: number;
  daysIn?: number;
  byPhase?: Record<TaskPhase, TaskInstance[]>;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
  };
  template: {
    id: number;
    name: string;
    durationDays: number;
    welcomeVideoUrl: string | null;
  };
  buddy: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
    position: { name: string } | null;
  } | null;
  manager: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
    position?: { name: string } | null;
  } | null;
  hrResponsible: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
    position?: { name: string } | null;
  } | null;
  taskInstances: TaskInstance[];
  documents: OnboardingDoc[];
  surveys: Survey[];
}

export interface OnboardingDoc {
  id: number;
  documentType: string;
  fileUrl: string;
  status: DocStatus;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

// Espelha o enum Prisma SurveyMilestone (schema.prisma).
export type SurveyMilestone = 'DAY_1' | 'DAY_7' | 'DAY_30' | 'DAY_90';

export interface Survey {
  id: number;
  milestone: SurveyMilestone;
  score: number;
  enps: number | null;
  comment: string | null;
  createdAt: string;
}

export interface Dashboard {
  summary: {
    total: number;
    byStatus: Record<string, number>;
    overdueTasks: number;
    avgSurveyScore: number;
    completionRate: number;
    pendingDocuments: number;
    pendingTrainings: number;
    newHires: number;
    pendingIntegrationEvals: number;
    byDepartment: Record<string, number>;
    byUnit: Record<string, number>;
    byResponsible: Record<string, number>;
  };
  active: Array<OnboardingPlan & { daysIn: number }>;
  upcomingStarts: Array<{
    id: number;
    startDate: string;
    user: { id: number; fullName: string; avatarUrl: string | null };
    template: { name: string };
  }>;
}

export interface TemplateTaskSummary {
  id: number;
  category: TaskCategory;
  title: string;
  xpReward: number;
}

export interface OnboardingTemplate {
  id: number;
  name: string;
  description: string | null;
  company?: string | null;
  location?: string | null;
  objective?: string | null;
  version?: number;
  active: boolean;
  durationDays: number;
  position?: { name: string } | null;
  department?: { name: string } | null;
  unit?: { id: number; name: string } | null;
  _count?: { tasks: number; plans: number };
  tasks?: TemplateTaskSummary[];
}

// GET /onboarding/templates/:id — devolve as tarefas completas (ordenadas
// por seq) e a contagem de planos que usam o template.
export interface OnboardingTemplateDetail {
  id: number;
  name: string;
  description: string | null;
  objective: string | null;
  version: number;
  company: string | null;
  location: string | null;
  active: boolean;
  durationDays: number;
  welcomeVideoUrl: string | null;
  positionId: number | null;
  departmentId: number | null;
  unitId: number | null;
  tasks: TemplateTask[];
  _count?: { plans: number };
}

// ─── Planos (gestão RH) ──────────────────────────────────────────────────────

// GET /onboarding — item da lista paginada. `findAll` NÃO calcula progresso
// (só o `_count`); o progresso vem do detalhe.
export interface OnboardingPlanListItem {
  id: number;
  status: OnboardingStatus;
  startDate: string;
  expectedEndDate: string | null;
  createdAt: string;
  xpEarned: number;
  progress: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    employeeNumber: string | null;
    position: { name: string } | null;
    department: { id: number; name: string } | null;
  };
  template: { id: number; name: string; durationDays: number };
  buddy: { id: number; fullName: string; avatarUrl: string | null } | null;
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  hrResponsible: { id: number; fullName: string } | null;
  _count: { taskInstances: number; documents: number };
}

// GET /onboarding/:id — plano + progresso + tarefas agrupadas por fase.
export interface PlanTaskInstance extends TaskInstance {
  approvedBy: { id: number; fullName: string } | null;
  approvalNote: string | null;
}

export interface OnboardingPlanDetail {
  id: number;
  status: OnboardingStatus;
  startDate: string;
  expectedEndDate: string | null;
  completedAt: string | null;
  xpEarned: number;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  byPhase: Partial<Record<TaskPhase, PlanTaskInstance[]>>;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
  };
  template: {
    id: number;
    name: string;
    durationDays: number;
    welcomeVideoUrl: string | null;
  };
  buddy: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
    position: { name: string } | null;
  } | null;
  manager: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
  } | null;
  hrResponsible: {
    id: number;
    fullName: string;
    email?: string | null;
    avatarUrl: string | null;
  } | null;
  documents: OnboardingDoc[];
  surveys: Survey[];
  /** EvaluationRequest já despoletado para este plano (ponto 9 — Avaliação
   *  de Integração), ou null se ainda não foi pedida. */
  integrationEvalRequestId: number | null;
}

// ─── Fase B (docs/onboarding.md pontos 4-7) ─────────────────────────────────

// GET /onboarding/templates/:id/stages — tarefas do template agrupadas por
// fase, com agregados derivados (não configuração persistida — ver
// decisão 1 do plano).
export interface OnboardingStageGroup {
  phase: TaskPhase;
  tasks: TemplateTask[];
  taskCount: number;
  mandatoryCount: number;
  minDayOffset: number | null;
  maxDayOffset: number | null;
  responsible: ResponsibleRole | null;
}

export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

// GET /onboarding/tasks — vista transversal (qualquer plano).
export interface OnboardingTaskListItem {
  id: number;
  planId: number;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  skipReason: string | null;
  priority: TaskPriority;
  templateTask: TemplateTask;
  plan: { id: number; user: { id: number; fullName: string; avatarUrl: string | null } };
}

// GET /onboarding/documents — dois grupos distintos (ver comentário no
// backend: sem FK entre OnboardingDocument e a tarefa que o pediu).
export interface OnboardingDocumentsResponse {
  submitted: Array<
    OnboardingDoc & {
      planId: number;
      plan: { id: number; user: { id: number; fullName: string; avatarUrl: string | null } };
      uploadedBy: { id: number; fullName: string };
      validatedBy: { id: number; fullName: string } | null;
    }
  >;
  pendingSubmission: Array<{
    taskInstanceId: number;
    planId: number;
    documentType: string;
    dueDate: string | null;
    plan: { id: number; user: { id: number; fullName: string; avatarUrl: string | null } };
  }>;
}

// GET /onboarding/training
export interface OnboardingTrainingRow {
  taskInstanceId: number;
  planId: number;
  user: { id: number; fullName: string; avatarUrl: string | null };
  title: string;
  phase: TaskPhase;
  course: { id: number; title: string } | null;
  isMandatory: boolean;
  dueDate: string | null;
  taskStatus: TaskStatus;
  enrollment: {
    status: string;
    progress: number;
    completedAt: string | null;
    hasCertificate: boolean;
  } | null;
}

// ─── Fase C (docs/onboarding.md pontos 8-10) ────────────────────────────────

export type CheckinType = 'DAY_1' | 'WEEK_1' | 'DAY_30' | 'DAY_60' | 'DAY_90' | 'CUSTOM';
export type CheckinStatus = 'PENDING' | 'COMPLETED' | 'SKIPPED';

export interface OnboardingCheckin {
  id: number;
  type: CheckinType;
  status: CheckinStatus;
  dueDate: string | null;
  completedAt: string | null;
  difficulties: string | null;
  positives: string | null;
  supportNeeds: string | null;
  managerFeedback: string | null;
  employeeFeedback: string | null;
  nextActions: string | null;
  plan: {
    id: number;
    user: { id: number; fullName: string; avatarUrl: string | null };
    manager: { id: number; fullName: string } | null;
    buddy: { id: number; fullName: string } | null;
  };
  responsible: { id: number; fullName: string } | null;
}

export interface OnboardingIntegrationEvaluation {
  planId: number;
  user: { id: number; fullName: string; avatarUrl: string | null };
  onboardingCompletedAt: string | null;
  evaluation: {
    id: number;
    status: string;
    dueDate: string | null;
    completedAt: string | null;
    evaluator: { id: number; fullName: string };
  } | null;
}

export interface OnboardingReportOverview {
  total: number;
  completionRate: number;
  avgDurationDays: number;
  tasksCompleted: number;
  tasksOverdue: number;
  documentsPending: number;
  avgFeedback: number;
  byDepartment: Record<string, number>;
  byUnit: Record<string, number>;
  byResponsible: Record<string, number>;
}

// Ids dos separadores de topo (app/(platform)/onboarding/page.tsx),
// espelhando docs/onboarding.md — ver TABS em constants.ts. Fase A cobre
// my-plan/overview/plans/templates; Fase B/C acrescentam os restantes.
export type OnboardingTabId =
  | 'my-plan'
  | 'overview'
  | 'plans'
  | 'templates'
  | 'stages'
  | 'tasks'
  | 'documents'
  | 'training'
  | 'checkins'
  | 'integration-evaluations'
  | 'reports';
