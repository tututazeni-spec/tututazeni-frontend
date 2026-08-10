// components/trainings/types.ts
// Tipos do domínio de treinamentos (catálogo, detalhe, os meus
// treinamentos, dashboard admin). Extraído de
// app/(platform)/trainings/page.tsx.

export type TrainingType = 'PRESENTIAL' | 'ONLINE' | 'HYBRID';
export type TrainingLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type TrainingStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ParticipantStatus =
  'WAITLIST' | 'REGISTERED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED' | 'COMPLETED';

export interface Training {
  id: number;
  title: string;
  shortDescription: string | null;
  description: string | null;
  type: TrainingType;
  level: TrainingLevel;
  status: TrainingStatus;
  category: string | null;
  tags: string[];
  language: string;
  workloadHours: number | null;
  thumbnailUrl: string | null;
  mandatory: boolean;
  issueCertificate: boolean;
  cost: number | null;
  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  instructor: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  } | null;
  avgRating?: number;
  sessions?: Session[];
  ratings?: Rating[];
  _count: { sessions: number; participants: number; ratings: number };
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

export type View = 'catalog' | 'detail' | 'my-trainings' | 'dashboard';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
