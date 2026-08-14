// components/career-plans/constants.ts
// Configuração visual de readiness e tipos de meta de carreira.
// Extraído de app/(platform)/career-plans/page.tsx.

import {
  Award,
  BookOpen,
  Briefcase,
  Target,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { GoalType, ReadinessLevel } from './types';

// Cor da barra de progresso deixou de existir aqui — o ProgressBar da
// fundação é mono-cor (bg-accent); o sentido (pronto/em desenvolvimento/
// início) é comunicado só por `label`/`color` no texto adjacente, mesmo
// padrão usado em AnalyticsTab/OverviewTab do engagement.
export const READINESS_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; bg: string }
> = {
  READY: {
    label: 'Pronto',
    color: 'text-success-ink',
    bg: 'bg-success-subtle border-success',
  },
  DEVELOPING: {
    label: 'Em Desenvolvimento',
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle border-warning',
  },
  STARTING: {
    label: 'Início',
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle border-danger',
  },
};

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  COURSE: 'Curso',
  PROJECT: 'Projecto',
  MENTORING: 'Mentoria',
  CERTIFICATION: 'Certificação',
  SKILL: 'Skill',
  OTHER: 'Outro',
};

export const GOAL_TYPE_ICONS: Record<GoalType, LucideIcon> = {
  COURSE: BookOpen,
  PROJECT: Briefcase,
  MENTORING: Users,
  CERTIFICATION: Award,
  SKILL: Zap,
  OTHER: Target,
};
