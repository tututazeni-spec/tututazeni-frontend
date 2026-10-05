// components/scalability/types.ts
// Tipos partilhados entre o container (app/(platform)/scalability/page.tsx)
// e a view apresentacional (ScalabilityDashboardView). Extraído da junção
// container+apresentação original — ver memory
// project_innova_component_separation_audit, item 3.1.
//
// Espelham os DTOs/modelos reais do backend (src/scalability/scalability.dto.ts,
// prisma/schema.prisma) desde que o módulo deixou de correr sobre dados mock —
// ver app/(platform)/scalability/page.tsx.

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type IntegrationStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ERROR'
  | 'PENDING_AUTH'
  | 'RATE_LIMITED'
  | 'CONFIGURING'
  | 'SUSPENDED';
export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';

// Espelham os enums Prisma (ver prisma/schema.prisma) usados no formulário de
// criação — Escalabilidade > Integrações > "Nova Integração".
export type IntegrationTypeValue =
  | 'REST_API'
  | 'SOAP_API'
  | 'WEBHOOK'
  | 'SFTP'
  | 'OAUTH2'
  | 'LDAP'
  | 'SAML2'
  | 'OPENID_CONNECT'
  | 'DATABASE'
  | 'CSV_FILE'
  | 'EXCEL_FILE'
  | 'OTHER'
  // Valores legados — ainda usados por integrações já existentes.
  | 'ERP_HR'
  | 'PAYROLL'
  | 'ATS'
  | 'MICROSOFT_TEAMS'
  | 'SLACK'
  | 'SSO_GOOGLE'
  | 'SSO_MICROSOFT'
  | 'SCORM_PROVIDER'
  | 'XAPI_LRS'
  | 'BI_TOOL'
  | 'CUSTOM_WEBHOOK';
export type IntegrationCategoryValue =
  | 'ERP'
  | 'SSO'
  | 'LMS'
  | 'COMMUNICATION'
  | 'HR'
  | 'FINANCE'
  | 'PAYROLL'
  | 'IDENTITY_ACCESS'
  | 'OTHER';
export type IntegrationAuthTypeValue =
  'OAUTH2' | 'API_KEY' | 'BASIC' | 'BEARER' | 'NONE';
export type IntegrationEnvironmentValue =
  'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'SANDBOX';
export type IntegrationDataFormatValue = 'JSON' | 'XML' | 'CSV' | 'EXCEL';
export type IntegrationCommunicationMethodValue =
  'PULL' | 'PUSH' | 'POLLING' | 'STREAMING';
export type IntegrationSyncFrequencyValue =
  'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
export type IntegrationSyncDirectionValue =
  'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

// Payload real de POST /scalability/integrations — ver
// CreateIntegrationConfigDto (src/scalability/scalability.dto.ts).
export interface CreateIntegrationPayload {
  tenantId: string;
  name: string;
  type: IntegrationTypeValue;
  category?: IntegrationCategoryValue;
  platform?: string;
  description?: string;
  baseUrl?: string;
  authType?: IntegrationAuthTypeValue;
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  apiKey?: string;
  authUrl?: string;
  environment?: IntegrationEnvironmentValue;
  apiVersion?: string;
  dataFormat?: IntegrationDataFormatValue;
  communicationMethod?: IntegrationCommunicationMethodValue;
  syncFrequency?: IntegrationSyncFrequencyValue;
  syncDirection?: IntegrationSyncDirectionValue;
  dataToSync?: string[];
  fieldMapping?: Record<string, string>;
  webhookUrl?: string;
  webhookEvents?: string[];
  timeoutMs?: number;
  maxRetries?: number;
  retryIntervalMs?: number;
  status?: IntegrationStatus;
  activatedAt?: string;
  responsibleUserId?: string;
  active?: boolean;
  notes?: string;
}

export interface TestConnectionResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  message: string;
}

