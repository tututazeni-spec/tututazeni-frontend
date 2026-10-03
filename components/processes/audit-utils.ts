// components/processes/audit-utils.ts
// Rótulos partilhados da aba «Histórico e Auditoria» (docs/Modulo_Processes.md §13).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { AuditSource } from './types';

export const AUDIT_SOURCE_LABEL: Record<AuditSource, string> = {
  INTERFACE: 'Interface',
  API: 'API / integração',
  AUTOMATION: 'Automação',
  SYSTEM: 'Sistema',
};

export const AUDIT_SOURCE_MAP: StatusBadgeMap<AuditSource> = {
  INTERFACE: { label: 'Interface', cls: 'bg-surface-sunken text-ink-muted' },
  API: { label: 'API', cls: 'bg-info-subtle text-info-ink' },
  AUTOMATION: { label: 'Automação', cls: 'bg-primary-subtle text-primary' },
  SYSTEM: { label: 'Sistema', cls: 'bg-surface-sunken text-ink-faint' },
};

export const AUDIT_RESULT_MAP: StatusBadgeMap<'SUCCESS' | 'FAILED'> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
};

export const ATTEMPT_STATUS_MAP: StatusBadgeMap<string> = {
  SUCCESS: { label: 'Sucesso', cls: 'bg-success-subtle text-success-ink' },
  DUPLICATE: { label: 'Duplicado ignorado', cls: 'bg-surface-sunken text-ink-muted' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
  REJECTED: { label: 'Rejeitado', cls: 'bg-warning-subtle text-warning-ink' },
  RECEIVED: { label: 'Em processamento', cls: 'bg-info-subtle text-info-ink' },
  RUNNING: { label: 'A correr', cls: 'bg-info-subtle text-info-ink' },
  PENDING: { label: 'Pendente', cls: 'bg-surface-sunken text-ink-muted' },
  SKIPPED: { label: 'Ignorada', cls: 'bg-surface-sunken text-ink-faint' },
};
