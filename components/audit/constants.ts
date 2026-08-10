// components/audit/constants.ts
// Mapas de badges/ícones e navegação do módulo de auditoria.
// Extraído de app/(platform)/audit/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Severity, Status, View } from './types';

export const SEVERITY_CFG: Record<Severity, { cls: string; dot: string }> = {
  LOW: { cls: 'text-gray-400', dot: 'bg-gray-300' },
  MEDIUM: { cls: 'text-blue-600', dot: 'bg-blue-400' },
  HIGH: { cls: 'text-amber-600', dot: 'bg-amber-400' },
  CRITICAL: { cls: 'text-red-600', dot: 'bg-red-500' },
};

export const STATUS_CFG: StatusBadgeMap<Status> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-emerald-50 text-emerald-700' },
  FAILED: { label: 'Falhou', cls: 'bg-red-50 text-red-700' },
  DENIED: { label: 'Negado', cls: 'bg-amber-50 text-amber-700' },
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
