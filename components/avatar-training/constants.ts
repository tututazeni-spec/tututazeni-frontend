// components/avatar-training/constants.ts
// Constantes de domínio (categoria/dificuldade/cor de score) partilhadas
// pelos componentes de apresentação do módulo. Extraído verbatim de
// app/(platform)/avatar-training/page.tsx.

import {
  Brain,
  TrendingUp,
  Headphones,
  Users,
  Shield,
  Star,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  SOFT_SKILLS: {
    label: 'Soft Skills',
    icon: Brain,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
  },
  SALES: {
    label: 'Vendas',
    icon: TrendingUp,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  CUSTOMER_SERVICE: {
    label: 'Atendimento',
    icon: Headphones,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
  },
  ONBOARDING: {
    label: 'Onboarding',
    icon: Users,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
  },
  COMPLIANCE: {
    label: 'Compliance',
    icon: Shield,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
  LEADERSHIP: {
    label: 'Liderança',
    icon: Star,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
  NEGOTIATION: {
    label: 'Negociação',
    icon: MessageSquare,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
  },
  SECURITY: {
    label: 'Segurança',
    icon: Shield,
    color: 'text-slate-600',
    bg: 'bg-slate-50',
  },
};

export const DIFF_COLOR: Record<string, string> = {
  BEGINNER: 'bg-emerald-100 text-emerald-700',
  INTERMEDIATE: 'bg-amber-100 text-amber-700',
  ADVANCED: 'bg-orange-100 text-orange-700',
  EXPERT: 'bg-red-100 text-red-700',
};

export const SCORE_COLOR = (s: number) =>
  s >= 90
    ? 'text-emerald-600'
    : s >= 75
      ? 'text-teal-600'
      : s >= 60
        ? 'text-amber-600'
        : 'text-red-500';
