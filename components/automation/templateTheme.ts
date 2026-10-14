// components/automation/templateTheme.ts
// Aspecto visual dos cards de modelos: uma cor por modelo e a ilustração do
// topo escolhida pelo título. Classes literais para o Tailwind as detectar.

import {
  AlertTriangle,
  ClipboardCheck,
  Clock,
  FileText,
  Gift,
  GraduationCap,
  Heart,
  Receipt,
  RefreshCw,
  Settings2,
  Siren,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { AutomationTemplate } from './types';

export interface TemplatePalette {
  header: string;
  tile: string;
  panel: string;
  divider: string;
  border: string;
  accent: string;
  dot: string;
}

export const TEMPLATE_PALETTES: TemplatePalette[] = [
  {
    header: 'from-blue-600 via-blue-500 to-sky-300',
    tile: 'from-blue-600 to-blue-700',
    panel: 'bg-blue-50/70',
    divider: 'border-blue-100',
    border: 'border-blue-100',
    accent: 'text-blue-600',
    dot: 'bg-blue-500',
  },
  {
    header: 'from-violet-600 via-violet-500 to-fuchsia-300',
    tile: 'from-violet-600 to-violet-700',
    panel: 'bg-violet-50/70',
    divider: 'border-violet-100',
    border: 'border-violet-100',
    accent: 'text-violet-600',
    dot: 'bg-violet-500',
  },
  {
    header: 'from-emerald-600 via-emerald-500 to-lime-300',
    tile: 'from-emerald-600 to-emerald-700',
    panel: 'bg-emerald-50/70',
    divider: 'border-emerald-100',
    border: 'border-emerald-100',
    accent: 'text-emerald-600',
    dot: 'bg-emerald-500',
  },
  {
    header: 'from-orange-600 via-orange-500 to-amber-300',
    tile: 'from-orange-600 to-orange-700',
    panel: 'bg-orange-50/70',
    divider: 'border-orange-100',
    border: 'border-orange-100',
    accent: 'text-orange-600',
    dot: 'bg-orange-500',
  },
  {
    header: 'from-rose-600 via-rose-500 to-pink-300',
    tile: 'from-rose-600 to-rose-700',
    panel: 'bg-rose-50/70',
    divider: 'border-rose-100',
    border: 'border-rose-100',
    accent: 'text-rose-600',
    dot: 'bg-rose-500',
  },
  {
    header: 'from-teal-600 via-teal-500 to-cyan-300',
    tile: 'from-teal-600 to-teal-700',
    panel: 'bg-teal-50/70',
    divider: 'border-teal-100',
    border: 'border-teal-100',
    accent: 'text-teal-600',
    dot: 'bg-teal-500',
  },
  {
    header: 'from-indigo-700 via-indigo-500 to-blue-300',
    tile: 'from-indigo-600 to-indigo-700',
    panel: 'bg-indigo-50/70',
    divider: 'border-indigo-100',
    border: 'border-indigo-100',
    accent: 'text-indigo-600',
    dot: 'bg-indigo-500',
  },
  {
    header: 'from-amber-600 via-amber-500 to-yellow-300',
    tile: 'from-amber-500 to-amber-600',
    panel: 'bg-amber-50/70',
    divider: 'border-amber-100',
    border: 'border-amber-100',
    accent: 'text-amber-600',
    dot: 'bg-amber-500',
  },
  {
    header: 'from-cyan-600 via-cyan-500 to-sky-300',
    tile: 'from-cyan-600 to-cyan-700',
    panel: 'bg-cyan-50/70',
    divider: 'border-cyan-100',
    border: 'border-cyan-100',
    accent: 'text-cyan-600',
    dot: 'bg-cyan-500',
  },
  {
    header: 'from-fuchsia-600 via-fuchsia-500 to-pink-300',
    tile: 'from-fuchsia-600 to-fuchsia-700',
    panel: 'bg-fuchsia-50/70',
    divider: 'border-fuchsia-100',
    border: 'border-fuchsia-100',
    accent: 'text-fuchsia-600',
    dot: 'bg-fuchsia-500',
  },
  {
    header: 'from-red-600 via-red-500 to-orange-300',
    tile: 'from-red-600 to-red-700',
    panel: 'bg-red-50/70',
    divider: 'border-red-100',
    border: 'border-red-100',
    accent: 'text-red-600',
    dot: 'bg-red-500',
  },
  {
    header: 'from-sky-600 via-sky-500 to-teal-300',
    tile: 'from-sky-600 to-sky-700',
    panel: 'bg-sky-50/70',
    divider: 'border-sky-100',
    border: 'border-sky-100',
    accent: 'text-sky-600',
    dot: 'bg-sky-500',
  },
];

const CATEGORY_ICON: Record<string, LucideIcon> = {
  HR: Users,
  LMS: GraduationCap,
  PERFORMANCE: TrendingUp,
  ENGAGEMENT: Heart,
  GAMIFICATION: Trophy,
  OPERATIONAL: Settings2,
};

// Primeira regra que casar com o título (ou gatilho) decide a ilustração.
const TITLE_ICONS: [RegExp, LucideIcon][] = [
  [/anivers|birthday/i, Gift],
  [/onboarding|novo colaborador/i, UserPlus],
  [/recibo/i, Receipt],
  [/documento/i, FileText],
  [/sincroniza/i, RefreshCw],
  [/falhas?|erro/i, AlertTriangle],
  [/escalon/i, Siren],
  [/aprova|encaminh/i, ClipboardCheck],
  [/avalia/i, ClipboardCheck],
  [/falta|atraso|prazo/i, Clock],
  [/forma[çc]|curso|sess/i, GraduationCap],
  [/desenvolvimento|pdi/i, TrendingUp],
];

export function templateIcon(
  t: Pick<AutomationTemplate, 'name' | 'trigger' | 'category'>,
): LucideIcon {
  const hit = TITLE_ICONS.find(([re]) => re.test(`${t.name} ${t.trigger}`));
  return hit?.[1] ?? CATEGORY_ICON[t.category?.toUpperCase() ?? ''] ?? Workflow;
}
