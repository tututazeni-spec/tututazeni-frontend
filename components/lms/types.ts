// components/lms/types.ts

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

export const LEVEL_COLORS: Record<string, string> = {
  BASIC: 'bg-green-100 text-green-800',
  INTERMEDIATE: 'bg-blue-100 text-blue-800',
  ADVANCED: 'bg-purple-100 text-purple-800',
  EXPERT: 'bg-red-100 text-red-800',
};

export const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  PAUSED: 'bg-gray-100 text-gray-600',
  DROPPED: 'bg-red-100 text-red-700',
};

export const PLATFORM_ICONS: Record<string, string> = {
  ZOOM: '🟦',
  TEAMS: '🟪',
  MEET: '🟩',
  WEBEX: '🟧',
  OTHER: '🔗',
};
