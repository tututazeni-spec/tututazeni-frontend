// components/live-classes/types.ts
// Tipos do domínio "aulas ao vivo" — movidos verbatim de
// app/(platform)/live-classes/page.tsx.

export interface LiveClass {
  id: number;
  topic: string;
  scheduledAt: string;
  duration: number;
  recordingUrl?: string;
  zoomMeetingId?: string;
  course?: { id: number; title: string };
  _count?: { attendances: number; messages: number };
  postEvaluation?: { id: number; averageScore: number };
}

export interface PaginatedClasses {
  data: LiveClass[];
  total: number;
  page: number;
  totalPages: number;
}

export type ClassStatus = 'live' | 'upcoming' | 'past';
