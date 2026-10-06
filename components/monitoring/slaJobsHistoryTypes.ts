// Contratos de GET /monitoring/{jobs,sla,history} (src/monitoring/monitoring-{jobs,sla,history}.service.ts).

export type JobState = 'active' | 'failed' | 'delayed' | 'waiting' | 'completed';

export interface JobRow {
  id: string;
  queue: string;
  name: string;
  state: JobState;
  attemptsMade: number;
  attemptsMax: number;
  retrying: boolean;
  createdAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  nextRunAt: string | null;
  error: string | null;
}

export interface JobQueueSummary {
  key: string;
  available: boolean;
  counts: {
    active: number;
    waiting: number;
    delayed: number;
    failed: number;
    completed: number;
  };
  error?: string;
}

export interface CronRow {
  name: string;
  running: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

export interface JobsData {
  generatedAt: string;
  summary: {
    executed: number;
    running: number;
    waiting: number;
    failed: number;
    scheduled: number;
    successRatePercent: number | null;
    avgDurationMs: number | null;
    retrying: number;
    cronJobs: number;
    cronJobsStopped: number;
    nextExecutionAt: string | null;
    queuesUnavailable: number;
  };
  queues: JobQueueSummary[];
  running: JobRow[];
  failed: JobRow[];
  scheduled: JobRow[];
  waiting: JobRow[];
  executed: JobRow[];
  crons: CronRow[];
  automations: { running: number; pending: number; failed24h: number; note: string };
  note: string;
}

export type SlaState = 'CUMPRIDO' | 'EM_RISCO' | 'VIOLADO' | 'SEM_DADOS';

export interface SlaService {
  key: string;
  label: string;
  metric: string;
  target: number;
  actual: number | null;
  targetSource: 'SLA' | 'INTERNO';
  state: SlaState;
  detail: string | null;
}

export interface SlaData {
  generatedAt: string;
  windowDays: number;
  sla: {
    configured: boolean;
    id: string | null;
    name: string;
    uptimePercent: number;
    maxLatencyMs: number;
    maxErrorRatePercent: number;
    incidentResponseMinutes: number;
  };
  current: {
    availabilityPercent: number;
    state: SlaState;
    downtimeMinutes: number;
    allowedDowntimeMinutes: number;
    errorBudgetUsedPercent: number | null;
    errorBudgetRemainingMinutes: number;
    latencyCompliancePercent: number | null;
    errorCompliancePercent: number | null;
    mttrMinutes: number | null;
    resolvedIncidents: number;
  };
  services: SlaService[];
  atRisk: { key: string; label: string; state: SlaState; detail: string | null }[];
  components: {
    component: string;
    incidents: number;
    downtimeMinutes: number;
    availabilityPercent: number;
  }[];
  violations: {
    availabilityBreached: boolean;
    responseMissed: number;
    criticalIncidents: number;
    slaAlerts: {
      id: string;
      at: string;
      severity: string;
      title: string;
      message: string;
      resolved: boolean;
    }[];
  };
  note: string;
}

export type HistoryKind = 'ALERTA' | 'INCIDENTE' | 'AUTOMACAO' | 'INTEGRACAO';

export interface HistoryEvent {
  at: string;
  kind: HistoryKind;
  event: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  source: string;
  ref: string | null;
}

export interface HistoryData {
  generatedAt: string;
  windowDays: number;
  kind: HistoryKind | null;
  summary: { events: number; byKind: Record<string, number>; critical: number };
  events: HistoryEvent[];
  truncated: boolean;
  platform: {
    day: string;
    samples: number;
    avgLatencyMs: number | null;
    maxP95Ms: number;
    avgErrorRatePercent: number | null;
    maxCpuPercent: number;
    maxMemoryPercent: number;
    maxRequestsPerMinute: number;
  }[];
  queues: { day: string; queue: string; maxPending: number; maxFailed: number }[];
  retention: {
    retentionDays: number;
    hourlyRetentionDays: number;
    hourlyRows: number;
    queueRows: number;
    oldestHourlyAt: string | null;
  };
  note: string;
}
