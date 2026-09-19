// components/trainings/types.ts
// Tipos do domínio de treinamentos (catálogo, detalhe, os meus
// treinamentos, dashboard admin). Extraído de
// app/(platform)/trainings/page.tsx.

export type TrainingType =
  | 'PRESENTIAL'
  | 'ONLINE'
  | 'HYBRID'
  | 'VIRTUAL_ROOM'
  | 'ELEARNING'
  | 'WORKSHOP'
  | 'SEMINAR'
  | 'COACHING'
  | 'MENTORING';
export type TrainingLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type TrainingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'CANCELLED' | 'COMPLETED';
export type TrainingPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TrainingPlanPeriod = 'ANNUAL' | 'QUARTERLY' | 'EXTRAORDINARY';
export type TrainingPlanStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED'
  | 'ARCHIVED';
export type ParticipantStatus =
  | 'WAITLIST'
  | 'PENDING_APPROVAL'
  | 'REGISTERED'
  | 'ATTENDED'
  | 'ABSENT'
  | 'CANCELLED'
  | 'REJECTED'
  | 'COMPLETED';
export type TrainingAssessmentRole =
  | 'INITIAL'
  | 'FINAL'
  | 'SATISFACTION_SURVEY'
  | 'INSTRUCTOR_EVALUATION';

export interface TrainingDocument {
  id: number;
  name: string;
  fileUrl: string;
  category: string | null;
  createdAt: string;
  uploadedBy: { id: number; fullName: string } | null;
}

export interface TrainingCompetencyLink {
  id: number;
  competency: { id: number; name: string };
}

export interface TrainingCoInstructorLink {
  id: number;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

export interface TrainingAssessmentLink {
  id: number;
  role: TrainingAssessmentRole;
  assessment: { id: number; title: string; type: string; status: string };
}

export interface Training {
  id: number;
  title: string;
  code: string | null;
  shortDescription: string | null;
  description: string | null;
  objectives: string | null;
  targetAudience: string | null;
  type: TrainingType;
  level: TrainingLevel;
  status: TrainingStatus;
  category: string | null;
  thematicArea: string | null;
  tags: string[];
  language: string;
  workloadHours: number | null;
  thumbnailUrl: string | null;
  prerequisites: string | null;
  trainingEntity: string | null;
  classDescription: string | null;
  modalityDetails: string | null;
  mandatory: boolean;
  passingScore: number;
  issueCertificate: boolean;
  cost: number | null;
  completionDeadlineDays: number | null;
  startDate: string | null;
  endDate: string | null;
  schedule: string | null;
  roomLocation: string | null;
  capacity: number | null;
  plannedSessionsCount: number | null;
  requiresApproval: boolean;
  requiredResources: string[];
  instructorCost: number | null;
  materialCost: number | null;
  transportCost: number | null;
  foodCost: number | null;
  lodgingCost: number | null;
  otherCosts: number | null;
  plannedBudget: number | null;
  cancellationReason: string | null;
  priority: TrainingPriority;
  responsibleId: number | null;
  trainingPlanId: number | null;
  courseId: number | null;
  learningPathId: number | null;
  targetDeptIds: number[];
  targetUnitIds: number[];
  targetPositionIds: number[];
  totalCost?: number;
  canManage?: boolean;
  publishedAt: string | null;
  instructor: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  } | null;
  responsible?: { id: number; fullName: string } | null;
  createdBy: { id: number; fullName: string } | null;
  coInstructors?: TrainingCoInstructorLink[];
  competencies?: TrainingCompetencyLink[];
  documents?: TrainingDocument[];
  assessmentLinks?: TrainingAssessmentLink[];
  avgRating?: number;
  sessions?: Session[];
  ratings?: Rating[];
  _count: { sessions: number; participants: number; ratings: number };
}

export interface TrainingResults {
  trainingId: number;
  title: string;
  enrolled: number;
  participants: number;
  completed: number;
  completionRate: number;
  attendanceRate: number;
  avgScore: number | null;
  satisfaction: number;
  totalCost: number;
  costPerParticipant: number;
}

