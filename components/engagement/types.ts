// components/engagement/types.ts
// Tipos do domínio "engagement" — movidos verbatim de
// app/(platform)/engagement/page.tsx.

export type Tab =
  'overview' | 'surveys' | 'recognition' | 'feedback' | 'analytics';

export interface EngagementUserRef {
  fullName?: string;
  avatarUrl?: string;
  department?: { name?: string };
  position?: { name?: string };
}

export interface Recognition {
  from?: EngagementUserRef;
  to?: EngagementUserRef;
  message: string;
  type: string;
  createdAt: string;
}

export interface PendingSurvey {
  id: number;
  title: string;
  type: string;
}

export interface DashboardData {
  kpis: {
    totalUsers: number;
    activeSurveys: number;
    engagementIndex: number;
    engagementTrend: number;
    participationRate: number;
    enps: number;
    totalRecognitions: number;
    totalFeedback: number;
    engagementLevel: string;
  };
  engagementHistory: {
    surveyId: number;
    title: string;
    avgScore: number;
    responses: number;
    date: string;
  }[];
  enpsBreakdown: {
    enps: number;
    promoterPct: number;
    detractorPct: number;
    total: number;
    label: string;
  };
  recentRecognitions: Recognition[];
}

export interface MySummary {
  pendingSurveys: number;
  surveys: PendingSurvey[];
  recognitionsReceived: number;
  xpPoints: number;
  lastMood: number | null;
  humanSuccessScore: number;
  hssGrade: string;
}

export interface SurveyItem {
  id: number;
  type: string;
  status: string;
  title: string;
  description?: string;
  _count?: { questions?: number; responses?: number };
  participationRate?: number;
  endDate?: string;
}

export interface LeaderboardEntry {
  user?: EngagementUserRef;
  points?: number;
  count?: number;
}

export interface FeedbackItem {
  from?: EngagementUserRef;
  createdAt: string;
  type: string;
  message: string;
  reply?: string;
}

export interface EngagementIndex {
  level: string;
  currentIndex: number;
  trend: number;
  latestParticipation: number;
  totalUsers: number;
  history: Array<{
    title: string;
    responses: number;
    date: string;
    avgScore: number;
  }>;
}

export interface HeatmapRow {
  department: string;
  value: number | null;
}
