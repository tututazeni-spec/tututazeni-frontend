// components/development-plans/constants.ts
// Mapas de badges/labels e navegação do módulo de PDI. Extraído de
// app/(platform)/development-plans/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type {
  ActionStatus,
  ActionType,
  PlanStatus,
  Priority,
  View,
} from './types';

export const STATUS_CFG: StatusBadgeMap<PlanStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  PENDING_APPROVAL: {
    label: 'Ag. aprovação',
    cls: 'bg-amber-50 text-amber-700',
  },
  ACTIVE: { label: 'Activo', cls: 'bg-emerald-50 text-emerald-700' },
  COMPLETED: { label: 'Concluído', cls: 'bg-blue-50 text-blue-700' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-red-50 text-red-500' },
  OVERDUE: { label: 'Atrasado', cls: 'bg-red-100 text-red-700' },
};

export const ACTION_CFG: Record<
  ActionType,
  { icon: string; label: string; cls: string }
> = {
  COURSE: { icon: '🎓', label: 'Curso', cls: 'bg-blue-50 text-blue-700' },
  MENTORING: {
    icon: '👥',
    label: 'Mentoria',
    cls: 'bg-purple-50 text-purple-700',
  },
  COACHING: {
    icon: '🎯',
    label: 'Coaching',
    cls: 'bg-amber-50 text-amber-700',
  },
  READING: {
    icon: '📚',
    label: 'Leitura',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  PROJECT: { icon: '🚀', label: 'Projecto', cls: 'bg-red-50 text-red-700' },
  JOB_ROTATION: {
    icon: '🔄',
    label: 'Job Rotation',
    cls: 'bg-orange-50 text-orange-700',
  },
  MICROLEARNING: {
    icon: '⚡',
    label: 'Micro-Learning',
    cls: 'bg-pink-50 text-pink-700',
  },
  WORKSHOP: { icon: '🛠', label: 'Workshop', cls: 'bg-teal-50 text-teal-700' },
  CERTIFICATION: {
    icon: '🏆',
    label: 'Certificação',
    cls: 'bg-gold-50 text-yellow-700',
  },
  OTHER: { icon: '📌', label: 'Outro', cls: 'bg-gray-100 text-gray-600' },
};

export const ACTION_STATUS: Record<
  ActionStatus,
  { icon: string; cls: string; label: string }
> = {
  TODO: { icon: '○', cls: 'text-gray-400', label: 'A fazer' },
  IN_PROGRESS: { icon: '▶', cls: 'text-blue-500', label: 'Em progresso' },
  COMPLETED: { icon: '✓', cls: 'text-emerald-500', label: 'Concluída' },
  BLOCKED: { icon: '🔒', cls: 'text-gray-400', label: 'Bloqueada' },
  CANCELLED: { icon: '✕', cls: 'text-red-400', label: 'Cancelada' },
};

export const PRIORITY_CFG: StatusBadgeMap<Priority> = {
  LOW: { label: 'Baixa', cls: 'bg-gray-100 text-gray-500' },
  MEDIUM: { label: 'Média', cls: 'bg-blue-50 text-blue-600' },
  HIGH: { label: 'Alta', cls: 'bg-amber-50 text-amber-700' },
  URGENT: { label: 'Urgente', cls: 'bg-red-100 text-red-700' },
};

export const NAV = [
  { id: 'my-plans', label: '🎯 Os meus PDIs' },
  { id: 'team', label: '👥 Equipa' },
] as const;

export const TITLES: Record<View, string> = {
  'my-plans': 'Planos de Desenvolvimento',
  detail: 'Detalhe do PDI',
  team: 'PDIs da Equipa',
  create: 'Novo PDI',
};
