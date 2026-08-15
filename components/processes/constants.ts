// components/processes/constants.ts
// Mapas de badge e helpers de formatação partilhados pelos componentes de
// apresentação do módulo de processos. Extraído verbatim de
// app/(platform)/processes/page.tsx. Cores mapeadas para os tokens
// semânticos da fundação de design (Fase A).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  InstanceStatus,
  ProcessStatus,
  RiskLevel,
  StepType,
} from './types';

export function fmtDuration(minutes: number | null): string {
  if (!minutes) return '—';
  if (minutes < 60) return `${minutes}min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
}

export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date() > new Date(deadline);
}

export const PROCESS_STATUS_MAP: StatusBadgeMap<ProcessStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

// Gradação de risco — mesma convenção usada em components/audit/constants.ts
// (SEVERITY_CFG): neutro → info → warning → danger.
export const RISK_LEVEL_MAP: StatusBadgeMap<RiskLevel> = {
  LOW: { label: 'Baixo', cls: 'bg-surface-sunken text-ink-muted' },
  MEDIUM: { label: 'Médio', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alto', cls: 'bg-warning-subtle text-warning-ink' },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger-subtle text-danger-ink' },
};

export const INSTANCE_STATUS_MAP: StatusBadgeMap<InstanceStatus> = {
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-info-subtle text-info-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-success-subtle text-success-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-faint' },
  ON_HOLD: { label: 'Suspenso', cls: 'bg-warning-subtle text-warning-ink' },
};

export const STEP_TYPE_MAP: StatusBadgeMap<StepType> = {
  START: { label: 'Início', cls: 'bg-success-subtle text-success-ink' },
  END: { label: 'Fim', cls: 'bg-surface-sunken text-ink-muted' },
  TASK: { label: 'Tarefa', cls: 'bg-info-subtle text-info-ink' },
  DECISION: { label: 'Decisão', cls: 'bg-primary-subtle text-primary' },
  GATEWAY: { label: 'Gateway', cls: 'bg-warning-subtle text-warning-ink' },
  REVIEW: { label: 'Revisão', cls: 'bg-accent-subtle text-accent' },
};
