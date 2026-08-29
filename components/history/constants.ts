// components/history/constants.ts
// Configuração visual de categorias e navegação de tabs do módulo
// de histórico. Extraído de app/(platform)/history/page.tsx.
//
// CATEGORY_COLOR migrado para os tokens semânticos da fundação de design
// (Fase A) — 8 categorias de domínio para 6 tokens semânticos + neutral,
// por isso ATTENDANCE/FINANCIAL (ambas verdes no original: teal/emerald)
// partilham 'success', mesmo padrão de reaproveitamento usado em
// components/automation/constants.ts (CATEGORY_INTENT).

import { Activity, Award, Clock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const CATEGORY_COLOR: Record<
  string,
  { color: string; bg: string; fill: string }
> = {
  LEARNING: { color: 'text-info-ink', bg: 'bg-info-subtle', fill: 'bg-info' },
  PERFORMANCE: {
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle',
    fill: 'bg-warning',
  },
  CAREER: {
    color: 'text-primary',
    bg: 'bg-primary-subtle',
    fill: 'bg-primary',
  },
  ENGAGEMENT: {
    color: 'text-accent',
    bg: 'bg-accent-subtle',
    fill: 'bg-accent',
  },
  SYSTEM: {
    color: 'text-ink-muted',
    bg: 'bg-surface-sunken',
    fill: 'bg-ink-faint',
  },
  COMPLIANCE: {
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle',
    fill: 'bg-danger',
  },
  ATTENDANCE: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
  FINANCIAL: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
};

// Rótulos PT das categorias de domínio (as chaves permanecem em inglês
// porque são o valor enviado ao backend como filtro).
export const CATEGORY_LABEL: Record<string, string> = {
  LEARNING: 'Aprendizagem',
  PERFORMANCE: 'Desempenho',
  CAREER: 'Carreira',
  ENGAGEMENT: 'Envolvimento',
  SYSTEM: 'Sistema',
  COMPLIANCE: 'Conformidade',
  ATTENDANCE: 'Assiduidade',
  FINANCIAL: 'Financeiro',
};

// Rótulos PT das acções de auditoria mais comuns. As acções vêm cruas da
// tabela AuditLog (groupBy), por isso `formatAuditAction` cai num
// formatador genérico para qualquer valor não mapeado.
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  ENROLLMENT: 'Inscrição em curso',
  CONTENT_VIEW: 'Conteúdo visualizado',
  CONTENT_BOOKMARK: 'Conteúdo guardado',
  COURSE_COMPLETED: 'Curso concluído',
  CERTIFICATE_ISSUED: 'Certificado emitido',
  BADGE_AWARDED: 'Badge atribuído',
  RECOGNITION: 'Reconhecimento recebido',
  EVALUATION_SUBMITTED: 'Avaliação submetida',
  PERFORMANCE_REVIEW: 'Avaliação de desempenho',
  CALIBRATION: 'Score calibrado',
  PROMOTION_APPROVED: 'Promoção aprovada',
  PDI_CREATED: 'PDI criado',
  PAYSLIP_PROCESSED: 'Recibo processado',
  LEAVE_APPROVED: 'Ausência aprovada',
  LEAVE_REQUESTED: 'Ausência solicitada',
  AVATAR_SESSION: 'Sessão de treino com avatar',
  AVATAR_SESSION_COMPLETED: 'Sessão de treino concluída',
  CONFIG_UPDATED: 'Configuração actualizada',
  PERMISSION_CHANGED: 'Permissão alterada',
  USER_CREATED: 'Utilizador criado',
  USER_UPDATED: 'Utilizador actualizado',
  USER_DELETED: 'Utilizador eliminado',
  ADMIN_ACTION: 'Acção administrativa',
  BULK_OPERATION: 'Operação em massa',
  REPORT_SAVED: 'Relatório guardado',
  LOGIN: 'Início de sessão',
  LOGOUT: 'Fim de sessão',
};

/** Rótulo PT de uma acção de auditoria, com fallback genérico legível. */
export function formatAuditAction(action: string): string {
  if (!action) return '–';
  const key = action.toUpperCase();
  if (AUDIT_ACTION_LABEL[key]) return AUDIT_ACTION_LABEL[key];
  const pretty = key.replace(/_/g, ' ').toLowerCase();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'timeline', label: 'Linha de Tempo', icon: Clock },
  { id: 'milestones', label: 'Marcos', icon: Award },
  { id: 'stats', label: 'Actividade', icon: Activity },
  { id: 'audit', label: 'Auditoria', icon: Shield },
];
