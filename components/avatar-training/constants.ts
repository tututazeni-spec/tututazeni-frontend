// components/avatar-training/constants.ts
// Constantes de domínio (categoria/dificuldade/cor de score) partilhadas
// pelos componentes de apresentação do módulo.
//
// Classificação de cor (rollout Fase B, Vaga 3 — ver nota "gráficos" da
// Task 0 do plano de rollout):
// - CATEGORY_CONFIG: codificação CATEGÓRICA (8 categorias de cenário sem
//   ordem/severidade — SOFT_SKILLS, SALES, CUSTOMER_SERVICE, ONBOARDING,
//   COMPLIANCE, LEADERSHIP, NEGOTIATION, SECURITY). A fundação só tem 6
//   tokens semânticos (primary/accent/success/warning/danger/info);
//   forçar 8 categorias nominais para 6 tokens de estado criaria
//   colisões E significados falsos (ex.: COMPLIANCE a ficar `danger`
//   sugere "está mal", quando é só uma categoria). Fica **fora** desta
//   migração — mantém a paleta Tailwind crua tal como estava, tal como
//   a nota do plano de rollout previu para este módulo.
// - DIFF_COLOR e SCORE_COLOR: decorativo/estado — rampa ORDINAL de 4
//   níveis (fácil→difícil / score baixo→alto), exactamente o mesmo
//   padrão já usado em `components/engagement/constants.ts` (LEVEL_CONFIG)
//   e `components/engagement/AnalyticsTab.tsx` (scoreTextClass): migradas
//   para os tokens semânticos success/info/warning/danger.

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
import type { BadgeProps } from '@/components/ui/Badge';

// Codificação categórica — ver nota acima. Não migrado para os tokens
// semânticos (fora do escopo desta migração).
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

// Rampa ordinal fácil→difícil, mesma convenção de 4 níveis usada em
// LEVEL_CONFIG (engagement): melhor/mais fácil = success, pior/mais
// difícil = danger, com info/warning como degraus intermédios.
export const DIFF_INTENT: Record<string, BadgeProps['intent']> = {
  BEGINNER: 'success',
  INTERMEDIATE: 'info',
  ADVANCED: 'warning',
  EXPERT: 'danger',
};

// Rampa ordinal score baixo→alto — mesma convenção de scoreTextClass em
// components/engagement/AnalyticsTab.tsx.
export const SCORE_COLOR = (s: number) =>
  s >= 90
    ? 'text-success'
    : s >= 75
      ? 'text-info'
      : s >= 60
        ? 'text-warning'
        : 'text-danger';
