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