export interface DashboardData {
  tenantInfo: {
    id: string;
    tenantCode: string;
    tenantName: string;
    plan: TenantPlan;
    maxUsers: number;
    activeUsersCount: number;
    registeredUsersCount: number;
    storageUsedGb: number;
    maxStorageGb: number;
  };
  performanceSummary: {
    uptimePercent: number;
    avgLatencyMs: number;
    errorRate: number;
    activeSessionsNow: number;
    requestsPerMinute: number;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    dbUsagePercent: number;
  };
  capacityEstimate?: {
    concurrentUsers: number;
    method: 'MEASURED' | 'MODEL';
    basis: string;
  };
  integrations: {
    total: number;
    active: number;
    withErrors: number;
    lastSyncAt: string | null;
  };
  automations: {
    total: number;
    active: number;
    executionsToday: number;
    failedToday: number;
  };
  alerts: { open: number; critical: number; warning: number; info: number };
  slaCompliance: {
    currentUptimePercent: number;
    slaTarget: number;
    isBreached: boolean;
    avgLatencyMs: number;
    latencyTarget: number;
  };
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  category: string;
  title: string;
  message: string;
  isResolved: boolean;
  createdAt: string;
}

// IntegrationConfig.id / AutomationRule.id são Int (autoincrement) no Prisma
// — ver [[project_innova_schema_code_drift]] (entrada scalability).
export interface Integration {
  id: number;
  name: string;
  type: string;
  status: IntegrationStatus;
  syncFrequency: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

export interface AutomationRule {
  id: number;
  name: string;
  triggerType: string;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}

// SlaConfig — resposta real de GET /scalability/sla.
export interface SlaConfig {
  id: string;
  name: string;
  uptimePercent: number;
  maxLatencyMs: number;
  maxErrorRate: number;
  incidentResponse: number;
  dataRetentionDays: number | null;
  backupFrequency: string | null;
  rpoMinutes: number | null;
  rtoMinutes: number | null;
  isActive: boolean;
}

// Resposta real de POST /scalability/users/bulk-import.
export interface BulkImportResultDto {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ row: number; reason: string }>;
}

// ContentDeliveryConfig — resposta real de GET /scalability/content-delivery
// (`null` quando o tenant ainda não tem nenhuma configurada).
export interface ContentDeliveryConfig {
  id: string;
  tenantId: string;
  cdnProvider: string | null;
  cdnBaseUrl: string | null;
  adaptiveBitrate: boolean;
  offlineSyncEnabled: boolean;
  maxOfflineDays: number;
  compressionEnabled: boolean;
  maxVideoSizeMb: number;
  allowedFormats: string[];
}

// Resposta real de GET /scalability/overview-charts (gráficos da Visão Geral).
export interface UsersLoadSegmentRow {
  name: string;
  users: number;
  activeMonthly: number;
}

export interface UsersLoadData {
  totals: {
    total: number;
    active: number;
    activeDaily: number;
    activeMonthly: number;
  };
  concurrent: {
    current: number;
    peak24h: number;
    historicPeak: number;
    avg24h: number;
    min24h: number;
    max24h: number;
    timeline: Array<{ at: string; peak: number }>;
  };
  sessions: {
    avgPerUser30d: number;
    /** null: a plataforma não regista o fim das sessões. */
    avgDurationMinutes: number | null;
    /** null enquanto o módulo Monitoring não fornece requests. */
    requestsPerUserPerMin: number | null;
  };
  growth: {
    daily: { newUsers: number; percent: number };
    monthly: { newUsers: number; percent: number };
    yearly: { newUsers: number; percent: number };
  };
  segmentation: {
    department: UsersLoadSegmentRow[];
    position: UsersLoadSegmentRow[];
    unit: UsersLoadSegmentRow[];
    role: UsersLoadSegmentRow[];
    location: UsersLoadSegmentRow[];
    userType: UsersLoadSegmentRow[];
    /** null: não há registo de dispositivo (web/mobile). */
    platform: { web: number; mobile: number } | null;
  };
  trafficSourceConnected: boolean;
}

