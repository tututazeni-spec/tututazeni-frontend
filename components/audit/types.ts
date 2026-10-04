// components/audit/types.ts
// Tipos do domínio de auditoria: logs, estatísticas, anomalias,
// timeline e verificação de integridade. Extraído de
// app/(platform)/audit/page.tsx.

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Status = 'SUCCESS' | 'FAILED' | 'DENIED';

export interface AuditLog {
  id: number;
  action: string;
  entity: string;
  entityId: number | null;
  entityName: string | null;
  before: string | null;
  after: string | null;
  changes: string | null;
  status: Status;
  severity: Severity;
  ip: string | null;
  userAgent: string | null;
  reason: string | null;
  hash: string | null;
  timestamp: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role?: { name: string } | null;
    department?: { id: number; name: string } | null;
  } | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  totalPages: number;
}

export interface AuditFilterOptions {
  entities: string[];
  actions: string[];
  departments: Array<{ id: number; name: string }>;
}

export interface RelatedEvent {
  id: number;
  code: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: number | null;
  status: Status;
  severity: Severity;
  user: { id: number; fullName: string } | null;
}

export interface AuditEventDetail {
  id: number;
  code: string;
  timestamp: string;
  action: string;
  entity: string;
  entityId: number | null;
  entityName: string | null;
  status: Status;
  severity: Severity;
  reason: string | null;
  ip: string | null;
  userAgent: string | null;
  user: AuditLog['user'];
  actorType: 'USER' | 'SYSTEM';
  before: unknown;
  after: unknown;
  changes: Record<string, { from: unknown; to: unknown }> | null;
  metadata: Record<string, unknown> | null;
  correlationId: string | null;
  masked: boolean;
  related: { sameRecord: RelatedEvent[]; sameActor: RelatedEvent[] };
}

export interface AccessSummary {
  periodDays: number;
  totals: {
    successLogins: number;
    failedLogins: number;
    logouts: number;
    passwordChanges: number;
    permissionChanges: number;
    activeSessions: number;
  };
  daily: Array<{ date: string; success: number; failed: number }>;
  alerts: Array<{ kind: string; severity: 'MEDIUM' | 'HIGH'; message: string }>;
}

export interface ActiveSession {
  id: number;
  lastActivity: string;
  expiresAt: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    role: { name: string } | null;
  };
}

export interface AuditStats {
  totals: {
    total: number;
    today: number;
    critical: number;
    failedLoginsToday: number;
  };
  byAction: Array<{ action: string; count: number }>;
  byEntity: Array<{ entity: string; count: number }>;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  recentCritical: AuditLog[];
}

export interface Anomalies {
  suspiciousLogins: Array<{ userId: number; count: number }>;
  massExports: Array<{ userId: number; count: number }>;
  massDeletes: Array<{ userId: number; count: number }>;
  totalAlerts: number;
}

export interface Timeline {
  entity: string;
  entityId: number;
  events: Array<{
    id: number;
    action: string;
    severity: string;
    status: string;
    user: { id: number; fullName: string } | null;
    timestamp: string;
    changes: Record<string, { from: unknown; to: unknown }> | null;
    reason: string | null;
    ip: string | null;
  }>;
}

export interface IntegrityCheck {
  valid: boolean;
  checked: number;
  broken: number[];
}

export interface AuditOverview {
  periodDays: number;
  since: string;
  totals: {
    events: number;
    failedAccess: number;
    criticalActions: number;
    pendingAlerts: number;
  };
  access: { success: number; failed: number };
  daily: Array<{ date: string; total: number; failedAccess: number }>;
  byModule: Array<{ module: string; count: number }>;
  bySeverity: Record<string, number>;
  topUsers: Array<{
    userId: number | null;
    count: number;
    user: { id: number; fullName: string; email: string } | null;
  }>;
  recent: AuditLog[];
  recentCritical: AuditLog[];
  anomalies: Anomalies;
}

export type View =
  | 'overview'
  | 'logs'
  | 'access'
  | 'changes'
  | 'security'
  | 'audits'
  | 'reports'
  | 'exports'
  | 'policies'
  | 'timeline'
  | 'deleted';
