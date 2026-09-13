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
export type TrainingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
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
  totalCost?: number;
  canManage?: boolean;
  publishedAt: string | null;
  instructor: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  } | null;
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
  trainings: { total: number; published: number; mandatory: number };
  participants: { total: number; completed: number };
  completionRate: number;
  avgRating: number;
  topTrainings: Training[];
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
  | 'manage-detail';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  | { view: Exclude<View, 'detail' | 'manage-detail'> }
  | { view: 'detail'; selectedId: number }
  | { view: 'manage-detail'; selectedId: number };
