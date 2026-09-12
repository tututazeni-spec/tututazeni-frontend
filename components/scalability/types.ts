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
export type IntegrationAuthTypeValue = 'OAUTH2' | 'API_KEY' | 'BASIC' | 'BEARER' | 'NONE';
export type IntegrationEnvironmentValue = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'SANDBOX';
export type IntegrationDataFormatValue = 'JSON' | 'XML' | 'CSV' | 'EXCEL';
export type IntegrationCommunicationMethodValue = 'PULL' | 'PUSH' | 'POLLING' | 'STREAMING';
export type IntegrationSyncFrequencyValue = 'REALTIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MANUAL';
export type IntegrationSyncDirectionValue = 'INBOUND' | 'OUTBOUND' | 'BIDIRECTIONAL';

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
