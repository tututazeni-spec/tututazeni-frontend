// components/leader/constants.ts
// Mapa de cores de risco e navegação de tabs do Leader Hub. Extraído
// de app/(platform)/leader/page.tsx.

import { Award, Star, Target, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const RISK_COLOR: Record<string, string> = {
  HIGH: 'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-teal-100 text-teal-700',
  NONE: 'bg-slate-100 text-slate-500',
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'team', label: 'Equipa', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'pipeline', label: 'Talentos', icon: Award },
  { id: 'plans', label: 'PDIs', icon: Target },
];
