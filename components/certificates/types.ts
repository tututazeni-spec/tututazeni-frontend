// Resposta de GET /certificates/verify/:code (pública, só campos mínimos).
export type CertificateStatus =
  'PENDING' | 'PENDING_APPROVAL' | 'ACTIVE' | 'EXPIRED' | 'REVOKED';

export interface PublicVerifyResult {
  valid: boolean;
  status: CertificateStatus;
  holderName: string;
  title: string;
  issuerName: string;
  hours: number | null;
  issuedAt: string;
  expiresAt: string | null;
  type: string;
  /** EXTERNAL = importado para a plataforma, não emitido pela academia. */
  origin: 'INTERNAL' | 'EXTERNAL';
}

export type VerifyCardResult = PublicVerifyResult | { notFound: true };

// ─── Centro de certificados (endpoints /certificates/admin/*, /rules, /templates) ───

export interface CertificatesOverview {
  total: number;
  active: number;
  pendingApproval: number;
  expired: number;
  expiringSoon: number;
  revoked: number;
  /** null quando não há matrículas obrigatórias. */
  mandatoryCoveragePct: number | null;
}

export interface AdminCertificateRow {
  id: number;
  holderName: string;
  departmentName: string | null;
  title: string;
  activityKind: string | null;
  origin: 'INTERNAL' | 'EXTERNAL';
  status: CertificateStatus;
  code: string;
  issuedAt: string;
  expiresAt: string | null;
  hours: number | null;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type ActivityKind = 'COURSE' | 'TRAINING' | 'LEARNING_PATH' | 'EVENT';
export type IssueMode = 'AUTOMATIC' | 'MANUAL' | 'APPROVAL';

export interface RuleCriteria {
  requireFullCompletion?: boolean;
  minScore?: number;
  minAttendancePct?: number;
  requireInstructorApproval?: boolean;
  requireManagerApproval?: boolean;
  requirePracticalPass?: boolean;
}

export interface CertificateRuleView {
  id: number;
  activityKind: ActivityKind;
  activityId: number;
  activityTitle: string | null;
  mode: IssueMode;
  criteria: RuleCriteria;
  validityDays: number | null;
  active: boolean;
  updatedAt: string;
}

export interface CertificateTemplateRow {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  validityDays: number | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
}

export interface HistoryRow {
  id: number;
  action: string;
  userName: string | null;
  certificateId: number | null;
  timestamp: string;
  reason: string | null;
  metadata: unknown;
}

/** Estados filtráveis na lista (estado efectivo, calculado no servidor). */
export type EffectiveStatus =
  'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'PENDING_APPROVAL';

// ─── Área pessoal (GET /certificates/my/summary) ───

export interface MySummary {
  /** SMTP configurado: só então se oferece "Enviar por e-mail". */
  emailEnabled: boolean;
  pending: { id: number; title: string }[];
  expiringSoon: { id: number; title: string; expiresAt: string }[];
  mandatoryMissing: {
    enrollmentId: number;
    courseId: number;
    title: string;
    deadline: string | null;
    status: string;
  }[];
}

export interface TeamMemberRow {
  userId: number;
  fullName: string;
  active: number;
  expired: number;
  expiringSoon: number;
  pendingApproval: number;
  mandatoryPending: number;
  inProgress: number;
}

export interface TeamSummary {
  members: TeamMemberRow[];
  totals: {
    members: number;
    active: number;
    expired: number;
    expiringSoon: number;
    pendingApproval: number;
    mandatoryPending: number;
    inProgress: number;
    mandatoryCoveragePct: number | null;
  };
}
