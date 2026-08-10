// components/leader/types.ts
// Tipos do domínio do Leader Hub: dashboard, equipa, pipeline de
// talento e PDIs da equipa. Extraído de app/(platform)/leader/page.tsx.

export type Tab = 'dashboard' | 'team' | 'performance' | 'pipeline' | 'plans';

export interface LeaderAlert {
  severity: string;
  message: string;
}
export interface LeaderRecommendation {
  urgency: string;
  message: string;
  action?: string;
}
export interface RecentBadge {
  user?: { fullName?: string };
  badge?: { name?: string };
}
export interface LeaderKpis {
  teamSize?: number;
  avgPerfScore?: number;
  perfStatus?: string;
  activePlans?: number;
  atRiskCount?: number;
  activeEnrollments?: number;
  completedThisMonth?: number;
  engagementResponses?: number;
  pendingLeaves?: number;
}
export interface LeaderDashboard {
  kpis?: LeaderKpis;
  alerts?: LeaderAlert[];
  recentBadges?: RecentBadge[];
}
export interface LeaderRecommendations {
  recommendations?: LeaderRecommendation[];
}

export interface TeamMemberEntry {
  id: number;
  fullName: string;
  avatarUrl?: string;
  position?: { name?: string };
  tenure?: number;
  activePlan?: boolean;
  planProgress?: number;
  latestPerfScore?: number | null;
  riskLevel: string;
}
export interface TeamSummary {
  headcount: number;
  atRisk: number;
  avgScore?: number;
  avgTenureMonths?: number;
}
export interface TeamData {
  data?: TeamMemberEntry[];
  summary?: TeamSummary;
}

export interface PipelinePerson {
  user: { fullName: string; avatarUrl?: string; position?: { name?: string } };
  score?: number;
}
export interface TalentPipeline {
  hipos?: PipelinePerson[];
  promotionReady?: PipelinePerson[];
  developing?: PipelinePerson[];
  atRisk?: PipelinePerson[];
}

export interface TeamPlanEntry {
  id: number;
  user?: { fullName?: string; avatarUrl?: string };
  health: string;
  name: string;
  actCompleted: number;
  totalActions: number;
  progress: number;
}
