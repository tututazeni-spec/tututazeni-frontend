// components/audit/constants.ts
// Mapas de badges/ícones e navegação do módulo de auditoria. Cores
// mapeadas para os tokens semânticos da fundação de design (Fase A).
// Extraído de app/(platform)/audit/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Severity, Status, View } from './types';

export const SEVERITY_CFG: Record<Severity, { cls: string; dot: string }> = {
  LOW: { cls: 'text-ink-faint', dot: 'bg-ink-faint' },
  MEDIUM: { cls: 'text-info-ink', dot: 'bg-info' },
  HIGH: { cls: 'text-warning-ink', dot: 'bg-warning' },
  CRITICAL: { cls: 'text-danger-ink', dot: 'bg-danger' },
};

export const STATUS_CFG: StatusBadgeMap<Status> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
  DENIED: { label: 'Negado', cls: 'bg-warning-subtle text-warning-ink' },
};

export const ACTION_ICONS: Record<string, string> = {
  CREATE: '➕',
  UPDATE: '✏️',
  DELETE: '🗑️',
  LOGIN: '🔑',
  LOGOUT: '🚪',
  FAILED: '🚫',
  EXPORT: '📥',
  SEND: '📤',
  READ: '👁',
  APPROVE: '✅',
  REJECT: '❌',
  DENIED: '🔒',
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'logs', label: '📋 Logs' },
  { id: 'stats', label: '📊 Estatísticas' },
  { id: 'anomalies', label: '🚨 Anomalias' },
  { id: 'timeline', label: '⏱ Timeline' },
];

export const TITLES: Record<View, string> = {
  logs: 'Audit Logs',
  stats: 'Estatísticas de Auditoria',
  anomalies: 'Detecção de Anomalias',
  timeline: 'Timeline por Recurso',
};
