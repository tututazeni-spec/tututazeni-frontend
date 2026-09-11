// components/competencies/constants.ts
// Labels de nível, badge de categoria e navegação do módulo. Extraído
// de app/(platform)/competencies/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A).

import { NON_COLABORADOR_ROLES, type Role } from '@/lib/roles';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { CompetencyCategory, View } from './types';

export const LEVEL_LABELS = [
  '—',
  'Básico',
  'Elementar',
  'Intermédio',
  'Avançado',
  'Especialista',
];

export const CATEGORY_CFG: StatusBadgeMap<CompetencyCategory> = {
  HARD_SKILL: { label: 'Competências Técnicas', cls: 'bg-info-subtle text-info-ink' },
  SOFT_SKILL: { label: 'Competências Comportamentais', cls: 'bg-primary-subtle text-primary' },
  LANGUAGE: { label: 'Idioma', cls: 'bg-success-subtle text-success-ink' },
  TOOL: { label: 'Ferramenta', cls: 'bg-warning-subtle text-warning-ink' },
  LEADERSHIP: { label: 'Liderança', cls: 'bg-accent-subtle text-accent' },
};

// "Matriz de Competências" e "Dashboard RH" ficam escondidas de COLABORADOR
// a pedido do utilizador — espelha também o backend: GET
// /competencies/skill-matrix é @Roles(ADMIN, RH, GESTOR) e GET
// /competencies/dashboard/gaps é @Roles(ADMIN, RH) em
// competencies.controller.ts, nenhum inclui COLABORADOR.
export const NAV: Array<{ id: View; label: string; roles?: readonly Role[] }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-profile', label: 'O meu perfil' },
  { id: 'matrix', label: 'Matriz de Competências', roles: NON_COLABORADOR_ROLES },
  { id: 'dashboard', label: 'Dashboard RH', roles: NON_COLABORADOR_ROLES },
];

export const TITLES: Record<View, string> = {
  catalog: 'Catálogo de Competências',
  'my-profile': 'O meu Perfil de Competências',
  matrix: 'Matriz de Competências',
  dashboard: 'Dashboard de Competências',
};
