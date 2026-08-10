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

export const READINESS_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; bg: string; bar: string }
> = {
  READY: {
    label: 'Pronto',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50 border-emerald-200',
    bar: 'bg-emerald-500',
  },
  DEVELOPING: {
    label: 'Em Desenvolvimento',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    bar: 'bg-amber-500',
  },
  STARTING: {
    label: 'Início',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    bar: 'bg-red-400',
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
