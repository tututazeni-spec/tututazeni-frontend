// components/automation/types.ts

export type Tab =
  | 'overview'
  | 'rules'
  | 'builder'
  | 'schedules'
  | 'executions'
  | 'approvals'
  | 'reports'
  | 'settings';

export type RuleStatus = 'ACTIVE' | 'PAUSED' | 'ERROR';

export interface RuleStats {
  total: number;
  success: number;
  failed: number;
  successRate: number;
}

export interface AutomationRule {
  id: number;
  name: string;
  active: boolean;
  category?: string;
  trigger: string;
  action: string;
  stats?: RuleStats;
  code?: string | null;
  description?: string | null;
  module?: string | null;
  status?: RuleStatus;
  ownerId?: string | null;
  ownerName?: string | null;
  priority?: number;
  lastRunAt?: string | null;
  lastRunStatus?: string | null;
  createdAt?: string;
  updatedAt?: string;
  notes?: string | null;
}

export interface RulesExportResponse {
  filename: string;
  content: string;
}

export interface OverviewData {
  period: { from: string; to: string; granularity: string };
  cards: {
    totalRules: number;
    activeRules: number;
    executions: number;
    failedExecutions: number;
    waiting: number;
    timeSaved: {
      minutes: number;
      hours: number;
      estimate: boolean;
      basisMinutesPerExecution: number;
    };
  };
  byStatus: Record<string, number>;
  timeline: {
    date: string;
    total: number;
    success: number;
    failed: number;
    successRate: number | null;
  }[];
  byModule: { label: string; count: number }[];
  failureCauses: { label: string; count: number }[];
  successRate: number | null;
  truncated: boolean;
}

export interface RunAllResponse {
  executed: number;
}

export interface Execution {
  id: number;
  ruleId: number;
  status: string;
  error?: string | null;
  startedAt?: string | null;
}

export interface ExecutionsResponse {
  data: Execution[];
  meta?: { total: number };
}

export interface AutomationTemplate {
  name: string;
  description?: string;
  category?: string;
  trigger: string;
  action: string;
}

export interface ApplyTemplateResponse {
  message?: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface RecentFail {
  ruleId: number;
  error?: string;
}

export interface AutomationStats {
  executions?: { total?: number; successRate?: number; failed?: number };
  rules?: { active?: number };
  byCategory?: CategoryCount[];
  recentFails?: RecentFail[];
}
