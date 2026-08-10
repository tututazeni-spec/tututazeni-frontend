// components/automation/types.ts

export type Tab = 'rules' | 'executions' | 'templates' | 'stats';

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
