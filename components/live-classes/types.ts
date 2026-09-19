// components/live-classes/types.ts
// Tipos do domínio "aulas ao vivo". Espelham live-classes.dto.ts.

export type LiveClassType =
  | 'AULA'
  | 'WEBINAR'
  | 'WORKSHOP'
  | 'SESSAO_PRATICA'
  | 'SESSAO_ESCLARECIMENTO'
  | 'MENTORIA'
  | 'TUTORIA'
  | 'SESSAO_REVISAO';

export type LiveClassStatus =
  | 'AGENDADA'
  | 'EM_PREPARACAO'
  | 'EM_CURSO'
  | 'CONCLUIDA'
  | 'CANCELADA'
  | 'ADIADA';

export type LiveClassRecurrence = 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM';

export type LiveClassEnrollmentMode = 'AUTO' | 'MANUAL' | 'SELF' | 'APPROVAL';

export type SessionModality = 'PRESENTIAL' | 'ONLINE' | 'HYBRID';

export type LiveAttendanceStatus = 'PRESENTE' | 'AUSENTE' | 'ATRASADO' | 'PARCIAL' | 'JUSTIFICADO';

export interface InstructorRef {
  id: number;
  name: string;
  email?: string | null;
}

export interface LiveClass {
  id: number;
  topic: string;
  scheduledAt: string;
  duration: number;
  recordingUrl?: string;
  zoomMeetingId?: string;
  course?: { id: number; title: string };
  _count?: { attendances: number; messages: number; sessions?: number };
  postEvaluation?: { id: number; averageScore: number };

  code?: string | null;
  description?: string | null;
  type: LiveClassType;
  status: LiveClassStatus;
  moduleId?: number | null;
  lessonId?: number | null;
  module?: { id: number; title: string } | null;
  lesson?: { id: number; title: string } | null;
  instructorId?: number | null;
  coInstructorId?: number | null;
  instructor?: InstructorRef | null;
  coInstructor?: InstructorRef | null;

  recurrence: LiveClassRecurrence;
  recurrenceEndDate?: string | null;
  recurrenceDaysOfWeek: number[];
  timezone: string;

  modality: SessionModality;
  location?: string | null;
  building?: string | null;
  room?: string | null;
  capacity?: number | null;

  enrollmentMode: LiveClassEnrollmentMode;
  maxParticipants?: number | null;
  waitlistEnabled: boolean;
  targetDeptIds: number[];
  targetUnitIds: number[];
  targetPositionIds: number[];

  objectives?: string | null;
  agenda?: string | null;
  topics: string[];
  materialDocumentIds: number[];

  attendanceAutoRegister: boolean;
  attendanceRequired: boolean;
  minAttendancePercent: number;
  lateToleranceMinutes: number;

  recordSession: boolean;
  recordingExpiresAt?: string | null;
  recordingPublishedAt?: string | null;
  allowRecordingDownload: boolean;

  evaluationRequired: boolean;
  notifySettings?: Record<string, boolean> | null;

  postponedFromAt?: string | null;
  postponeReason?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
}

export interface LiveClassSession {
  id: number;
  liveClassId: number;
  seq: number;
  sessionDate: string;
  durationMinutes: number;
  instructorId?: number | null;
  instructor?: InstructorRef | null;
  location?: string | null;
  meetingUrl?: string | null;
  status: LiveClassStatus;
  notes?: string | null;
  recordingUrl?: string | null;
  recordingPublishedAt?: string | null;
  liveClass?: { id: number; topic: string; modality: SessionModality; course?: { id: number; title: string } };
  _count?: { attendances: number };
}

export interface PaginatedClasses {
  data: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}

export interface PaginatedSessions {
  data: LiveClassSession[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export type ClassStatus = 'live' | 'upcoming' | 'past';

export interface LiveClassesDashboard {
  cards: {
    scheduled: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    today: number;
    thisWeek: number;
    upcoming: number;
    recordingsAvailable: number;
    totalParticipants: number;
    averageAttendancePercent: number;
    hoursDelivered: number;
  };
  byModality: { modality: SessionModality; count: number }[];
  byInstructor: { instructorId: number | null; instructorName: string; count: number }[];
}

export interface LiveClassCalendarEvent {
  id: string;
  liveClassId: number;
  sessionId: number | null;
  title: string;
  start: string;
  end: string;
  modality: SessionModality;
  status: LiveClassStatus;
  courseTitle: string | null;
  instructorName: string | null;
}

// ─── Participantes (secção 6) / Presenças (secção 10) ───────────────────────

export interface LiveParticipant {
  id: number;
  liveClassId: number;
  userId: number;
  joinedAt: string | null;
  leftAt: string | null;
  sessionId: number | null;
  status: LiveAttendanceStatus | null;
  attendancePercent: number | null;
  justification: string | null;
  durationMinutes: number | null;
  computedStatus: LiveAttendanceStatus;
  user: {
    id: number;
    fullName: string;
    email: string;
    employeeNumber: string | null;
    department: { id: number; name: string } | null;
    unit: { id: number; name: string } | null;
  };
  liveClass: {
    id: number;
    topic: string;
    scheduledAt: string;
    duration: number;
    course?: { id: number; title: string } | null;
    postEvaluation?: { averageScore: number } | null;
  };
  session: { id: number; seq: number; sessionDate: string } | null;
}

export interface PaginatedMeta<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

// ─── Formadores (secção 7) ──────────────────────────────────────────────────

export interface LiveInstructor {
  id: number;
  name: string;
  entity: string | null;
  email: string | null;
  phone: string | null;
  specialties: string[];
  trainingAreas: string[];
  certifications: string | null;
  professionalExperience: string | null;
  availability: string | null;
  status: string;
  user?: { id: number; fullName: string; avatarUrl: string | null } | null;
  liveClassStats: {
    scheduled: number;
    completed: number;
    hoursMinistered: number;
    participants: number;
    avgRating: number;
    courses: string[];
  };
}

// ─── Salas & Links (secção 8) ───────────────────────────────────────────────

export interface VirtualRoom {
  liveClassId: number;
  topic: string;
  course?: { id: number; title: string } | null;
  instructor?: { id: number; name: string } | null;
  status: LiveClassStatus;
  scheduledAt: string;
  platform: string;
  meetingId: string | null;
  link: string | null;
  sessions: { id: number; seq: number; meetingUrl: string | null; sessionDate: string; status: LiveClassStatus }[];
}

// ─── Gravações (secção 9) ───────────────────────────────────────────────────

export interface RecordingRow {
  liveClassId: number;
  sessionId: number | null;
  sessionSeq: number | null;
  topic: string;
  course?: { id: number; title: string } | null;
  instructor?: { id: number; name: string } | null;
  date: string;
  durationMinutes: number;
  participants: number;
  recordingUrl: string;
  publishedAt: string | null;
  expiresAt: string | null;
  allowDownload: boolean | null;
}
