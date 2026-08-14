// components/leader/constants.ts
// Mapa de cores de risco e navegação de tabs do Leader Hub. Extraído
// de app/(platform)/leader/page.tsx.

import { Award, Star, Target, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/Badge';
import type { Tab } from './types';

export const RISK_INTENT: Record<string, NonNullable<BadgeProps['intent']>> = {
  HIGH: 'danger',
  MEDIUM: 'warning',
  LOW: 'success',
  NONE: 'neutral',
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
  { id: 'team', label: 'Equipa', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'pipeline', label: 'Talentos', icon: Award },
  { id: 'plans', label: 'PDIs', icon: Target },
];
