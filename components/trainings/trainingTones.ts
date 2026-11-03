// components/trainings/trainingTones.ts
// Tom dos badges (NavyBadge) do estado e do nível da formação — partilhado
// pela lista da Gestão e pelo cabeçalho do detalhe.

import type { NavyTone } from '@/components/courses/NavyCard';
import type { TrainingLevel, TrainingStatus } from './types';

export const STATUS_TONE: Record<TrainingStatus, NavyTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
  CANCELLED: 'danger',
  COMPLETED: 'info',
};

export const LEVEL_TONE: Record<TrainingLevel, NavyTone> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'warning',
  ADVANCED: 'danger',
};

// Cor sólida de cada tom nas etiquetas (EventBadge) sobre cartões claros.
export const TONE_COLOR: Record<NavyTone, string> = {
  success: '#16A765',
  danger: '#C23A52',
  warning: '#F28C28',
  info: '#1267B8',
  neutral: '#64748B',
  light: '#2F7BEA',
};
