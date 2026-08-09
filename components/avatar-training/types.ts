// components/avatar-training/types.ts
// Tipos do domínio "avatar training" (roleplay com IA) — movidos verbatim
// de app/(platform)/avatar-training/page.tsx.

export type Tab =
  'home' | 'scenarios' | 'session' | 'history' | 'leaderboard' | 'analytics';

export interface Scenario {
  id: number;
  title: string;
  description?: string;
  category: string;
  difficulty: string;
  estimatedMinutes?: number;
  xpReward?: number;
  thumbnailUrl?: string;
  completions?: number;
  avgScore?: number;
  bestSession?: { score: number } | null;
  competency?: { name: string };
}

export interface SessionMessage {
  role: 'USER' | 'AVATAR' | 'SYSTEM';
  content: string;
  timestamp: string;
  score?: number;
  behavioral?: Record<string, number>;
}

export interface ActiveSession {
  id: number;
  scenarioId: number;
  conversationHistory: SessionMessage[];
  scenario: { title: string; objective?: string; turns: unknown[] };
  openingMessage?: string;
  avatar?: { name: string; avatarImageUrl?: string; role: string };
}

export interface HistorySession {
  id: number;
  scenario?: {
    title?: string;
    category?: string;
    competency?: { name: string };
  };
  startedAt: string;
  status: string;
  score?: number | null;
}

export interface HistoryStats {
  total: number;
  completed: number;
  avgScore?: number | null;
  totalXP?: number;
  streak?: number;
}

export interface MyHistory {
  stats: HistoryStats;
  sessions: HistorySession[];
}

export interface LeaderboardEntry {
  rank: number;
  user?: { fullName?: string; department?: { name?: string } };
  avgScore?: number;
  score?: number;
  sessions?: number;
}

export interface TopScenarioStat {
  scenario?: { title?: string };
  completions: number;
  avgScore?: number | null;
}

export interface CategoryBreakdownItem {
  category: string;
  count: number;
}

export interface RecentCompletion {
  user?: { fullName?: string };
  scenario?: { title?: string };
}

export interface AnalyticsDashboard {
  kpis: {
    totalScenarios?: number;
    activeSessions?: number;
    completedSessions?: number;
    avgScore?: number | null;
  };
  topScenarios?: TopScenarioStat[];
  categoryBreakdown?: CategoryBreakdownItem[];
  recentCompletions?: RecentCompletion[];
}

export interface StartSessionResponse {
  session: { id: number; scenario: ActiveSession['scenario'] };
  openingMessage: string;
  avatar?: ActiveSession['avatar'];
}

export interface MessageResponse {
  avatarResponse: string;
  turnScore?: number;
  behavioral?: Record<string, number>;
  runningScore: number | null;
  isLastTurn: boolean;
}

export interface SessionResult {
  finalScore?: number;
  grade?: string;
  xpEarned?: number;
  durationSeconds?: number;
  behavioral?: Record<string, number>;
  strengths?: string[];
  improvements?: string[];
  nextScenario?: Scenario;
}
