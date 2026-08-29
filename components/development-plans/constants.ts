// components/development-plans/constants.ts
// Mapas de badges/labels e navegação do módulo de PDI. Cores mapeadas
// para os tokens semânticos da fundação de design (Fase A) — os tipos
// de acção (COURSE/MENTORING/...) são categorias decorativas, não
// estados, por isso repetem tokens onde não há uma correspondência 1:1.
// Extraído de app/(platform)/development-plans/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ActionStatus,
  ActionType,
  PlanStatus,
  Priority,
  View,
} from './types';

export const STATUS_CFG: StatusBadgeMap<PlanStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PENDING_APPROVAL: {
    label: 'Ag. aprovação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ACTIVE: { label: 'Activo', cls: 'bg-success-subtle text-success-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-info-subtle text-info-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
  OVERDUE: { label: 'Atrasado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const ACTION_CFG: Record<ActionType, { label: string; cls: string }> = {
  COURSE: { label: 'Curso', cls: 'bg-info-subtle text-info-ink' },
  MENTORING: {
    label: 'Mentoria',
    cls: 'bg-primary-subtle text-primary',
  },
  COACHING: {
    label: 'Coaching',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  READING: {
    label: 'Leitura',
    cls: 'bg-success-subtle text-success-ink',
  },
  PROJECT: {
    label: 'Projecto',
    cls: 'bg-danger-subtle text-danger-ink',
  },
  JOB_ROTATION: {
    label: 'Rotação de Funções',
    cls: 'bg-accent-subtle text-accent',
  },
  MICROLEARNING: {
    label: 'Micro-aprendizagem',
    cls: 'bg-info-subtle text-info-ink',
  },
  WORKSHOP: {
    label: 'Workshop',
    cls: 'bg-success-subtle text-success-ink',
  },
  CERTIFICATION: {
    label: 'Certificação',
    cls: 'bg-accent-subtle text-accent',
  },
  OTHER: {
    label: 'Outro',
    cls: 'bg-surface-sunken text-ink-muted',
  },
};

export const ACTION_STATUS: Record<
  ActionStatus,
  { icon: string; cls: string; label: string }
> = {
  TODO: { icon: '○', cls: 'text-ink-faint', label: 'A fazer' },
  IN_PROGRESS: { icon: '▶', cls: 'text-info', label: 'Em progresso' },
  COMPLETED: { icon: '✓', cls: 'text-success', label: 'Concluída' },
  BLOCKED: { icon: '🔒', cls: 'text-ink-faint', label: 'Bloqueada' },
  CANCELLED: { icon: '✕', cls: 'text-danger', label: 'Cancelada' },
};

export const PRIORITY_CFG: StatusBadgeMap<Priority> = {
  LOW: { label: 'Baixa', cls: 'bg-surface-sunken text-ink-muted' },
  MEDIUM: { label: 'Média', cls: 'bg-info-subtle text-info-ink' },
  HIGH: { label: 'Alta', cls: 'bg-warning-subtle text-warning-ink' },
  URGENT: { label: 'Urgente', cls: 'bg-danger-subtle text-danger-ink' },
};

export const NAV = [
  { id: 'my-plans', label: 'Os meus PDIs' },
  { id: 'team', label: 'Equipa' },
] as const;

export const TITLES: Record<View, string> = {
  'my-plans': 'Planos de Desenvolvimento Individual',
  detail: 'Detalhe do PDI',
  team: 'PDIs da Equipa',
  create: 'Novo PDI',
};
