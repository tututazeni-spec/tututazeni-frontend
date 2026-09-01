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
  | 'MEETING';
export type TaskPhase =
  'PRE_BOARDING' | 'DAY_1' | 'WEEK_1' | 'DAY_30' | 'DAY_60' | 'DAY_90';
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
  };
  active: Array<OnboardingPlan & { daysIn: number }>;
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
  active: boolean;
  durationDays: number;
  position?: { name: string } | null;
  department?: { name: string } | null;
  _count?: { tasks: number; plans: number };
  tasks?: TemplateTaskSummary[];
}

// GET /onboarding/templates/:id — devolve as tarefas completas (ordenadas
// por seq) e a contagem de planos que usam o template.
export interface OnboardingTemplateDetail {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  durationDays: number;
  welcomeVideoUrl: string | null;
  positionId: number | null;
  departmentId: number | null;
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
  xpEarned: number;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
  template: { id: number; name: string; durationDays: number };
  buddy: { id: number; fullName: string; avatarUrl: string | null } | null;
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
}

export type View = 'my-plan' | 'plans' | 'dashboard' | 'templates';
