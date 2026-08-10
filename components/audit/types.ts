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
  } | null;
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

export type View = 'logs' | 'stats' | 'anomalies' | 'timeline';
