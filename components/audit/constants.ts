// components/audit/constants.ts
// Mapas de badges/rótulos e navegação do módulo de auditoria. Cores
// mapeadas para os tokens semânticos da fundação de design (Fase A).
// Extraído de app/(platform)/audit/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Severity, Status, View } from './types';

export const SEVERITY_CFG: Record<
  Severity,
  { label: string; cls: string; dot: string }
> = {
  LOW: { label: 'Baixa', cls: 'text-ink-faint', dot: 'bg-ink-faint' },
  MEDIUM: { label: 'Média', cls: 'text-info-ink', dot: 'bg-info' },
  HIGH: { label: 'Alta', cls: 'text-warning-ink', dot: 'bg-warning' },
  CRITICAL: { label: 'Crítica', cls: 'text-danger-ink', dot: 'bg-danger' },
};

export const STATUS_CFG: StatusBadgeMap<Status> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
  DENIED: { label: 'Negado', cls: 'bg-warning-subtle text-warning-ink' },
};

// Rótulos PT das acções de auditoria (sem ícones).
export const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criar',
  UPDATE: 'Atualizar',
  DELETE: 'Eliminar',
  LOGIN: 'Início de sessão',
  LOGOUT: 'Fim de sessão',
  FAILED: 'Falhou',
  EXPORT: 'Exportar',
  SEND: 'Enviar',
  READ: 'Leitura',
  APPROVE: 'Aprovar',
  REJECT: 'Rejeitar',
  DENIED: 'Negado',
  PUBLISH: 'Publicar',
  CALIBRATE: 'Calibrar',
  CALIBRATE2: 'Calibrar',
  SUBMIT: 'Submeter',
  SUBMIT2: 'Submeter',
  SAVE_DRAFT: 'Guardar rascunho',
};

/** Rótulo PT de uma acção, com fallback legível para acções não mapeadas. */
export function actionLabel(action: string): string {
  if (!action) return '—';
  const key = action.toUpperCase().replace(/[\s-]+/g, '_');
  if (ACTION_LABELS[key]) return ACTION_LABELS[key];
  const pretty = key.replace(/_/g, ' ').toLowerCase();
  return pretty.charAt(0).toUpperCase() + pretty.slice(1);
}

// Rótulos PT das entidades auditadas.
export const ENTITY_LABELS: Record<string, string> = {
  User: 'Utilizador',
  EvaluationResponse: 'Resposta de avaliação',
  EvaluationResult: 'Resultado de avaliação',
  EvaluationCycle: 'Ciclo de avaliação',
  Competency: 'Competência',
  EvaluationQuestion: 'Pergunta de avaliação',
  Beneficiary: 'Beneficiário',
  Funder: 'Financiador',
  Partner: 'Parceiro',
};

/** Rótulo PT de uma entidade, com fallback para o nome original. */
export function entityLabel(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'logs', label: 'Logs' },
  { id: 'stats', label: 'Estatísticas' },
  { id: 'anomalies', label: 'Anomalias' },
  { id: 'timeline', label: 'Linha de Tempo' },
];

export const TITLES: Record<View, string> = {
  logs: 'Logs de Auditoria',
  stats: 'Estatísticas de Auditoria',
  anomalies: 'Detecção de Anomalias',
  timeline: 'Linha de Tempo por Recurso',
};
