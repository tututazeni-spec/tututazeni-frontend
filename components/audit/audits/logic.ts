// components/audit/audits/logic.ts
// Regras do separador «Auditorias e Inspeções» (docs/modulo_audit.md §9) sem
// React: fases do fluxo, validação dos formulários e corpo dos pedidos.
// Extraído de AuditsView.tsx para poder ser testado sem renderizar modais.

import type {
  InternalAuditStatus,
  InternalAuditType,
  Severity,
} from '../types';

// ── Datas ───────────────────────────────────────────────────────────────────

/** `yyyy-mm-dd` do <input type="date"> → ISO; vazio → undefined. */
export const toIso = (d: string): string | undefined =>
  d ? new Date(`${d}T00:00:00`).toISOString() : undefined;

export const fmtDay = (d: string | null): string =>
  d ? new Date(d).toLocaleDateString('pt-AO') : '—';

// ── Fases do fluxo ──────────────────────────────────────────────────────────

export interface AuditPhase {
  /** Ainda se recolhem verificações, evidências e constatações. */
  collecting: boolean;
  /** Ações corretivas podem ser criadas e actualizadas. */
  actionable: boolean;
  /** O relatório pode ser aprovado. */
  reviewable: boolean;
  /** Concluída ou cancelada — só leitura. */
  terminal: boolean;
}

export function auditPhase(
  status: InternalAuditStatus | undefined,
): AuditPhase {
  return {
    collecting:
      status === 'PLANNED' ||
      status === 'PREPARING' ||
      status === 'IN_PROGRESS',
    actionable:
      status === 'IN_PROGRESS' ||
      status === 'IN_REVIEW' ||
      status === 'AWAITING_CORRECTIVE_ACTIONS',
    reviewable:
      status === 'IN_REVIEW' || status === 'AWAITING_CORRECTIVE_ACTIONS',
    terminal: status === 'COMPLETED' || status === 'CANCELLED',
  };
}

/** O relatório final só é exportável depois de aprovado. */
export const canExportReport = (status: InternalAuditStatus): boolean =>
  status === 'COMPLETED' || status === 'AWAITING_CORRECTIVE_ACTIONS';

// ── Nova auditoria ──────────────────────────────────────────────────────────

export interface NewAuditFormValues {
  title: string;
  type: InternalAuditType;
  objective: string;
  scope: string;
  modules: string;
  criteria: string;
  periodFrom: string;
  periodTo: string;
  startDate: string;
  dueDate: string;
}

export const EMPTY_NEW_AUDIT_FORM: NewAuditFormValues = {
  title: '',
  type: 'INTERNAL',
  objective: '',
  scope: '',
  modules: '',
  criteria: '',
  periodFrom: '',
  periodTo: '',
  startDate: '',
  dueDate: '',
};

/** Mensagem de erro, ou null se o formulário pode ser submetido. */
export function validateNewAudit(form: NewAuditFormValues): string | null {
  return form.title.trim() ? null : 'Indique o título da auditoria';
}

export function buildCreateAuditPayload(
  form: NewAuditFormValues,
  leadAuditorId: number | undefined,
  teamIds: number[],
) {
  return {
    title: form.title.trim(),
    type: form.type,
    objective: form.objective.trim() || undefined,
    scope: form.scope.trim() || undefined,
    modules: form.modules
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
    criteria: form.criteria.trim() || undefined,
    periodFrom: toIso(form.periodFrom),
    periodTo: toIso(form.periodTo),
    startDate: toIso(form.startDate),
    dueDate: toIso(form.dueDate),
    leadAuditorId,
    teamIds,
  };
}

// ── Detalhe: formulários inline ─────────────────────────────────────────────

export type FormKind =
  'check' | 'evidence' | 'finding' | 'action' | 'approve' | 'cancel' | null;

export interface DetailFormValues {
  title: string;
  description: string;
  url: string;
  auditLogId: string;
  nonConformity: string;
  risk: Severity;
  recommendation: string;
  findingId: string;
  dueDate: string;
  result: string;
  closingReport: string;
  reason: string;
}

export const EMPTY_DETAIL_FORM: DetailFormValues = {
  title: '',
  description: '',
  url: '',
  auditLogId: '',
  nonConformity: 'true',
  risk: 'MEDIUM',
  recommendation: '',
  findingId: '',
  dueDate: '',
  result: 'CONFORME',
  closingReport: '',
  reason: '',
};

/**
 * Limpa os campos de texto depois de gravar. Mantém os selectores
 * (nonConformity, risk, result) na última escolha do utilizador.
 */
export function clearDetailFields(f: DetailFormValues): DetailFormValues {
  return {
    ...f,
    title: '',
    description: '',
    url: '',
    auditLogId: '',
    recommendation: '',
    findingId: '',
    dueDate: '',
    closingReport: '',
    reason: '',
  };
}

/** O botão de gravar de cada formulário só ativa com o campo obrigatório. */
export function isDetailFormValid(
  kind: FormKind,
  f: DetailFormValues,
): boolean {
  switch (kind) {
    case 'check':
    case 'evidence':
    case 'finding':
      return !!f.title.trim();
    case 'action':
      return !!f.description.trim();
    case 'approve':
      return !!f.closingReport.trim();
    case 'cancel':
      return !!f.reason.trim();
    default:
      return false;
  }
}

export const buildCheckPayload = (f: DetailFormValues) => ({
  title: f.title.trim(),
});

export const buildEvidencePayload = (f: DetailFormValues) => ({
  title: f.title.trim(),
  description: f.description.trim() || undefined,
  url: f.url.trim() || undefined,
  auditLogId: f.auditLogId ? Number(f.auditLogId) : undefined,
});

export const buildFindingPayload = (f: DetailFormValues) => ({
  title: f.title.trim(),
  description: f.description.trim() || undefined,
  nonConformity: f.nonConformity === 'true',
  risk: f.risk,
  recommendation: f.recommendation.trim() || undefined,
});

export const buildActionPayload = (
  f: DetailFormValues,
  responsibleId: number | undefined,
) => ({
  description: f.description.trim(),
  findingId: f.findingId ? Number(f.findingId) : undefined,
  responsibleId,
  dueDate: toIso(f.dueDate),
});

export const buildApprovePayload = (f: DetailFormValues) => ({
  result: f.result,
  closingReport: f.closingReport.trim(),
});
