// components/onboarding/constants.ts
// Mapas de badges/labels, ordem de fases e navegação do módulo.
// Extraído de app/(platform)/onboarding/page.tsx.
//
// STATUS_CFG/TASK_STATUS_CFG/CATEGORY_CFG migrados para os tokens
// semânticos da fundação de design (Fase A) — mesmo padrão de TOKEN
// usado em components/trainings/constants.ts e
// components/reports/constants.ts. CATEGORY_CFG tem exactamente 7
// categorias de domínio para os 6 tokens semânticos + neutral, por isso
// cada uma recebe um token distinto (sem reaproveitamento).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  OnboardingStatus,
  TaskCategory,
  TaskPhase,
  TaskStatus,
  View,
} from './types';

const TOKEN = {
  primary: { color: 'text-primary', bg: 'bg-primary-subtle' },
  accent: { color: 'text-accent', bg: 'bg-accent-subtle' },
  success: { color: 'text-success-ink', bg: 'bg-success-subtle' },
  warning: { color: 'text-warning-ink', bg: 'bg-warning-subtle' },
  danger: { color: 'text-danger-ink', bg: 'bg-danger-subtle' },
  info: { color: 'text-info-ink', bg: 'bg-info-subtle' },
  neutral: { color: 'text-ink-muted', bg: 'bg-surface-sunken' },
} as const;

const cls = (t: (typeof TOKEN)[keyof typeof TOKEN]) => `${t.bg} ${t.color}`;

export const STATUS_CFG: StatusBadgeMap<OnboardingStatus> = {
  NOT_STARTED: { label: 'Não iniciado', cls: cls(TOKEN.neutral) },
  IN_PROGRESS: { label: 'Em progresso', cls: cls(TOKEN.info) },
  COMPLETED: { label: 'Concluído', cls: cls(TOKEN.success) },
  ABANDONED: { label: 'Abandonado', cls: cls(TOKEN.danger) },
  ON_HOLD: { label: 'Em pausa', cls: cls(TOKEN.warning) },
};

export const TASK_STATUS_CFG: Record<
  TaskStatus,
  { icon: string; cls: string }
> = {
  PENDING: { icon: '○', cls: 'text-ink-faint' },
  IN_PROGRESS: { icon: '▶', cls: 'text-info' },
  COMPLETED: { icon: '✓', cls: 'text-success' },
  BLOCKED: { icon: '🔒', cls: 'text-ink-faint' },
  SKIPPED: { icon: '⤷', cls: 'text-ink-faint' },
};

export const CATEGORY_CFG: Record<
  TaskCategory,
  { label: string; icon: string; cls: string }
> = {
  DOCUMENTS: { label: 'Documentos', icon: '📄', cls: cls(TOKEN.warning) },
  IT_ACCESS: { label: 'TI & Acesso', icon: '💻', cls: cls(TOKEN.info) },
  TRAINING: { label: 'Formação', icon: '🎓', cls: cls(TOKEN.accent) },
  SOCIAL: { label: 'Social', icon: '👥', cls: cls(TOKEN.success) },
  BENEFITS: { label: 'Benefícios', icon: '🎁', cls: cls(TOKEN.primary) },
  ADMIN: { label: 'Admin', icon: '📋', cls: cls(TOKEN.neutral) },
  MEETING: { label: 'Reunião', icon: '📅', cls: cls(TOKEN.danger) },
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
  { id: 'my-plan', label: ' O Meu plano de Integração' },
  { id: 'dashboard', label: ' Dashboard' },
  { id: 'templates', label: ' Templates' },
];

export const TITLES: Record<View, string> = {
  'my-plan': 'O Meu Plano de Integração',
  dashboard: 'Dashboard de Integração',
  templates: 'Templates de Integração',
};
