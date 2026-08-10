// components/onboarding/constants.ts
// Mapas de badges/labels, ordem de fases e navegação do módulo.
// Extraído de app/(platform)/onboarding/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  OnboardingStatus,
  TaskCategory,
  TaskPhase,
  TaskStatus,
  View,
} from './types';

export const STATUS_CFG: StatusBadgeMap<OnboardingStatus> = {
  NOT_STARTED: { label: 'Não iniciado', cls: 'bg-gray-100 text-gray-500' },
  IN_PROGRESS: { label: 'Em progresso', cls: 'bg-blue-50 text-blue-700' },
  COMPLETED: { label: 'Concluído', cls: 'bg-emerald-50 text-emerald-700' },
  ABANDONED: { label: 'Abandonado', cls: 'bg-red-50 text-red-700' },
  ON_HOLD: { label: 'Em pausa', cls: 'bg-amber-50 text-amber-700' },
};

export const TASK_STATUS_CFG: Record<
  TaskStatus,
  { icon: string; cls: string }
> = {
  PENDING: { icon: '○', cls: 'text-gray-300' },
  IN_PROGRESS: { icon: '▶', cls: 'text-blue-500' },
  COMPLETED: { icon: '✓', cls: 'text-emerald-500' },
  BLOCKED: { icon: '🔒', cls: 'text-gray-400' },
  SKIPPED: { icon: '⤷', cls: 'text-gray-400' },
};

export const CATEGORY_CFG: Record<
  TaskCategory,
  { label: string; icon: string; cls: string }
> = {
  DOCUMENTS: {
    label: 'Documentos',
    icon: '📄',
    cls: 'bg-amber-50 text-amber-700',
  },
  IT_ACCESS: {
    label: 'TI & Acesso',
    icon: '💻',
    cls: 'bg-blue-50 text-blue-700',
  },
  TRAINING: {
    label: 'Formação',
    icon: '🎓',
    cls: 'bg-purple-50 text-purple-700',
  },
  SOCIAL: {
    label: 'Social',
    icon: '👥',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  BENEFITS: {
    label: 'Benefícios',
    icon: '🎁',
    cls: 'bg-pink-50 text-pink-700',
  },
  ADMIN: { label: 'Admin', icon: '📋', cls: 'bg-gray-100 text-gray-600' },
  MEETING: {
    label: 'Reunião',
    icon: '📅',
    cls: 'bg-orange-50 text-orange-700',
  },
};

export const PHASE_LABELS: Record<TaskPhase, string> = {
  PRE_BOARDING: 'Pré-boarding',
  DAY_1: 'Dia 1',
  WEEK_1: 'Semana 1',
  DAY_30: 'Dia 30',
  DAY_60: 'Dia 60',
  DAY_90: 'Dia 90',
};

export const PHASE_ORDER: TaskPhase[] = [
  'PRE_BOARDING',
  'DAY_1',
  'WEEK_1',
  'DAY_30',
  'DAY_60',
  'DAY_90',
];

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'my-plan', label: '🚀 O meu onboarding' },
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'templates', label: '📋 Templates' },
];

export const TITLES: Record<View, string> = {
  'my-plan': 'O meu Plano de Onboarding',
  dashboard: 'Dashboard de Onboarding',
  templates: 'Templates de Onboarding',
};
