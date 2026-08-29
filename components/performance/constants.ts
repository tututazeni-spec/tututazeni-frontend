// components/performance/constants.ts
// Mapas de badges, labels da matriz 9-box e navegação. Extraído de
// app/(platform)/performance/page.tsx. Cores mapeadas para os tokens
// semânticos da fundação de design (Fase A).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { GoalStatus, PerfCategory, ReviewStatus, View } from './types';

export const REVIEW_STATUS_MAP: StatusBadgeMap<ReviewStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PENDING_SELF: {
    label: 'Autoavaliação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  PENDING_MANAGER: {
    label: 'Gestor pendente',
    cls: 'bg-info-subtle text-info-ink',
  },
  PENDING_360: {
    label: '360° pendente',
    cls: 'bg-primary-subtle text-primary',
  },
  CALIBRATION: { label: 'Calibração', cls: 'bg-accent-subtle text-accent' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success-subtle text-success-ink' },
  DISPUTE: { label: 'Disputa', cls: 'bg-danger-subtle text-danger-ink' },
  FINALIZED: { label: 'Finalizado', cls: 'bg-surface-sunken text-ink-muted' },
};

export const PERF_CATEGORY_MAP: StatusBadgeMap<PerfCategory> = {
  HIGH: { label: 'Alto desempenho', cls: 'bg-success-subtle text-success-ink' },
  MEDIUM: { label: 'Médio', cls: 'bg-warning-subtle text-warning-ink' },
  LOW: { label: 'Baixo', cls: 'bg-danger-subtle text-danger-ink' },
};

export const GOAL_STATUS_MAP: StatusBadgeMap<GoalStatus> = {
  ON_TRACK: { label: 'No prazo', cls: 'bg-success-subtle text-success-ink' },
  AT_RISK: { label: 'Em risco', cls: 'bg-warning-subtle text-warning-ink' },
  OFF_TRACK: { label: 'Atrasado', cls: 'bg-danger-subtle text-danger-ink' },
  COMPLETED: { label: 'Concluído', cls: 'bg-info-subtle text-info-ink' },
};

export const BOX_LABELS: Record<
  string,
  { label: string; cls: string; desc: string }
> = {
  '3-3': {
    label: 'Estrela',
    cls: 'bg-success-subtle border-success',
    desc: 'Alto potencial, alto desempenho',
  },
  '3-2': {
    label: 'Alto Desempenho',
    cls: 'bg-success-subtle border-success/50',
    desc: 'Alto desempenho, potencial médio',
  },
  '3-1': {
    label: 'Sólido',
    cls: 'bg-info-subtle border-info',
    desc: 'Alto desempenho, baixo potencial',
  },
  '2-3': {
    label: 'Potencial',
    cls: 'bg-warning-subtle border-warning',
    desc: 'Médio desempenho, alto potencial',
  },
  '2-2': {
    label: 'Núcleo',
    cls: 'bg-surface-sunken border-border',
    desc: 'Médio desempenho e potencial',
  },
  '2-1': {
    label: 'A Desenvolver',
    cls: 'bg-accent-subtle border-accent',
    desc: 'Médio desempenho, baixo potencial',
  },
  '1-3': {
    label: 'Enigma',
    cls: 'bg-primary-subtle border-primary',
    desc: 'Baixo desempenho, alto potencial',
  },
  '1-2': {
    label: 'Questionar',
    cls: 'bg-danger-subtle border-danger/50',
    desc: 'Baixo desempenho, potencial médio',
  },
  '1-1': {
    label: 'Subutilizado',
    cls: 'bg-danger-subtle border-danger',
    desc: 'Baixo desempenho e potencial',
  },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'O meu desempenho' },
  { id: 'team', label: 'A minha equipa' },
  { id: 'matrix9box', label: 'Matriz 9-Box ' },
  { id: 'analytics', label: 'Análises' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'O meu Desempenho',
  team: 'Performance da Equipa',
  matrix9box: 'Matriz 9-Box',
  analytics: 'Análises de Performance',
};