export interface OverviewChartsData {
  timeline: Array<{
    at: string;
    cpuUsagePercent: number;
    memoryUsagePercent: number;
    requestsPerMinute: number;
    concurrentSessions: number;
    avgLatencyMs: number;
  }>;
  userGrowth: Array<{
    month: string;
    registered: number;
    active: number;
    activeInMonth: number;
    newUsers: number;
  }>;
  /** false enquanto o módulo Monitoring não fornece requests/latência. */
  trafficSourceConnected: boolean;
  forecast: {
    thresholdPercent: number;
    targetUsers: number;
    monthlyGrowth: number;
    alreadyReached: boolean;
    monthsToThreshold: number | null;
  };
}

export interface ApiMetricsData {
  sinceProcessStartSeconds: number;
  totals: {
    requests: number;
    avgLatencyMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    http4xx: number;
    http5xx: number;
    errorRate: number;
    timeouts: number;
    slowRequests: number;
    slowThresholdMs: number;
    avgProcessingMs: number;
  };
  rates: {
    requestsPerSecond: number | null;
    requestsPerMinute: number | null;
    throughputRps: number | null;
    errors5xxPerMinute: number | null;
    windowSeconds: number;
  };
  /** null: pedidos em curso não são registados. */
  concurrentRequests: number | null;
  endpoints: Array<{
    endpoint: string;
    requests: number;
    avgMs: number;
    p95Ms: number;
    errorRate: number;
    errors5xx: number;
    slowRequests: number;
    status: 'OK' | 'ATENCAO' | 'CRITICO';
  }>;
}

type DbGrowth = { growthGb: number; coverageDays: number } | null;

export interface DatabaseMetricsData {
  host: { cpuPercent: number | null; ramPercent: number | null };
  storage: { sizeGb: number };
  connections: {
    active: number;
    idle: number;
    total: number;
    max: number;
    usagePercent: number;
  };
  pool: { max: number };
  throughput: {
    queriesPerSecond: number | null;
    transactionsPerSecond: number | null;
    readIops: number | null;
  };
  health: {
    waitingLocks: number;
    deadlocks: number;
    cacheHitRatio: number | null;
  };
  queries: {
    appTotal: number;
    appAvgMs: number;
    appP95Ms: number;
    slowCount: number;
    slowThresholdMs: number;
  };
  /** null: extensão pg_stat_statements não instalada. */
  slowQueries: {
    source: 'pg_stat_statements';
    rows: Array<{ query: string; calls: number; meanMs: number; maxMs: number }>;
  } | null;
  indexes: {
    total: number;
    unusedCount: number;
    unused: Array<{ table: string; index: string; sizeMb: number }>;
  };
  largestTables: Array<{ name: string; sizeMb: number; rows: number }>;
  growth: {
    daily: DbGrowth;
    monthly: DbGrowth;
    yearly: DbGrowth;
    series: Record<'7d' | '30d' | '90d' | '1y', Array<{ day: string; gb: number }>>;
    forecast: {
      currentGb: number;
      avgGrowthGbPerMonth: number;
      projectedGb12m: number;
      basedOnDays: number;
    } | null;
    growingTables: Array<{ name: string; growthMb: number }>;
    samples: number;
  };
}

// Resposta real de GET /scalability/frontend-metrics (modulo_scalability.md §10).
export type PageStatus = 'OK' | 'ATENCAO' | 'CRITICO';

export interface FrontendPageStats {
  views: number;
  loadMs: number | null;
  lcpMs: number | null;
  ttfbMs: number | null;
  errors: number;
  status: PageStatus;
}

