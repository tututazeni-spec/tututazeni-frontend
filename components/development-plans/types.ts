// components/development-plans/types.ts
// Tipos do domínio de planos de desenvolvimento individual (PDI):
// planos, acções, metas, checkpoints, stats e equipa. Extraído de
// app/(platform)/development-plans/page.tsx.

import type { DirectoryUser } from '@/components/users/types';

export type PlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'PAUSED'
  | 'AT_RISK'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';

// Secção 2 do doc "Criar Novo PDI" — porque foi criado.
export type PdiOrigin =
  | 'PERFORMANCE_REVIEW'
  | 'EVALUATION_360'
  | 'COMPETENCY_MAP'
  | 'COMPETENCY_GAP'
  | 'CAREER_PLAN'
  | 'SUCCESSION'
  | 'LEADERSHIP_PROGRAM'
  | 'MANAGER_REQUEST'
  | 'EMPLOYEE_REQUEST'
  | 'ONBOARDING'
  | 'ROLE_CHANGE'
  | 'PROMOTION'
  | 'OPERATIONAL_NEED'
  | 'STRATEGIC_NEED'
  | 'OTHER';

export type CompetencyGapPriority = 'LOW' | 'MEDIUM' | 'HIGH';

// Secção 19 — avaliação final no encerramento.
export type PdiFinalResult = 'GOAL_ACHIEVED' | 'PARTIALLY_ACHIEVED' | 'NOT_ACHIEVED';
export type PdiOverallResult = 'EXCEEDED' | 'MET' | 'PARTIALLY_MET' | 'NOT_MET';

// Secção 20 — o que acontece depois de o PDI terminar.
export type PdiNextSteps =
  | 'NEW_PDI'
  | 'CONTINUE_PDI'
  | 'NEW_COMPETENCY_ASSESSMENT'
  | 'LEARNING_PATH'
  | 'LEADERSHIP_PROGRAM'
  | 'ROLE_PREPARATION'
  | 'SUCCESSION_PLAN'
  | 'NONE';
export type ActionType =
  | 'COURSE'
  | 'MENTORING'
  | 'COACHING'
  | 'READING'
  | 'PROJECT'
  | 'JOB_ROTATION'
  | 'MICROLEARNING'
  | 'WORKSHOP'
  | 'CERTIFICATION'
  | 'OTHER';
export type ActionStatus =
  'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED' | 'CANCELLED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Plan {
  id: number;
  name: string;
  goal: string;
  status: PlanStatus;
  priority: Priority;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  overallProgress: number;
  actionProgress?: number;
  avgGoalProgress?: number;
  overdueActions?: number;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
  manager: { id: number; fullName: string; avatarUrl: string | null } | null;
  actions?: Action[];
  goals?: Goal[];
  checkpoints?: Checkpoint[];
  certificates?: unknown[];
  _count: { actions: number; goals: number; checkpoints: number };

  // ── Origem e diagnóstico (secções 2-3) ──────────────────────────
  origin?: PdiOrigin | null;
  originJustification?: string | null;
  strengths?: string | null;
  developmentNeeds?: string | null;

  // ── Ligações (secções 4 e 8) ─────────────────────────────────────
  sourceReviewId?: number | null;
  sourceReview?: { id: number; score: number | null; category: string | null } | null;
  careerPlanId?: number | null;
  careerPlan?: {
    id: number;
    title: string;
    targetDate: string | null;
    currentRole: { id: number; name: string } | null;
    targetRole: { id: number; name: string } | null;
  } | null;
  careerReadinessPercent?: number | null;
  successionPlanId?: number | null;

  // ── Competências a desenvolver (secção 5) ────────────────────────
  competencyGaps?: CompetencyGap[];

  // ── Avaliação final e próximos passos (secções 19-20) ────────────
  finalResult?: PdiFinalResult | null;
  overallResult?: PdiOverallResult | null;
  employeeComment?: string | null;
  managerComment?: string | null;
  rhComment?: string | null;
  employeeAcceptedAt?: string | null;
  nextSteps?: PdiNextSteps | null;
}

export interface CompetencyGap {
  id: number;
  competencyId: number;
  competency: { id: number; name: string; category?: string } | null;
  currentLevel: number | null;
  targetLevel: number | null;
  priority: CompetencyGapPriority;
}

export interface Action {
  id: number;
  title: string;
  description: string | null;
  type: ActionType;
  status: ActionStatus;
  progress: number;
  xpReward: number;
  dueDate: string | null;
  completedAt: string | null;
  mandatory: boolean;
  workloadHours: number | null;
  evidence?: Evidence[];
}

export interface Evidence {
  id: number;
  title: string;
  url: string | null;
  notes: string | null;
  evidenceType: string;
  createdAt: string;
}

export interface Goal {
  id: number;
  title: string;
  description: string | null;
  successIndicator: string | null;
  progress: number;
  weight: number;
  dueDate: string | null;
  completedAt: string | null;
}

export interface Checkpoint {
  id: number;
  title: string;
  type: string;
  status: string;
  scheduledAt: string;
  completedAt: string | null;
  selfScore: number | null;
}

export interface MyStats {
  plans: {
    total: number;
    active: number;
    completed: number;
    cancelled: number;
  };
  actions: Record<string, number>;
  completionRate: number;
  totalXp: number;
}

export interface TeamPlanSummary {
  id: number;
  name: string;
  progress: number;
  overdueActions?: number;
  pendingApproval?: boolean;
  user: {
    fullName: string;
    avatarUrl: string | null;
    position?: { name: string } | null;
  };
}

export type View = 'my-plans' | 'detail' | 'team' | 'create';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };

// ─── CreatePlanWizard ───────────────────────────────────────────────────────
// Rascunhos de linha para as secções com lista (competências/objectivos/
// acções/checkpoints) — tudo string no formulário, convertido ao persistir.

export interface CompetencyGapDraft {
  key: number;
  id: number | null; // já persistido no backend (addCompetencyGap)?
  competencyId: string;
  currentLevel: string;
  targetLevel: string;
  priority: CompetencyGapPriority;
}

export interface GoalDraft {
  key: number;
  id: number | null;
  title: string;
  description: string;
  successIndicator: string;
  dueDate: string;
  weight: string;
}

export interface ActionDraft {
  key: number;
  id: number | null;
  title: string;
  description: string;
  type: ActionType;
  courseId: string;
  workloadHours: string;
  dueDate: string;
  mandatory: boolean;
}

export interface CheckpointDraft {
  key: number;
  id: number | null;
  title: string;
  description: string;
  scheduledAt: string;
  type: 'QUICK' | 'STRUCTURED';
}

export interface WizardForm {
  // 1. Identificação
  employee: DirectoryUser | null;
  manager: DirectoryUser | null;
  name: string;
  period: string;
  priority: Priority;
  startDate: string;
  endDate: string;
  durationPreset: string;
  performanceCycleId: string;
  // 2. Diagnóstico
  origin: PdiOrigin | '';
  originJustification: string;
  strengths: string;
  developmentNeeds: string;
  goal: string;
  // 3. Competências
  competencyGaps: CompetencyGapDraft[];
  // 4. Objectivos (desenvolvimento + carreira)
  goals: GoalDraft[];
  careerLinked: boolean;
  careerPlanId: string;
  careerReadinessPercent: string;
  // 5. Plano de acção
  actions: ActionDraft[];
  // 6. Indicadores e acompanhamento
  checkpoints: CheckpointDraft[];
}
