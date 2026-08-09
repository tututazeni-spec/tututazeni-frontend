// components/scalability/types.ts
// Tipos partilhados entre o container (app/(platform)/scalability/page.tsx)
// e a view apresentacional (ScalabilityDashboardView). Extraído da junção
// container+apresentação original — ver memory
// project_innova_component_separation_audit, item 3.1.

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type IntegrationStatus =
  'ACTIVE' | 'INACTIVE' | 'ERROR' | 'PENDING_AUTH';
export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE' | 'CUSTOM';

export interface DashboardData {
  tenantInfo: {
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

export interface Integration {
  id: string;
  name: string;
  type: string;
  status: IntegrationStatus;
  syncFrequency: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: string;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  lastRunStatus: string | null;
}
