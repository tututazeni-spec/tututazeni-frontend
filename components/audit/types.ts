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

// ── Alterações de Dados (§7) ────────────────────────────────────────────────
export interface FieldChange {
  field: string;
  from: unknown;
  to: unknown;
  masked: boolean;
}

export interface DataChange {
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
  user: AuditLog['user'];
  actorType: 'USER' | 'SYSTEM';
  origin: string | null;
  approvalRef: string | null;
  fields: FieldChange[];
}

export interface ChangesSummary {
  periodDays: number;
  totals: { changes: number; failed: number; authors: number };
  byEntity: Array<{ entity: string; count: number }>;
  byAction: Array<{ action: string; count: number }>;
}

// ── Segurança e Incidentes (§8) ─────────────────────────────────────────────
export type IncidentStatus = 'OPEN' | 'IN_ANALYSIS' | 'MITIGATED' | 'CLOSED';

export interface PersonRef {
  id: number;
  fullName: string;
  email: string;
}

export interface Incident {
  id: number;
  code: string;
  title: string;
  description: string | null;
  category: string;
  type: string | null;
  severity: Severity;
  status: IncidentStatus;
  detectedAt: string;
  source: string;
  sourceLabel: string | null;
  assigneeId: number | null;
  assignee: PersonRef | null;
  resolution: string | null;
  closedAt: string | null;
  evidenceCount?: number;
}

export interface IncidentList extends Paginated<Incident> {
  counts: {
    byStatus: Partial<Record<IncidentStatus, number>>;
    openBySeverity: Partial<Record<Severity, number>>;
  };
}

export interface IncidentDetail extends Incident {
  createdBy: PersonRef | null;
  evidences: Array<{
    id: number;
    auditLogId: number | null;
    note: string | null;
    createdAt: string;
    addedBy: PersonRef | null;
    auditLog: {
      id: number;
      action: string;
      entity: string;
      entityId: number | null;
      severity: Severity;
      status: Status;
      timestamp: string;
      user: { id: number; fullName: string } | null;
    } | null;
  }>;
  history: Array<{
    id: number;
    action: string;
    timestamp: string;
    user: PersonRef | null;
    metadata: Record<string, unknown> | null;
  }>;
}

// ── Auditorias e Inspeções (§9) ─────────────────────────────────────────────
export type InternalAuditStatus =
  | 'PLANNED'
  | 'PREPARING'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'AWAITING_CORRECTIVE_ACTIONS'
  | 'COMPLETED'
  | 'CANCELLED';
export type InternalAuditType =
  'INTERNAL' | 'OPERATIONAL' | 'COMPLIANCE' | 'SECURITY';

export interface InternalAuditSummary {
  id: number;
  code: string;
  title: string;
  type: InternalAuditType;
  status: InternalAuditStatus;
  modules: string[];
  startDate: string | null;
  dueDate: string | null;
  result: string | null;
  leadAuditor: PersonRef | null;
  counts: {
    checks: number;
    findings: number;
    actions: number;
    evidences: number;
  };
}

export interface InternalAuditList extends Paginated<InternalAuditSummary> {
  counts: { byStatus: Partial<Record<InternalAuditStatus, number>> };
}

export interface InternalAuditDetail {
  id: number;
  code: string;
  title: string;
  objective: string | null;
  scope: string | null;
  type: InternalAuditType;
  status: InternalAuditStatus;
  modules: string[];
  periodFrom: string | null;
  periodTo: string | null;
  criteria: string | null;
  startDate: string | null;
  dueDate: string | null;
  result: string | null;
  closingReport: string | null;
  approvedAt: string | null;
  cancelReason: string | null;
  leadAuditor: PersonRef | null;
  approvedBy: PersonRef | null;
  team: PersonRef[];
  checks: Array<{
    id: number;
    title: string;
    status: 'PENDING' | 'PASSED' | 'FAILED' | 'NOT_APPLICABLE';
    notes: string | null;
  }>;
  evidences: Array<{
    id: number;
    title: string;
    description: string | null;
    url: string | null;
    auditLogId: number | null;
    createdAt: string;
    addedBy: PersonRef | null;
  }>;
  findings: Array<{
    id: number;
    title: string;
    description: string | null;
    nonConformity: boolean;
    risk: Severity;
    recommendation: string | null;
  }>;
  actions: Array<{
    id: number;
    findingId: number | null;
    description: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
    dueDate: string | null;
    responsible: PersonRef | null;
  }>;
  history: Array<{
    id: number;
    action: string;
    timestamp: string;
    user: PersonRef | null;
  }>;
}

// ── Relatórios, Exportações e Políticas (§10-12) ────────────────────────────
export interface AuditReportCatalogItem {
  type: string;
  title: string;
}

export interface AuditReportResult {
  type: string;
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
  total: number;
  truncated: boolean;
  generatedAt: string;
  filters: Record<string, unknown>;
}

export type Confidentiality = 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';

export interface AuditExportItem {
  id: number;
  code: string;
  kind: 'REPORT' | 'EVIDENCE';
  fileName: string;
  mimeType: string;
  format: string;
  reportType: string | null;
  incidentId: number | null;
  auditId: number | null;
  periodFrom: string | null;
  periodTo: string | null;
  filters: Record<string, unknown> | null;
  recordCount: number;
  sizeBytes: number;
  confidentiality: Confidentiality;
  sha256: string;
  retentionUntil: string;
  status: 'ACTIVE' | 'EXPIRED' | 'PURGED';
  result: string;
  createdAt: string;
  author: PersonRef | null;
}

export interface AuditExportDetail extends AuditExportItem {
  accesses: Array<{
    id: number;
    action: 'VIEW' | 'DOWNLOAD' | 'DENIED';
    ip: string | null;
    createdAt: string;
    user: PersonRef | null;
  }>;
}

export interface AuditExportsSummary {
  total: number;
  reports: number;
  evidences: number;
  expired: number;
  sizeBytes: number;
  byConfidentiality: Array<{ level: string; count: number }>;
}

export interface AuditPolicy {
  requiredEvents: string[];
  coveredModules: string[];
  severityRules: Record<string, Severity>;
  alertRules: Record<string, number>;
  retentionDays: Record<string, number>;
  archivePolicy: string | null;
  viewRoles: string[];
  exportRoles: string[];
  maskSensitive: boolean;
  maskedFields: string[];
  backupDestination: string | null;
  backupFrequency: string | null;
  serviceEnabled: boolean;
  failureAlertEmails: string[];
  updatedAt: string | null;
}

export interface AuditServiceStatus {
  serviceEnabled: boolean;
  health: 'OK' | 'WARNING' | 'DISABLED';
  lastEventAt: string | null;
  minutesSinceLastEvent: number | null;
  events24h: number;
  failedOperations24h: number;
  deniedOperations24h: number;
  silentHours24h: number;
  exports: {
    byStatus: Array<{ status: string; count: number }>;
    expiredPendingPurge: number;
  };
  backup: {
    destination: string | null;
    frequency: string | null;
    configured: boolean;
  };
}

export interface RetentionPreview {
  archivePolicy: string | null;
  note: string;
  categories: Array<{
    category: string;
    retentionDays: number;
    cutoff: string;
    total: number;
    pastRetention: number;
  }>;
}
