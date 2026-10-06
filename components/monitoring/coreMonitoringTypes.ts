// Contratos de GET /monitoring/{automations,integrations,performance,alerts,
// incidents,health} (src/monitoring/monitoring-*.service.ts).

import type { MonitoringStatus } from './platformTypes';

// ── §4 Automações ────────────────────────────────────────────────────────────

export interface AutomationsData {
  generatedAt: string;
  windowHours: number;
  summary: {
    activeRules: number;
    executed24h: number;
    success24h: number;
    failed24h: number;
    successRatePercent: number | null;
    running: number;
    pending: number;
    waitingFlows: number;
    retries24h: number;
    retriesScheduled: number;
    deadLettersOpen: number;
    schedulesInError: number;
    avgExecutionMs: number | null;
    lastExecutionAt: string | null;
    nextExecutionAt: string | null;
  };
  failuresByRule: {
    ruleId: number;
    name: string | null;
    failed24h: number;
    lastRunAt: string | null;
    lastRunStatus: string | null;
  }[];
  errors: {
    executionId: string;
    ruleId: number;
    rule: string;
    module: string | null;
    at: string;
    attempt: number;
    nextRetryAt: string | null;
    errorCode: string | null;
    errorStep: string | null;
    message: string | null;
  }[];
  history: {
    executionId: string;
    ruleId: number;
    rule: string;
    status: string;
    startedAt: string;
    durationMs: number | null;
    attempt: number;
    currentStep: string | null;
  }[];
  upcoming: {
    scheduleId: string;
    name: string;
    ruleId: number;
    rule: string;
    nextRunAt: string | null;
    lastRunAt: string | null;
    lastRunStatus: string | null;
  }[];
  daily: { day: string; success: number; failed: number; successRatePercent: number }[];
}

// ── §5 Integrações ───────────────────────────────────────────────────────────

export interface IntegrationRow {
  id: number | string;
  name: string;
  family: string;
  familyLabel: string;
  type: string;
  platform: string | null;
  direction: string | null;
  connectionState: string;
  active: boolean;
  status: MonitoringStatus;
  statusLabel: string;
  reasons: string[];
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  stale: boolean;
  down: boolean;
  syncs24h: number;
  apiCalls24h: number;
  failures24h: number;
  recordsProcessed24h: number;
  recordsFailed24h: number;
  avgResponseMs: number | null;
}

export interface IntegrationsData {
  generatedAt: string;
  windowHours: number;
  summary: {
    total: number;
    active: number;
    unavailable: number;
    stale: number;
    syncs24h: number;
    failures24h: number;
    recordsProcessed24h: number;
    recordsFailed24h: number;
    avgResponseMs: number | null;
    overall: MonitoringStatus;
  };
  families: {
    family: string;
    label: string;
    total: number;
    active: number;
    unavailable: number;
    failures24h: number;
    avgResponseMs: number | null;
    status: MonitoringStatus;
  }[];
  integrations: IntegrationRow[];
  sso: { enabled: boolean; provider: string | null } | null;
  email: {
    queue: { waiting: number; active: number; failed: number; delayed: number } | null;
    connections: number;
    connectionsDisabled: number;
    lastTestFailed: number;
  };
  webhooks: {
    queue: { waiting: number; active: number; failed: number; delayed: number } | null;
    connections: number;
    connectionsDisabled: number;
    lastTestFailed: number;
    configured: number;
  };
  failures: {
    id: string | number;
    integrationId: number | string;
    integration: string;
    at: string;
    status: string;
    recordsFailed: number;
    message: string | null;
  }[];
}

// ── §6 Performance ───────────────────────────────────────────────────────────

type Available<T> = ({ available: true } & T) | { available: false };

export interface EndpointRow {
  endpoint: string;
  requests: number;
  avgMs: number;
  p95Ms: number;
  errorRate: number;
  errors5xx: number;
  slowRequests: number;
  status: 'OK' | 'ATENCAO' | 'CRITICO';
}

