// components/history/types.ts
// Tipos do domínio de histórico/timeline: eventos, marcos,
// estatísticas e auditoria. Extraído de
// app/(platform)/history/page.tsx.

export type Tab = 'timeline' | 'milestones' | 'stats' | 'audit';

export interface Milestone {
  icon: string;
  title: string;
  date: string;
  impactScore: number;
  type: string;
}

export interface HistoryStats {
  streak?: number;
  activeDays?: number;
  completions?: number;
  xpPoints?: number;
  heatmap?: Record<string, number>;
  byCategory?: Record<string, number>;
}

export interface AuditActionCount {
  action: string;
  count: number;
}
export interface AuditAlert {
  action: string;
  user?: { fullName?: string };
  userId: number;
  timestamp: string;
}
export interface AuditStats {
  total?: number;
  byAction?: AuditActionCount[];
  topUsers?: unknown[];
  recentAlerts?: AuditAlert[];
}
export interface UpcomingAnniversary {
  fullName: string;
  years: number;
}
export interface UpcomingData {
  anniversaries?: UpcomingAnniversary[];
}

export interface TimelineEvent {
  id: string;
  source: string;
  timestamp: string;
  category: string;
  module: string;
  impactScore: number;
  milestone: boolean;
  icon: string;
  title: string;
  action: string;
  entity: string;
  entityId?: string | number;
  userId: number;
  user?: { fullName: string; avatarUrl?: string };
}

export interface GroupedEvents {
  month: string;
  items: TimelineEvent[];
}
