// components/analytics/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/analytics/page.tsx.
//
// `roles`: espelha o @Roles() do endpoint principal de cada separador em
// src/analytics/analytics.controller.ts — omitido = sem @Roles() (visível a
// qualquer autenticado, ex.: "O Meu Progresso"). Confirmar sempre contra o
// controller antes de alargar, nunca adivinhar (ver memory
// project_innova_role_array_drift).

import {
  BarChart2,
  BookOpen,
  DollarSign,
  GraduationCap,
  History,
  LayoutDashboard,
  Sparkles,
  Target,
  TrendingUp,
  TriangleAlert,
  UserCog,
  Users,
  UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ADMIN_ROLES, EXECUTIVE_ROLES, type Role } from '@/lib/roles';
import type { View } from './types';

export const NAV: Array<{
  id: View;
  label: string;
  icon: LucideIcon;
  roles?: readonly Role[];
}> = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard, roles: EXECUTIVE_ROLES },
  { id: 'my', label: 'O Meu Progresso', icon: TrendingUp },
  { id: 'manager', label: 'Equipa', icon: UsersRound, roles: EXECUTIVE_ROLES },
  { id: 'hr', label: 'RH', icon: UserCog, roles: ADMIN_ROLES },
  { id: 'learning', label: 'Aprendizagem', icon: GraduationCap, roles: EXECUTIVE_ROLES },
  { id: 'courses', label: 'Cursos', icon: BookOpen, roles: EXECUTIVE_ROLES },
  { id: 'pdi', label: 'PDI', icon: Target, roles: EXECUTIVE_ROLES },
  { id: 'competencies', label: 'Competências', icon: BarChart2, roles: EXECUTIVE_ROLES },
  { id: 'people', label: 'Pessoas', icon: Users, roles: ADMIN_ROLES },
  { id: 'engagement', label: 'Engagement', icon: Sparkles, roles: EXECUTIVE_ROLES },
  { id: 'roi', label: 'ROI Formação', icon: DollarSign, roles: ADMIN_ROLES },
  { id: 'risks', label: 'Riscos', icon: TriangleAlert, roles: EXECUTIVE_ROLES },
  { id: 'snapshots', label: 'Snapshots', icon: History, roles: ADMIN_ROLES },
];

export const TITLES: Record<View, string> = {
  overview: 'Análise de Dados',
  my: 'O Meu Dashboard',
  manager: 'Dashboard Gestor',
  hr: 'Dashboard RH',
  risks: 'Alertas de Risco',
  learning: 'Analytics de Aprendizagem',
  people: 'People Analytics',
  pdi: 'Analytics de PDI',
  competencies: 'Mapa de Gaps de Competências',
  engagement: 'Métricas de Engagement',
  roi: 'ROI de Formação',
  courses: 'Performance de Cursos',
  snapshots: 'Histórico de Snapshots',
};
