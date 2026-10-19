// components/trainings/plans/planTones.ts
// Tom dos badges (NavyBadge) do estado e da prioridade do plano — partilhado
// pela lista (PlansView) e pelo detalhe (PlanDetailView).

import type { NavyTone } from '@/components/courses/NavyCard';
import type { TrainingPlanStatus, TrainingPriority } from '../types';

export const PLAN_TONE: Record<TrainingPlanStatus, NavyTone> = {
  DRAFT: 'neutral',
  SUBMITTED: 'warning',
  APPROVED: 'info',
  REJECTED: 'danger',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

export const PRIORITY_TONE: Record<TrainingPriority, NavyTone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};
