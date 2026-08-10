// components/performance/constants.ts
// Mapas de badges, labels da matriz 9-box e navegação. Extraído de
// app/(platform)/performance/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { GoalStatus, PerfCategory, ReviewStatus, View } from './types';

export const REVIEW_STATUS_MAP: StatusBadgeMap<ReviewStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  PENDING_SELF: { label: 'Autoavaliação', cls: 'bg-amber-50 text-amber-700' },
  PENDING_MANAGER: {
    label: 'Gestor pendente',
    cls: 'bg-blue-50 text-blue-700',
  },
  PENDING_360: {
    label: '360° pendente',
    cls: 'bg-purple-50 text-purple-700',
  },
  CALIBRATION: { label: 'Calibração', cls: 'bg-orange-50 text-orange-700' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
  DISPUTE: { label: 'Disputa', cls: 'bg-red-50 text-red-700' },
  FINALIZED: { label: 'Finalizado', cls: 'bg-gray-100 text-gray-600' },
};

export const PERF_CATEGORY_MAP: StatusBadgeMap<PerfCategory> = {
  HIGH: { label: 'Alto desempenho', cls: 'bg-emerald-100 text-emerald-800' },
  MEDIUM: { label: 'Médio', cls: 'bg-amber-100 text-amber-800' },
  LOW: { label: 'Baixo', cls: 'bg-red-100 text-red-800' },
};

export const GOAL_STATUS_MAP: StatusBadgeMap<GoalStatus> = {
  ON_TRACK: { label: 'No prazo', cls: 'bg-emerald-50 text-emerald-700' },
  AT_RISK: { label: 'Em risco', cls: 'bg-amber-50 text-amber-700' },
  OFF_TRACK: { label: 'Atrasado', cls: 'bg-red-50 text-red-700' },
  COMPLETED: { label: 'Concluído', cls: 'bg-blue-50 text-blue-700' },
};

export const BOX_LABELS: Record<
  string,
  { label: string; cls: string; desc: string }
> = {
  '3-3': {
    label: 'Estrela',
    cls: 'bg-emerald-100 border-emerald-300',
    desc: 'Alto potencial, alto desempenho',
  },
  '3-2': {
    label: 'Alto Desempenho',
    cls: 'bg-emerald-50 border-emerald-200',
    desc: 'Alto desempenho, potencial médio',
  },
  '3-1': {
    label: 'Sólido',
    cls: 'bg-blue-50 border-blue-200',
    desc: 'Alto desempenho, baixo potencial',
  },
  '2-3': {
    label: 'Potencial',
    cls: 'bg-amber-50 border-amber-200',
    desc: 'Médio desempenho, alto potencial',
  },
  '2-2': {
    label: 'Núcleo',
    cls: 'bg-gray-50 border-gray-200',
    desc: 'Médio desempenho e potencial',
  },
  '2-1': {
    label: 'A Desenvolver',
    cls: 'bg-orange-50 border-orange-200',
    desc: 'Médio desempenho, baixo potencial',
  },
  '1-3': {
    label: 'Enigma',
    cls: 'bg-purple-50 border-purple-200',
    desc: 'Baixo desempenho, alto potencial',
  },
  '1-2': {
    label: 'Questionar',
    cls: 'bg-red-50 border-red-200',
    desc: 'Baixo desempenho, potencial médio',
  },
  '1-1': {
    label: 'Subutilizado',
    cls: 'bg-red-100 border-red-300',
    desc: 'Baixo desempenho e potencial',
  },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'O meu desempenho' },
  { id: 'team', label: 'A minha equipa' },
  { id: 'matrix9box', label: '9-Box Matrix' },
  { id: 'analytics', label: 'Analytics' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'O meu Desempenho',
  team: 'Performance da Equipa',
  matrix9box: 'Matriz 9-Box',
  analytics: 'Analytics de Performance',
};
