// components/analytics/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/analytics/page.tsx.

import {
  LayoutDashboard,
  TrendingUp,
  TriangleAlert,
  UserCog,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { View } from './types';

export const NAV: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'my', label: 'O Meu Progresso', icon: TrendingUp },
  { id: 'manager', label: 'Equipa', icon: UsersRound },
  { id: 'hr', label: 'RH', icon: UserCog },
  { id: 'risks', label: 'Riscos', icon: TriangleAlert },
];

export const TITLES: Record<View, string> = {
  overview: 'Análise de Dados',
  my: 'O Meu Dashboard',
  manager: 'Dashboard Gestor',
  hr: 'Dashboard RH',
  risks: 'Alertas de Risco',
};
