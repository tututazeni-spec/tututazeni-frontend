// components/performance/types.ts
// Tipos do domínio de performance (ciclos, reviews, goals, feedback,
// equipa, 9-box, analytics). Extraído de
// app/(platform)/performance/page.tsx.

export type CycleStatus = 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
export type ReviewStatus =
  | 'DRAFT'
  | 'PENDING_SELF'
  | 'PENDING_MANAGER'
  | 'PENDING_360'
  | 'CALIBRATION'
  | 'PUBLISHED'
  | 'DISPUTE'
  | 'FINALIZED';
export type ReviewType = 'SELF' | 'MANAGER' | 'PEER' | 'R360';
export type GoalStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'COMPLETED';
export type FeedbackType = 'PRAISE' | 'IMPROVEMENT' | 'GENERAL';
export type PerfCategory = 'LOW' | 'MEDIUM' | 'HIGH';

// Configurações da avaliação (secção 21 do formulário) — serializadas em
// PerformanceCycle.rules (JSON) no backend. Ver performance.dto.ts
// PerformanceCycleRulesDto — mesmos campos, mesmos defaults.
export interface CycleRules {
  allowSelfEvaluation?: boolean;
  allowComments?: boolean;
  requireCommentsBelow?: number;
  allowAttachments?: boolean;
  allowManagerEvaluation?: boolean;
  allowRhEvaluation?: boolean;
  calibrationEnabled?: boolean;
  pdiEnabled?: boolean;
  feedbackMeetingEnabled?: boolean;
  allowDispute?: boolean;
  requireAcceptance?: boolean;
}

export interface Cycle {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  type: string;
  status: CycleStatus;
  startDate: string;
  endDate: string;
  selfEvalDeadline: string | null;
  managerEvalDeadline: string | null;
  targetDepartmentIds: number[];
  ownerId: number | null;
  goalsWeight: number;
  competenciesWeight: number;
  behaviorsWeight: number;
  scoreScale: number;
  // O backend guarda isto como JSON serializado (String?) — nunca vem
  // pré-parseado da API. Usar parseCycleRules() (utils.ts) para ler.
  rules: string | null;
  _count: { reviews: number };
}

export interface Review {
  id: number;
  userId: number;
  cycleId: number;
  type: ReviewType;
  status: ReviewStatus;
  score: number | null;
  potentialScore: number | null;
  feedback: string | null;
  category: PerfCategory | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    position: { name: string } | null;
  };
  reviewer: { id: number; fullName: string } | null;
  cycle: { id: number; name: string; type: string };
}

export interface Goal {
  id: number;
  userId: number;
  cycleId: number;
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  progress: number;
  weight: number;
  unit: string | null;
  status: GoalStatus;
  dueDate: string | null;
}

export interface Feedback {
  id: number;
  type: FeedbackType;
  message: string;
  visibleToUser: boolean;
  createdAt: string;
  giver: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export interface TeamMember {
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
  latestReview: Review | null;
  avgGoalProgress: number;
  goalCount: number;
  feedbackCount: number;
  pendingSelfReview: boolean;
  status: string;
}

export interface Analytics {
  totalReviews: number;
  avgScore: number;
  minScore: number | null;
  maxScore: number | null;
  byCategory: Array<{ category: string; _count: number }>;
  byStatus: Array<{ status: string; _count: number }>;
  topPerformers: Review[];
  highDivergences: Array<{ userId: number; divergence: number }>;
}

export interface NineBoxUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
  position: { name: string } | null;
}

export interface NineBoxGrid {
  grid: Record<string, Array<{ user: NineBoxUser; placement: unknown }>>;
  cycleId: number | null;
}

export interface MyPerformanceHistory {
  reviews: Review[];
  goals: Goal[];
  feedback: Feedback[];
  avgScore: number;
}

export type View = 'dashboard' | 'cycles' | 'team' | 'matrix9box' | 'analytics';
