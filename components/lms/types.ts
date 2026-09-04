// components/lms/types.ts

import { Video, Link2, type LucideIcon } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/Badge';

export interface Path {
  id: string;
  code: string;
  name: string;
  description: string | null;
  level: string;
  estimatedHours: number | null;
  _count?: { enrollments: number };
}

export interface MyPath {
  id: string;
  progress: number;
  status: string;
  completedCourseIds: string[];
  startedAt: string;
  path: {
    name: string;
    code: string;
    level: string;
    estimatedHours: number | null;
    thumbnail: string | null;
  };
}

export interface Analytics {
  totalHours: number;
  coursesCompleted: number;
  pathsCompleted: number;
  sessionsAttended: number;
  streakDays: number;
}

export interface Session {
  id: string;
  code: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  duration: number;
  platform: string;
  status: string;
  meetingUrl: string | null;
  maxAttendees: number | null;
  instructor?: { fullName: string } | null;
  _count?: { attendances: number };
}

// Escala de dificuldade crescente — mapeada para os 4 intents semânticos
// disponíveis no Badge da fundação (não existe um 5º intent "purple").
export const LEVEL_INTENT: Record<string, BadgeProps['intent']> = {
  BASIC: 'success',
  INTERMEDIATE: 'info',
  ADVANCED: 'warning',
  EXPERT: 'danger',
};

export const STATUS_INTENT: Record<string, BadgeProps['intent']> = {
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  PAUSED: 'neutral',
  DROPPED: 'danger',
};

export const PLATFORM_ICONS: Record<string, LucideIcon> = {
  ZOOM: Video,
  TEAMS: Video,
  MEET: Video,
  WEBEX: Video,
  OTHER: Link2,
};