export interface FrontendMetricsData {
  windowHours: number;
  samples: number;
  percentile: 'p75';
  vitals: {
    pageLoadMs: number | null;
    fcpMs: number | null;
    lcpMs: number | null;
    inpMs: number | null;
    ttfbMs: number | null;
  };
  resources: {
    jsKb: number | null;
    cssKb: number | null;
    imagesKb: number | null;
    requestsPerPage: number | null;
    cacheHitRatio: number | null;
  };
  errors: { total: number; pagesWithErrors: number; errorRate: number };
  criticalPages: Array<
    FrontendPageStats & { page: string; path: string; hasData: boolean }
  >;
  slowPages: Array<FrontendPageStats & { path: string }>;
  pages: Array<FrontendPageStats & { path: string }>;
}

// Resposta real de GET /scalability/queue-metrics (modulo_scalability.md §11).
export interface QueueStats {
  key: string;
  label: string;
  domain: string;
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
  completed: number;
  queueSize: number;
  avgDurationMs: number | null;
  throughputPerMin: number;
  retries: number;
  lastFailure: { at: string | null; reason: string | null } | null;
}

export interface DbJobStats {
  key: string;
  label: string;
  domain: string;
  executed: number;
  pending: number;
  running: number;
  failed: number;
  delayed: number;
  avgDurationMs: number | null;
  retries: number;
}

export interface QueueMetricsData {
  mode: 'QUEUE' | 'SYNC';
  redisAvailable: boolean;
  totals: {
    executed: number;
    pending: number;
    running: number;
    failed: number;
    delayed: number;
    avgDurationMs: number | null;
    throughputPerMin: number;
    queueSize: number;
    retries: number;
  };
  queues: QueueStats[];
  dbJobs: DbJobStats[];
  synchronousDomains: string[];
  depthHistory: Array<{
    at: string;
    waiting: number;
    active: number;
    delayed: number;
    failed: number;
    total: number;
    byQueue: Record<string, number>;
  }>;
  historyHours: number;
}

// Resposta real de GET /scalability/storage-metrics (modulo_scalability.md §12).
export interface StorageBreakdownRow {
  key: string;
  label: string;
  files: number;
  mb: number;
  percent: number;
}

export interface StorageMetricsData {
  totalGb: number | null;
  usedGb: number;
  usedMb: number;
  availableGb: number | null;
  usagePercent: number | null;
  monthlyGrowthMb: number;
  files: number;
  byModule: StorageBreakdownRow[];
  byKind: StorageBreakdownRow[];
  byType: StorageBreakdownRow[];
  byUnit: StorageBreakdownRow[];
  growth: Array<{ month: string; addedMb: number; cumulativeGb: number }>;
  largestFiles: Array<{
    module: string;
    name: string;
    type: string;
    mb: number;
    createdAt: string;
  }>;
  note: string;
}

// ─── §13 Integrações / §14 Performance ─────────────────────

export type PerfClass =
  | 'EXCELENTE'
  | 'NORMAL'
  | 'ATENCAO'
  | 'DEGRADACAO'
  | 'CRITICO';

export interface IntegrationMetricsData {
  windowHours: number;
  totals: {
    active: number;
    total: number;
    requests: number;
    syncs: number;
    failures: number;
    errorRate: number;
    avgLatencyMs: number | null;
    retries: number;
    pendingJobs: number;
    recordsTransferred: number;
    bytesTransferred: number | null;
  };
  integrations: Array<{
    id: number;
    name: string;
    type: string;
    status: IntegrationStatus;
    requests: number;
    errors: number;
    errorRate: number;
    latencyMs: number | null;
    retries: number;
    pendingJobs: number;
    recordsProcessed: number;
    lastSyncAt: string | null;
    state: 'OK' | 'ATENCAO' | 'CRITICO' | 'INACTIVA';
  }>;
}

export interface PerformanceMetricsData {
  overall: PerfClass | null;
  kpis: Array<{
    key: string;
    label: string;
    value: number | null;
    unit: string;
    classification: PerfClass | null;
    note: string | null;
  }>;
  slowEndpoints: Array<{
    endpoint: string;
    p95Ms: number;
    errorRate: number;
    status: 'OK' | 'ATENCAO' | 'CRITICO';
  }>;
}
