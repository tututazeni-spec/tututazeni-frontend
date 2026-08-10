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
  description: string | null;
  type: EventType;
  modalidade: EventModalidade;
  status: EventStatus;
  startAt: string;
  endAt: string;
  location: string | null;
  meetingUrl: string | null;
  meetingPassword: string | null;
  maxCapacity: number;
  waitlistEnabled: boolean;
  certificateEnabled: boolean;
  mandatory: boolean;
  bannerUrl: string | null;
  tags: string[];
  isFull: boolean;
  occupancyRate: number | null;
  avgNps?: number | null;
  avgRating?: number | null;
  organizer: { id: number; fullName: string; avatarUrl: string | null };
  _count: { participants: number; feedbacks?: number };
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

export interface EventParticipant {
  userId: number;
  status: ParticipantStatus;
  user?: { fullName?: string; avatarUrl?: string | null };
}

export interface EventDetail extends Event {
  participants?: EventParticipant[];
}

export type View = 'catalog' | 'my-events' | 'detail' | 'organizer' | 'create';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'detail'> } | { view: 'detail'; selectedId: number };
