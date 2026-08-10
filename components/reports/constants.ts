// components/reports/constants.ts
// Configuração de categorias, caminhos de API por template e tabs
// do módulo de relatórios. Extraído de
// app/(platform)/reports/page.tsx.

import {
  Activity,
  BarChart2,
  Brain,
  BookOpen,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const CAT_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  HR: {
    label: 'RH & Pessoas',
    icon: Users,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  LEARNING: {
    label: 'Aprendizagem',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  PERFORMANCE: {
    label: 'Performance',
    icon: Star,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  TALENT: {
    label: 'Talento',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  ENGAGEMENT: {
    label: 'Engagement',
    icon: Activity,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
  },
  COMPLIANCE: {
    label: 'Compliance',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  OPERATIONAL: {
    label: 'Operacional',
    icon: BarChart2,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
  FINANCIAL: {
    label: 'Financeiro',
    icon: BarChart2,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
};

export const REPORT_PATHS: Record<string, string> = {
  headcount: `/reports/hr/headcount`,
  turnover: `/reports/hr/turnover`,
  training: `/reports/learning/training`,
  'skill-gap': `/reports/learning/skill-gap`,
  performance: `/reports/performance`,
  talent: `/reports/talent`,
  engagement: `/reports/engagement`,
  compliance: `/reports/compliance`,
  usage: `/reports/operational/usage`,
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'hub', label: 'Report Hub', icon: BarChart2 },
  { id: 'insights', label: 'Insights IA', icon: Brain },
];
