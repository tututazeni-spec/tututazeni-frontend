// Contratos de GET /monitoring/{overview,modules,processes} (src/monitoring/*).

export type MonitoringStatus =
  'NORMAL' | 'ATENCAO' | 'DEGRADADO' | 'CRITICO' | 'INDISPONIVEL';

export type StatusCounts = Record<MonitoringStatus, number>;

export interface QueueDetail {
  key: string;
  available: boolean;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

export interface Occurrence {
  at: string;
  kind: 'ALERTA' | 'INCIDENTE' | 'AUTOMACAO' | 'INTEGRACAO' | 'PROCESSO';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  source: string;
}

export interface OverviewData {
  generatedAt: string;
  platform: {
    status: MonitoringStatus;
    statusLabel: string;
    reasons: string[];
    database: { available: boolean; latencyMs: number | null };
    modules: { total: number; counts: StatusCounts };
  };
  criticalAlerts: { critical: number; open: number };
  processes: {
    overdue: number;
    atRisk: number;
    blockedSteps: number;
    urgentInProgress: number;
  };
  automations: {
    failed24h: number;
    total24h: number;
    failureRatePercent: number | null;
  };
  integrations: { active: number; unavailable: number; syncFailed24h: number };
  jobs: {
    running: number;
    automationsRunning: number;
    automationsPending: number;
    queues: {
      waiting: number;
      active: number;
      delayed: number;
      failed: number;
    };
    queueDetail: QueueDetail[];
  };
  activeUsers: { count: number; windowMinutes: number };
  pendingCritical: {
    blockedSteps: number;
    overdueProcesses: number;
    failedAutomations: number;
    failedQueueJobs: number;
  };
  sla: { atRisk: number; breached: number };
  incidents: {
    open: number;
    operational: number;
    security: number;
    critical: number;
  };
  latestOccurrences: Occurrence[];
}

export interface ModuleRow {
  key: string;
  module: string;
  metric: string;
  status: MonitoringStatus;
  statusLabel: string;
  reasons: string[];
  availability: boolean;
  latencyMs: number | null;
  operations: {
    last24h: number | null;
    previous24h: number | null;
    last7d: number | null;
  };
  errors: {
    last24h: number | null;
    ratePercent: number | null;
    tracked: boolean;
  };
  backlog: number;
  dependencies: { key: string; module: string; status: MonitoringStatus }[];
}

export interface ModulesData {
  generatedAt: string;
  summary: {
    modules: number;
    overall: MonitoringStatus;
    counts: StatusCounts;
    avgLatencyMs: number;
  };
  modules: ModuleRow[];
}

export interface ProcessInstanceRow {
  id: number;
  code: string | null;
  title: string;
  process: string;
  status: string;
  priority: string;
  startedAt: string;
  slaDeadline: string | null;
  hoursOverdue: number | null;
  responsible: { id: number; name: string } | null;
}

export interface ProcessesData {
  generatedAt: string;
  summary: {
    running: number;
    onHold: number;
    completed30d: number;
    cancelled30d: number;
    overdue: number;
    atRisk: number;
    blocked: number;
    pendingSteps: number;
    blockedSteps: number;
    completionRatePercent: number | null;
    avgCompletionHours: number | null;
    slaCompliancePercent: number | null;
    started30d: number;
    failures: {
      rejectedSteps30d: number;
      integrationFailures30d: number;
      total30d: number;
    };
  };
  overdue: ProcessInstanceRow[];
  blocked: ProcessInstanceRow[];
  overdueByResponsible: {
    userId: number | null;
    name: string | null;
    overdue: number;
  }[];
}
