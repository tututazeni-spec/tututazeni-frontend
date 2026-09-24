// components/competencies/constants.ts
// Labels de nível, badge de categoria e navegação do módulo. Extraído
// de app/(platform)/competencies/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A).

import { NON_COLABORADOR_ROLES, type Role } from '@/lib/roles';
import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { CompetencyCategory, CompetencyStatus, View } from './types';

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
  FUNCTIONAL: { label: 'Competências Funcionais', cls: 'bg-danger-subtle text-danger-ink' },
};

// docs/módulo_competencies.md §2 — "Estado" da competência. Usado no
// catálogo (badge) e no formulário. ACTIVE/INACTIVE já tinham rotulagem ad
// hoc inline em CatalogView.tsx; IN_REVIEW é novo (Fase 1).
export const STATUS_CFG: StatusBadgeMap<CompetencyStatus> = {
  ACTIVE: { label: 'Activa', cls: 'bg-success-subtle text-success-ink' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  INACTIVE: { label: 'Arquivada', cls: 'bg-surface-sunken text-ink-muted' },
};

// "Matriz de Competências" e "Dashboard RH" ficam escondidas de COLABORADOR
// a pedido do utilizador — espelha também o backend: GET
// /competencies/skill-matrix é @Roles(ADMIN, RH, GESTOR) e GET
// /competencies/dashboard/gaps é @Roles(ADMIN, RH) em
// competencies.controller.ts, nenhum inclui COLABORADOR.
// "Mapa de Competências" junta aqui o ex-módulo CompetencyMapModule
// (heatmap, matriz por cargo, gap organizacional) sem fundir dados —
// continua a bater no seu próprio controller /competency-map. Ver
// components/competency-map/CompetencyMapView.tsx. Sem restrição de
// roles, tal como a entrada de sidebar standalone que substitui — a
// visibilidade fina dos seus separadores internos já é feita dentro do
// próprio CompetencyMapView.
// "Visão Geral" (docs/módulo_competencies.md §1) é a nova primeira aba —
// KPIs organizacionais, mesma restrição de roles de "Dashboard RH" (o
// endpoint GET /competencies/overview é @Roles(ADMIN, RH, GESTOR)).
export const NAV: Array<{ id: View; label: string; roles?: readonly Role[] }> = [
  { id: 'overview', label: 'Visão Geral', roles: NON_COLABORADOR_ROLES },
  { id: 'catalog', label: 'Competências' },
  { id: 'my-profile', label: 'O meu perfil' },
  { id: 'matrix', label: 'Matriz de Competências', roles: NON_COLABORADOR_ROLES },
  { id: 'dashboard', label: 'Dashboard RH', roles: NON_COLABORADOR_ROLES },
  { id: 'competency-map', label: 'Mapa de Competências' },
];

export const TITLES: Record<View, string> = {
  overview: 'Visão Geral de Competências',
  catalog: 'Competências',
  'my-profile': 'O meu Perfil de Competências',
  matrix: 'Matriz de Competências',
  dashboard: 'Dashboard de Competências',
  'competency-map': 'Mapa de Competências',
};
