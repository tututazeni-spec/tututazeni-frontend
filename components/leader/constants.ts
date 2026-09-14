// components/leader/constants.ts
// Mapa de cores de risco e navegação de tabs do Leader Hub. Extraído
// de app/(platform)/leader/page.tsx.

import { Award, Star, Target, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BadgeProps } from '@/components/ui/Badge';
import type { Role } from '@/lib/roles';
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

/**
 * Espelha ALL_MGMT em src/leadership/leader.controller.ts (o antigo
 * LeaderController, fundido no módulo de Liderança). Usado pela página
 * fundida app/(platform)/leadership/page.tsx para esconder a secção
 * "Gestão de Equipa" de quem não tem nenhum destes papéis — só a UI;
 * o backend continua a validar por endpoint.
 */
export const TEAM_MANAGEMENT_ROLES: readonly Role[] = [
  'ADMIN',
  'RH',
  'LIDER',
  'DIRECTOR',
  'GESTOR',
];
