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
  | 'NO_SHOW';

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
