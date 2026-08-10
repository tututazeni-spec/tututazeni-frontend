// components/leadership/types.ts
// Tipos do domínio de liderança (programas, equipa, feedback 360°,
// ranking, kudos). Extraído de app/(platform)/leadership/page.tsx.

export type ProgramLevel = 'INITIAL' | 'INTERMEDIATE' | 'ADVANCED';
export type ParticipantStatus =
  'ENROLLED' | 'IN_PROGRESS' | 'COMPLETED' | 'WITHDRAWN';
export type HealthStatus = 'GREEN' | 'YELLOW' | 'RED';
export type Competency =
  | 'COMMUNICATION'
  | 'DEVELOPMENT'
  | 'RECOGNITION'
  | 'AUTONOMY'
  | 'FAIRNESS'
  | 'EXAMPLE'
  | 'STRATEGY'
  | 'RESILIENCE';

export interface LeadershipProgram {
  id: number;
  name: string;
  description: string | null;
  level: ProgramLevel;
  status: string;
  durationWeeks: number | null;
  mandatory: boolean;
  _count: { participants: number };
}

export interface Participant {
  id: number;
  userId: number;
  programId: number;
  progress: number;
  status: ParticipantStatus;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export interface TeamMember {
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
    department: { name: string } | null;
  };
  latestReview: {
    score: number | null;
    category: string | null;
    status: string;
  } | null;
  pendingApprovals: number;
  feedbackCount: number;
  statusColor: HealthStatus;
}

export interface TeamDashboard {
  team: TeamMember[];
  alerts: Array<{
    userId: number;
    name: string;
    type: string;
    message: string;
  }>;
  teamHealth: {
    globalScore: number;
    healthStatus: HealthStatus;
    metrics: {
      engagementScore: number;
      turnoverRate: number;
      absenteeismRate: number;
      pdisCompletedPct: number;
      evaluationsOnTimePct: number;
    };
  };
  total: number;
}

export interface Feedback360Summary {
  leaderId: number;
  totalResponses: number;
  avgScore: number;
  byCompetency: Array<{
    competency: Competency;
    avgScore: number;
    count: number;
    insight: string | null;
  }>;
  qualitative: (string | null)[];
}

export interface LeadershipScore {
  userId: number;
  score: number;
  classification: string;
  calculatedAt: string;
}

export interface MyProgramEnrollment {
  id: number;
  progress: number;
  status: string;
  program?: { name?: string; level?: ProgramLevel };
}

export interface OneOnOne {
  id: number;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  agenda: string | null;
  meetingUrl: string | null;
  subordinate: { id: number; fullName: string; avatarUrl: string | null };
}

export interface KudosItem {
  id: number;
  message: string;
  badge: string | null;
  createdAt: string;
  sender: { id: number; fullName: string; avatarUrl: string | null };
  receiver: { id: number; fullName: string; avatarUrl: string | null };
}

export interface MyDashboardData {
  score: LeadershipScore | null;
  programs?: MyProgramEnrollment[];
  upcoming1on1s?: OneOnOne[];
  recentKudos?: KudosItem[];
}

export interface RankingEntry {
  userId: number;
  score: number;
  classification: string;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
    position: { name: string } | null;
  };
}

export type View =
  'my-dashboard' | 'team' | 'programs' | 'feedback360' | 'ranking' | 'kudos';
