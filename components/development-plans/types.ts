// components/development-plans/types.ts
// Tipos do domínio de planos de desenvolvimento individual (PDI):
// planos, acções, metas, checkpoints, stats e equipa. Extraído de
// app/(platform)/development-plans/page.tsx.

export type PlanStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'OVERDUE';
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
