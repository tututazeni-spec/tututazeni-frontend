// components/avatar-training/types.ts
// Espelha as respostas de src/avatar-training (docs/Avatar_Training.md §13).

export type AvatarStatus = 'ACTIVE' | 'TESTING' | 'INACTIVE' | 'ARCHIVED';
export type AvatarType = 'IMAGE' | 'AVATAR_2D' | 'AVATAR_3D' | 'VIDEO';
export type ProgramStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type ExperienceType =
  | 'GUIDED_LESSON'
  | 'Q_AND_A'
  | 'ROLE_PLAY'
  | 'PROCEDURE_DEMO'
  | 'PRACTICAL_ASSESSMENT'
  | 'PERSONALIZED_REVIEW';
export type AssignmentStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED';
export type AttemptStatus =
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'SUBMITTED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABANDONED';

export interface TrainingAvatar {
  id: number;
  name: string;
  description: string | null;
  avatarType: AvatarType;
  imageUrl: string | null;
  language: string;
  tone: string | null;
  specialty: string | null;
  provider: string | null;
  status: AvatarStatus;
  lastTestedAt: string | null;
}

export interface AvatarProgram {
  id: number;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  experienceType: ExperienceType;
  status: ProgramStatus;
  version: number;
  durationMinutes: number | null;
  language?: string;
  targetDepartmentIds?: number[];
  targetRoleNames?: string[];
  certificateEnabled?: boolean;
  avatar: { id: number; name: string; imageUrl: string | null } | null;
  course: { id: number; title: string } | null;
  _count?: { sessions: number };
}

export interface MyAssignment {
  id: number;
  sessionId: number;
  status: AssignmentStatus;
  dueDate: string | null;
  mandatory: boolean;
  session: {
    id: number;
    title: string;
    experienceType: ExperienceType;
    durationMinutes: number | null;
    program: { id: number; title: string; courseId: number | null };
  };
  attempts: {
    id: number;
    status: AttemptStatus;
    progress: number;
    score: number | null;
    passed: boolean | null;
  }[];
}

export interface StepQuestion {
  kind: 'SINGLE' | 'TRUE_FALSE' | 'SHORT';
  prompt?: string;
  options?: string[];
}

export interface RoomStep {
  key: string;
  title: string;
  type: 'CONTENT' | 'QUESTION' | 'SCENARIO' | 'EXERCISE';
  content?: string;
  resourceUrl?: string;
  question?: StepQuestion;
  mandatory?: boolean;
}

export interface RoomInteraction {
  id: number;
  sequence: number;
  interactionType:
    | 'AVATAR_MESSAGE'
    | 'USER_MESSAGE'
    | 'USER_ANSWER'
    | 'STEP_ADVANCE'
    | 'FEEDBACK'
    | 'PAUSE'
    | 'RESUME'
    | 'HELP_REQUEST'
    | 'SYSTEM';
  stepKey: string | null;
  content: string;
  createdAt: string;
}

export interface Room {
  attempt: {
    id: number;
    status: AttemptStatus;
    currentStep: number;
    progress: number;
    textOnly: boolean;
  };
  session: {
    id: number;
    title: string;
    version: number;
    program: { id: number; title: string };
  };
  notice: string;
  steps: RoomStep[];
  currentStep: RoomStep | null;
  interactions: RoomInteraction[];
}

export interface CompleteResult {
  attemptId: number;
  status: AttemptStatus;
  score: number | null;
  passed: boolean | null;
  passingScore: number | null;
}

export interface Indicator {
  code: string;
  label: string;
  value: number | null;
  unit: string;
  status: 'OK' | 'NO_DATA' | 'RESTRICTED';
  formula: string;
  source: string;
  note?: string;
  updatedAt: string;
  period: { from: string; to: string };
}

export interface Overview {
  period: { from: string; to: string };
  scope: 'ALL' | 'TEAM' | 'SELF';
  generatedAt: string;
  truncated: boolean;
  indicators: Indicator[];
  alerts: { code: string; severity: 'WARNING' | 'CRITICAL'; message: string }[];
}

export interface ProgressRow {
  id: number;
  status: AssignmentStatus;
  dueDate: string | null;
  attemptsCount: number;
  bestScore: number | null;
  evolution: number | null;
  user?: { id: number; fullName: string };
  session?: { id: number; title: string; program?: { id: number; title: string } };
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface HistoryRow {
  id: number;
  attemptNumber: number;
  status: AttemptStatus;
  score: number | null;
  passed: boolean | null;
  progress: number;
  startedAt: string;
  completedAt: string | null;
  assignment: {
    session: { id: number; title: string; program: { id: number; title: string } };
  };
}

export interface ReportCatalogItem {
  type: string;
  title: string;
}

export interface Report {
  type: string;
  title: string;
  period: { from: string; to: string };
  generatedAt: string;
  noData: boolean;
  rows: Record<string, unknown>[];
  source: string;
  formula: string;
  truncated?: boolean;
}

export interface ProviderHealth {
  textMode: { available: boolean };
  providers: {
    provider: string;
    serviceType: string;
    status: string;
    note?: string;
    costPerUnit?: number;
    monthlyCostLimit?: number | null;
  }[];
  lastIncident: { provider: string; errorCode: string | null; createdAt: string } | null;
}

export type TabId =
  | 'overview'
  | 'room'
  | 'simulations'
  | 'programs'
  | 'builder'
  | 'knowledge'
  | 'assessments'
  | 'competencies'
  | 'avatars'
  | 'progress'
  | 'reports'
  | 'settings'
  | 'history';

export type SourceType = 'COURSE' | 'LESSON' | 'DOCUMENT' | 'LIBRARY_ITEM';

export interface BuilderQuestion {
  kind: 'SINGLE' | 'TRUE_FALSE' | 'SHORT';
  prompt?: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  weight?: number;
}

export interface BuilderStep {
  key: string;
  title: string;
  type: 'CONTENT' | 'QUESTION' | 'SCENARIO' | 'EXERCISE';
  content?: string;
  resourceUrl?: string;
  question?: BuilderQuestion;
  mandatory?: boolean;
}

export interface KnowledgeSource {
  id: number;
  sourceType: SourceType;
  sourceId: string;
  title: string | null;
  status: string;
}

export interface RubricCriterion {
  key: string;
  label: string;
  weight: number;
}

export interface SessionAssessment {
  passingScore: number;
  maxAttempts: number;
  requireFormalAssessment: boolean;
  assessmentId: number | null;
  rubricConfig?: RubricCriterion[];
}

export interface SessionListItem {
  id: number;
  programId: number;
  title: string;
  status: ProgramStatus;
  experienceType: ExperienceType;
  version: number;
  program: { id: number; title: string; courseId: number | null };
}

export interface SessionDetail extends SessionListItem {
  objectives: string[];
  welcomeMessage: string | null;
  durationMinutes: number | null;
  mandatory: boolean;
  steps: BuilderStep[];
  assessment: SessionAssessment | null;
  knowledgeSources: KnowledgeSource[];
}

export interface CompetencyResult {
  id: number;
  attemptId: number;
  competencyId: number;
  competencyName: string | null;
  score: number;
  levelBefore: number | null;
  levelAfter: number | null;
  applied: boolean;
  evidence: string | null;
  assessedAt: string;
}

export interface Recommendation {
  programId: number;
  title: string;
  difficulty: string;
  levelFit: 'MATCH' | 'EASIER' | 'HARDER';
  sessions: { id: number; title: string }[];
  reasons: { type: string; detail: string }[];
}
