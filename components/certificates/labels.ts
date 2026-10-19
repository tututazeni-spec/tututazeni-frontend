// Rótulos em português para todos os enums do centro de certificados —
// nenhum valor cru (ACTIVE, PENDING_APPROVAL, ...) deve chegar ao ecrã.

import type { ActivityKind, CertificateStatus, IssueMode } from './types';

export const STATUS_LABEL: Record<CertificateStatus, string> = {
  ACTIVE: 'Válido',
  EXPIRED: 'Expirado',
  REVOKED: 'Revogado',
  PENDING: 'Pendente',
  PENDING_APPROVAL: 'Aguarda aprovação',
};

export const STATUS_INTENT: Record<
  CertificateStatus,
  'success' | 'warning' | 'danger' | 'neutral' | 'info'
> = {
  ACTIVE: 'success',
  EXPIRED: 'warning',
  REVOKED: 'danger',
  PENDING: 'neutral',
  PENDING_APPROVAL: 'info',
};

export const KIND_LABEL: Record<ActivityKind, string> = {
  COURSE: 'Curso',
  TRAINING: 'Formação',
  LEARNING_PATH: 'Trilha de aprendizagem',
  EVENT: 'Evento',
};

export const MODE_LABEL: Record<IssueMode, string> = {
  AUTOMATIC: 'Automático',
  MANUAL: 'Manual',
  APPROVAL: 'Mediante aprovação',
};

export const ACTION_LABEL: Record<string, string> = {
  CERTIFICATE_ISSUED: 'Certificado emitido',
  CERTIFICATE_APPROVED: 'Certificado aprovado',
  CERTIFICATE_RULE_UPSERTED: 'Regra de emissão alterada',
};

export const TEMPLATE_TYPE_LABEL: Record<string, string> = {
  COURSE: 'Curso',
  PROGRAM: 'Programa',
  COMPETENCY: 'Competência',
  ATTENDANCE: 'Presença',
  PARTICIPATION: 'Participação',
  ACHIEVEMENT: 'Mérito',
};

/** Texto curto de cada critério de regra, para a lista e o formulário. */
export function describeCriteria(c: {
  requireFullCompletion?: boolean;
  minScore?: number;
  minAttendancePct?: number;
  requireInstructorApproval?: boolean;
  requireManagerApproval?: boolean;
  requirePracticalPass?: boolean;
}): string[] {
  const out: string[] = [];
  if (c.requireFullCompletion) out.push('Conteúdo obrigatório concluído');
  if (c.minScore !== undefined) out.push(`Nota mínima ${c.minScore}%`);
  if (c.minAttendancePct !== undefined)
    out.push(`Presença mínima ${c.minAttendancePct}%`);
  if (c.requirePracticalPass) out.push('Avaliação prática aprovada');
  if (c.requireInstructorApproval) out.push('Aprovação do instrutor');
  if (c.requireManagerApproval) out.push('Aprovação do gestor');
  return out;
}