export interface Session {
  id: number;
  sessionDate: string;
  sessionEndDate: string | null;
  durationMinutes: number;
  modality: string;
  location: string | null;
  meetingUrl: string | null;
  maxParticipants: number;
  waitlistEnabled: boolean;
  _count: { participants: number };
}

export interface Participant {
  id: number;
  status: ParticipantStatus;
  finalScore: number | null;
  attendedHours: number | null;
  completedAt: string | null;
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    department: { name: string } | null;
  };
}

export interface Rating {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: number; fullName: string; avatarUrl: string | null };
}

export interface Dashboard {
  trainings: {
    total: number;
    planned: number;
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    mandatory: number;
    activeClasses: number;
  };
  participants: { registered: number; inTraining: number; completed: number };
  upcomingSessions: {
    id: number;
    trainingId: number;
    title: string;
    date: string;
    location: string | null;
  }[];
  activeInstructors: number;
  roomsInUse: number;
  completionRate: number;
  participationRate: number;
  avgRating: number;
  hoursPerEmployee: number;
  costPerParticipant: number;
  costPerHour: number;
  approvalRate: number;
  budgetExecutionRate: number;
  planExecutionRate: number;
  topTrainings: Training[];
}

// ─── Plano de Formação (docs/trainings-detalhado.md pt.2) ────────────────────

export interface TrainingPlan {
  id: number;
  name: string;
  code: string | null;
  year: number;
  period: TrainingPlanPeriod;
  description: string | null;
  objectives: string | null;
  identifiedNeeds: string | null;
  strategicPriorities: string | null;
  targetDeptIds: number[];
  targetUnitIds: number[];
  targetPositionIds: number[];
  targetAudience: string | null;
  expectedParticipants: number | null;
  expectedHours: number | null;
  modality: TrainingType | null;
  plannedBudget: number | null;
  priority: TrainingPriority;
  responsibleId: number | null;
  approverId: number | null;
  startDate: string | null;
  endDate: string | null;
  status: TrainingPlanStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
  notes: string | null;
  responsible: { id: number; fullName: string } | null;
  approver: { id: number; fullName: string } | null;
  createdBy: { id: number; fullName: string } | null;
  competencies?: { id: number; competency: { id: number; name: string } }[];
  trainings?: Array<
    Pick<
      Training,
      'id' | 'title' | 'status' | 'type' | 'startDate' | 'endDate' | 'plannedBudget' | 'workloadHours'
    > & { cost: number | null; _count: { participants: number } }
  >;
  _count?: { trainings: number };
}

export interface TrainingPlanExecution {
  planned: { participants: number; hours: number; budget: number; trainingsCount: number };
  realized: {
    participants: number;
    hours: number;
    budget: number;
    trainingsCount: number;
    completedTrainings: number;
  };
  executionRate: {
    participants: number | null;
    hours: number | null;
    budget: number | null;
    trainings: number | null;
  };
}

// ─── Calendário (docs/trainings-detalhado.md pt.4) ───────────────────────────

export interface CalendarEvent {
  kind: 'session' | 'training';
  id: number;
  trainingId: number;
  title: string;
  trainingType: TrainingType;
  status: TrainingStatus;
  start: string | null;
  end: string | null;
  modality: string | null;
  location: string | null;
  instructor: { id: number; fullName: string } | null;
  participants: number;
  maxParticipants: number | null;
}

export interface CalendarResponse {
  from: string;
  to: string;
  events: CalendarEvent[];
}

export interface MyTrainingEntry {
  id: number;
  status: ParticipantStatus;
  finalScore: number | null;
  session?: {
    sessionDate: string;
    training: Pick<
      Training,
      'id' | 'title' | 'thumbnailUrl' | 'type' | 'workloadHours'
    >;
  } | null;
}

export type View =
  | 'catalog'
  | 'detail'
  | 'my-trainings'
  | 'dashboard'
  | 'manage'
  | 'manage-detail'
  | 'plans'
  | 'plan-detail'
  | 'calendar';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  | { view: Exclude<View, 'detail' | 'manage-detail' | 'plan-detail'> }
  | { view: 'detail'; selectedId: number }
  | { view: 'manage-detail'; selectedId: number }
  | { view: 'plan-detail'; selectedId: number };
