// components/api-integrations/types.ts

export type Tab = 'integrations' | 'webhooks' | 'api-keys' | 'monitoring';

export interface Integration {
  id: number;
  name: string;
  endpoint: string;
  health: string;
  active: boolean;
  lastTested?: string | null;
}

export interface TestIntegrationResponse {
  success: boolean;
  message: string;
}

export interface TestConnectionResult {
  success: boolean;
  statusCode?: number;
  latencyMs: number;
  message: string;
}

// Espelham os enums Prisma (ver prisma/schema.prisma) usados no formulário de
// criação — API Integration > Integrações > "Nova Integração".
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
export type IntegrationStatusValue =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ERROR'
  | 'PENDING_AUTH'
  | 'RATE_LIMITED'
  | 'CONFIGURING'
  | 'SUSPENDED';

// Payload real de POST /api-integrations — ver CreateIntegrationDto
// (src/api-integration/api-integration.dto.ts). tenantId é resolvido no
// backend (plataforma single-tenant), não vai no payload.
export interface CreateIntegrationPayload {
  name: string;
  type: IntegrationTypeValue;
  category?: IntegrationCategoryValue;
  platform?: string;
  endpoint: string;
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
  status?: IntegrationStatusValue;
  activatedAt?: string;
  responsibleUserId?: string;
  active?: boolean;
  notes?: string;
}

export interface WebhookStats {
  delivered: number;
  failed: number;
}

export interface Webhook {
  id: number;
  name: string;
  url: string;
  active: boolean;
  events?: string[];
  stats?: WebhookStats;
}

export interface ApiKeyItem {
  id: number;
  name: string;
  preview: string;
  active: boolean;
  scopes?: string[];
  expiresAt?: string | null;
}

export interface CreateApiKeyResponse {
  key?: string;
}

export interface IntegrationHealthItem {
  name: string;
  health: string;
  logs7d: number;
  errorRate: number;
}

export interface MonitoringStats {
  summary?: {
    activeIntegrations?: number;
    totalLogs24h?: number;
    errorRate24h?: number;
    avgLatencyMs?: number;
  };
  integrationHealth?: IntegrationHealthItem[];
  generatedAt?: string;
}
