// components/events/types.ts
// Tipos do domínio de eventos corporativos (catálogo, os meus
// eventos, detalhe, dashboard organizador). Extraído de
// app/(platform)/events/page.tsx.

export type EventType =
  | 'TRAINING'
  | 'WORKSHOP'
  | 'WEBINAR'
  | 'LIVE_CLASS'
  | 'HACKATHON'
  | 'MENTORING'
  | 'CORPORATE'
  | 'ONBOARDING'
  | 'NETWORKING'
  | 'EXTERNAL'
  | 'TALK';
export type EventModalidade = 'ONLINE' | 'PRESENCIAL' | 'HYBRID';
export type EventVisibility = 'PUBLIC' | 'INTERNAL' | 'RESTRICTED';
export type EventStatus =
  'DRAFT' | 'PUBLISHED' | 'LIVE' | 'ENDED' | 'CANCELLED';
export type ParticipantStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'WAITLIST'
  | 'PRESENT'
  | 'ABSENT'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'REJECTED';

export interface Event {
  id: number;
  title: string;
  code?: string | null;
  description: string | null;
  objective?: string | null;
  type: EventType;
  category?: string | null;
  modalidade: EventModalidade;
  status: EventStatus;
  visibility?: EventVisibility;
  startAt: string;
  endAt: string;
  timezone?: string;
  location: string | null;
  address?: string | null;
  room?: string | null;
  meetingUrl: string | null;
  meetingPassword: string | null;
  maxCapacity: number;
  waitlistEnabled: boolean;
  requiresApproval?: boolean;
  registrationStartAt?: string | null;
  registrationEndAt?: string | null;
  targetAudience?: string | null;
  allowGuest?: boolean;
  certificateEnabled: boolean;
  evaluationEnabled?: boolean;
  checkinEnabled?: boolean;
  notificationsEnabled?: boolean;
  mandatory: boolean;
  bannerUrl: string | null;
  tags: string[];
  restrictedDeptIds?: number[];
  isFull: boolean;
  occupancyRate: number | null;
  avgNps?: number | null;
  avgRating?: number | null;
  organizer: { id: number; fullName: string; avatarUrl: string | null };
  responsible?: { id: number; fullName: string; avatarUrl: string | null } | null;
  department?: { id: number; name: string } | null;
  unit?: { id: number; name: string } | null;
  _count: { participants: number; feedbacks?: number };
  /** Participantes com estado CONFIRMED/PRESENT — só presente em GET /events. */
  confirmedCount?: number;
}

export interface MyEvents {
  upcoming: Array<{ id: number; status: ParticipantStatus; event: Event }>;
  past: Array<{ id: number; status: ParticipantStatus; event: Event }>;
}

export interface OrganizerDashboard {
  metrics: {
    totalEvents: number;
    upcomingEvents: number;
    totalParticipants: number;
    totalFeedbacks: number;
    avgNps: number | null;
  };
  events: Array<{
    id: number;
    title: string;
    type: string;
    status: string;
    startAt: string;
    participants: number;
    maxCapacity: number;
    occupancyRate: number | null;
    feedbackCount: number;
    avgNps: number | null;
  }>;
}

// Aba "Visão Geral" (docs/events.md #1) — GET /events/stats.
export interface EventDashboardUpcoming {
  id: number;
  title: string;
  type: EventType;
  status: EventStatus;
  startAt: string;
  location: string | null;
  modalidade: EventModalidade;
  _count: { participants: number };
}

export interface EventDashboard {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byDepartment: Record<string, number>;
  byUnit: Record<string, number>;
  totalParticipants: number;
  registeredParticipants: number;
  confirmedParticipants: number;
  checkinsDone: number;
  pendingRegistrations: number;
  pendingEvaluations: number;
  participationRate: number;
  upcomingCount: number;
  liveCount: number;
  endedCount: number;
  cancelledCount: number;
  upcomingEvents: EventDashboardUpcoming[];
}

export interface EventParticipant {
  userId: number;
  status: ParticipantStatus;
  user?: { fullName?: string; avatarUrl?: string | null };
}

export interface EventDetail extends Event {
  participants?: EventParticipant[];
}

// Aba "Calendário" (docs/events.md #3) — GET /events/calendar.
export interface EventCalendarItem {
  id: number;
  title: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  location: string | null;
  responsible: { id: number; fullName: string } | null;
  type: EventType;
  status: EventStatus;
  modalidade: EventModalidade;
  participants: number;
}

// Aba "Participantes" (docs/events.md #4) — GET /events/:id/participants.
export interface EventParticipantRow {
  id: number;
  userId: number;
  eventId: number;
  status: ParticipantStatus;
  note: string | null;
  registeredAt: string;
  confirmedAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  hasCertificate: boolean;
  hasEvaluation: boolean;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    employeeNumber: string | null;
    position: { name: string } | null;
    department: { id: number; name: string } | null;
    unit: { id: number; name: string } | null;
  };
}

export interface AddParticipantsResult {
  success: number;
  skipped: number;
  errors: number;
  total: number;
  details: { added: number[]; errors: Array<{ userId: number; error: string }> };
}

