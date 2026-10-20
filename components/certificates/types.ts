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
  /** Um dos 9 modelos de sistema; null = corporativo clássico. */
  templateId: string | null;
  active: boolean;
  updatedAt: string;
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

// ─── As minhas trilhas (GET /certificates/my/learning-paths) ───

export interface LearningPathUnitProgress {
  kind: 'COURSE' | 'TRAINING';
  id: number;
  title: string;
  required: boolean;
  done: boolean;
}

export interface LearningPathProgress {
  learningPathId: number;
  title: string;
  /** Percentagem das unidades obrigatórias cumpridas (0–100). */
  completionPct: number;
  units: LearningPathUnitProgress[];
  certificate: { id: number; status: CertificateStatus } | null;
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

// ─── Modelos de certificado (nove modelos de sistema, versionados) ───

export type Align = 'left' | 'center' | 'right';

export type ElementKey =
  | 'logo'
  | 'title'
  | 'recognition'
  | 'name'
  | 'course'
  | 'details'
  | 'signature'
  | 'qr'
  | 'code';

export interface ElementTweak {
  align?: Align;
  scale?: number;
  dx?: number;
  dy?: number;
  visible?: boolean;
}

export interface TemplateColors {
  primary: string;
  accent: string;
  text: string;
  background: string;
}

export interface TemplateConfigDto {
  layoutKey: string;
  colors: TemplateColors;
  texts: {
    title: string;
    recognition: string;
    courseLine: string;
    detailsLine: string;
    footer: string;
  };
  assets: { logoId?: string; backgroundId?: string; signatureId?: string };
  signatory: { name?: string; title?: string };
  options: {
    showQr: boolean;
    showCode: boolean;
    showHours: boolean;
    showValidity: boolean;
    showScore: boolean;
  };
  elements: Partial<Record<ElementKey, ElementTweak>>;
}

export interface TemplateSummaryRow {
  id: string;
  name: string;
  description: string | null;
  layoutKey: string;
  currentVersion: number;
  colors: TemplateColors;
  updatedAt: string;
}

export interface TemplateDetailDto extends TemplateSummaryRow {
  config: TemplateConfigDto;
  versions: {
    version: number;
    createdAt: string;
    createdByName: string | null;
    restoredFromVersion: number | null;
  }[];
}

export interface AssetMeta {
  id: string;
  kind: 'LOGO' | 'BACKGROUND' | 'SIGNATURE';
  mime: string;
  width: number;
  height: number;
  size: number;
}