export interface PerformanceData {
  generatedAt: string;
  overall: {
    status: MonitoringStatus;
    statusLabel: string;
    unavailableSources: string[];
  };
  api: Available<{
    requests: number;
    avgLatencyMs: number | null;
    p50Ms: number | null;
    p95Ms: number | null;
    p99Ms: number | null;
    errorRatePercent: number | null;
    http4xx: number;
    http5xx: number;
    timeouts: number;
    slowRequests: number;
    slowThresholdMs: number;
    requestsPerMinute: number | null;
    errors5xxPerMinute: number | null;
    status: MonitoringStatus;
  }>;
  system: {
    available: boolean;
    stale: boolean;
    capturedAt: string | null;
    cpuPercent: number | null;
    memoryPercent: number | null;
    diskPercent: number | null;
    status: MonitoringStatus | null;
  };
  database: Available<{
    connections: { active: number; idle: number; total: number; max: number; usagePercent: number };
    waitingLocks: number;
    deadlocks: number;
    cacheHitRatio: number | null;
    queriesPerSecond: number | null;
    appAvgQueryMs: number | null;
    appP95QueryMs: number | null;
    slowQueries: number;
    slowThresholdMs: number;
    sizeGb: number;
    status: MonitoringStatus;
  }>;
  queues: Available<{
    mode: string;
    redisAvailable: boolean;
    totals: { executed: number; pending: number; running: number; failed: number; delayed: number };
    queues: {
      key: string;
      label: string;
      waiting: number;
      active: number;
      failed: number;
      avgDurationMs: number | null;
      throughputPerMin: number | null;
    }[];
    status: MonitoringStatus;
  }>;
  storage: Available<{
    usedGb: number;
    totalGb: number | null;
    usagePercent: number | null;
    monthlyGrowthMb: number | null;
    files: number | null;
    status: MonitoringStatus | null;
    note: string | null;
  }>;
  endpoints: { total: number; slowest: EndpointRow[]; failing: EndpointRow[] };
}

// ── §7 Alertas ───────────────────────────────────────────────────────────────

export type AlertArea =
  'SISTEMA' | 'PROCESSOS' | 'INTEGRACAO' | 'AUTOMACAO' | 'SLA' | 'SEGURANCA';
export type AlertState = 'ABERTO' | 'RECONHECIDO' | 'EM_TRATAMENTO' | 'RESOLVIDO';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface AlertRow {
  id: string;
  area: AlertArea;
  areaLabel: string;
  category: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  origin: string;
  automatic: boolean;
  metricValue: number | null;
  threshold: number | null;
  createdAt: string;
  ageMinutes: number;
  state: AlertState;
  assigneeId: number | null;
  assigneeName: string | null;
  acknowledgedAt: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  actions: {
    at: string;
    by: number | null;
    byName: string | null;
    kind: 'ACK' | 'ASSIGN' | 'NOTE' | 'RESOLVE' | 'INCIDENT';
    note: string;
  }[];
}

export interface AlertsData {
  alerts: AlertRow[];
  summary: {
    open: number;
    openCritical: number;
    unassigned: number;
    byArea: Record<AlertArea, number>;
    byState: Record<AlertState, number>;
  };
}

// ── §8 Incidentes ────────────────────────────────────────────────────────────

export type IncidentKind = 'OPERATIONAL' | 'SECURITY';
export type UnifiedSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface IncidentRow {
  key: string;
  kind: IncidentKind;
  id: string;
  code: string;
  title: string;
  severity: UnifiedSeverity;
  severityRaw: string;
  status: string;
  group: 'ACTIVE' | 'RESOLVED';
  component: string;
  impact: string | null;
  affectedUsers: number | null;
  ownerId: number | null;
  ownerName: string | null;
  cause: string | null;
  resolution: string | null;
  occurredAt: string;
  resolvedAt: string | null;
  resolutionMinutes: number | null;
  ageMinutes: number;
  managedIn: 'monitoring' | 'audit';
}

export interface IncidentsData {
  incidents: IncidentRow[];
  summary: {
    active: number;
    activeCritical: number;
    resolved: number;
    meanTimeToResolveMinutes: number | null;
    mttrWindowDays: number;
    byKind: Record<IncidentKind, number>;
  };
  note: string;
}

export interface IncidentDetail extends IncidentRow {
  postMortem: string | null;
  timeline: {
    at: string;
    type: string;
    label: string;
    actor: string | null;
    changes: unknown;
  }[];
}

export interface CreateIncidentPayload {
  title: string;
  category: string;
  component: string;
  severity: AlertSeverity;
  impact?: string;
}

export interface UpdateIncidentPayload {
  status?: string;
  rootCause?: string;
  actionTaken?: string;
}

// ── §9 Health Check ──────────────────────────────────────────────────────────

export interface HealthComponentRow {
  key: string;
  label: string;
  group: 'APLICACAO' | 'DADOS' | 'INFRAESTRUTURA' | 'EXTERNO' | 'PROCESSAMENTO';
  status: MonitoringStatus | null;
  statusLabel: string;
  latencyMs: number | null;
  detail: string;
  metrics: Record<string, unknown>;
  checkedAt: string;
  uptimePercent24h: number | null;
  samples24h: number;
}

export interface HealthData {
  generatedAt: string;
  overall: { status: MonitoringStatus; statusLabel: string; reasons: string[] };
  summary: {
    total: number;
    monitored: number;
    notMonitored: number;
    counts: Record<MonitoringStatus, number>;
  };
  components: HealthComponentRow[];
  note: string;
}