// Aba "Programação" (docs/events.md #5) — GET /events/sessions e
// /events/:id/sessions.
export type EventSessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface EventSession {
  id: number;
  eventId: number;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  location: string | null;
  room: string | null;
  responsibleId: number | null;
  speaker: string | null;
  capacity: number | null;
  status: EventSessionStatus;
  event?: { id: number; title: string; departmentId: number | null; unitId: number | null };
  responsible: { id: number; fullName: string } | null;
}

// Aba "Locais & Logística" (docs/events.md #6) — GET/PUT
// /events/:id/logistics.
export type EventLogisticsStatus = 'PLANNED' | 'IN_PROGRESS' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type EventEquipmentType =
  | 'PROJECTOR'
  | 'SCREEN'
  | 'SOUND_SYSTEM'
  | 'MICROPHONES'
  | 'CHAIRS'
  | 'TABLES'
  | 'COMPUTERS'
  | 'INTERNET'
  | 'MATERIALS'
  | 'SIGNAGE';

export interface EventLogistics {
  id: number;
  eventId: number;
  responsibleId: number | null;
  equipment: EventEquipmentType[];
  resourcesNeeded: string | null;
  suppliers: string | null;
  catering: string | null;
  transport: string | null;
  accommodation: string | null;
  security: string | null;
  decoration: string | null;
  budget: number | null;
  actualCost: number | null;
  status: EventLogisticsStatus;
  responsible: { id: number; fullName: string } | null;
}

// Aba "Oradores & Convidados" (docs/events.md #7) — GET/POST/PUT/DELETE
// /events/:id/speakers.
export type EventSpeakerType =
  | 'SPEAKER'
  | 'LECTURER'
  | 'MODERATOR'
  | 'GUEST'
  | 'PANELIST'
  | 'FACILITATOR'
  | 'INSTITUTIONAL_REP';
export type EventSpeakerStatus = 'INVITED' | 'CONFIRMED' | 'DECLINED' | 'CANCELLED';

export interface EventSpeaker {
  id: number;
  eventId: number;
  name: string;
  type: EventSpeakerType;
  organization: string | null;
  position: string | null;
  contact: string | null;
  bio: string | null;
  photoUrl: string | null;
  topic: string | null;
  sessionId: number | null;
  schedule: string | null;
  specialNeeds: string | null;
  fee: number | null;
  transport: string | null;
  accommodation: string | null;
  status: EventSpeakerStatus;
  session: { id: number; title: string; startAt: string; endAt: string } | null;
}

// Aba "Comunicação" (docs/events.md #8) — GET /events/communications e
// POST /events/:id/communications.
export type EventCommunicationType =
  | 'INVITATION'
  | 'CONFIRMATION'
  | 'REMINDER'
  | 'TIME_CHANGE'
  | 'LOCATION_CHANGE'
  | 'CANCELLATION'
  | 'INSTRUCTIONS'
  | 'THANK_YOU'
  | 'FOLLOW_UP';
export type EventCommunicationChannel = 'INNOVA_NOTIFICATION' | 'EMAIL' | 'SMS' | 'WHATSAPP';
export type EventCommunicationStatus = 'DRAFT' | 'SENT' | 'FAILED';

export interface EventCommunication {
  id: number;
  eventId: number;
  type: EventCommunicationType;
  subject: string;
  message: string;
  channel: EventCommunicationChannel;
  recipientCount: number;
  status: EventCommunicationStatus;
  sentAt: string | null;
  createdAt: string;
  event: { id: number; title: string };
  createdBy: { id: number; fullName: string };
}

// Aba "Check-in & Presença" (docs/events.md #9) — GET /events/checkins e
// PATCH /events/:id/participants/:userId/{checkin,checkout}.
export type EventCheckinMethod = 'QR_CODE' | 'MOBILE_APP' | 'CODE' | 'MANUAL';
export type EventCheckinState =
  | 'PENDENTE'
  | 'PRESENTE'
  | 'AUSENTE'
  | 'ENTRADA_REGISTADA'
  | 'SAIDA_REGISTADA';

export interface EventCheckinRow {
  id: number;
  userId: number;
  eventId: number;
  status: ParticipantStatus;
  registeredAt: string;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  checkinMethod: EventCheckinMethod | null;
  checkinNote: string | null;
  checkinState: EventCheckinState;
  durationMinutes: number | null;
  event: { id: number; title: string };
  user: {
    id: number;
    fullName: string;
    department: { id: number; name: string } | null;
    unit: { id: number; name: string } | null;
  };
}

// Presença por sessão (docs/events.md #9, eventos com Programação) — GET
// /events/:id/sessions/:sessionId/attendance.
export interface EventSessionAttendanceRow {
  userId: number;
  user: { id: number; fullName: string };
  checkedInAt: string | null;
  checkedOutAt: string | null;
  method: EventCheckinMethod | null;
  durationMinutes: number | null;
}

// Abas principais do módulo (docs/events.md) — ver constants.ts#NAV.
export type View =
  | 'overview'
  | 'events'
  | 'calendar'
  | 'participants'
  | 'schedule'
  | 'venues-logistics'
  | 'speakers-guests'
  | 'communication'
  | 'checkin-attendance'
  | 'evaluation'
  | 'reports';

export interface Nav {
  view: View;
}
