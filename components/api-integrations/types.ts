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
