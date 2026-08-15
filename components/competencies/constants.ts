// components/competencies/constants.ts
// Labels de nível, badge de categoria e navegação do módulo. Extraído
// de app/(platform)/competencies/page.tsx. Cores mapeadas para os
// tokens semânticos da fundação de design (Fase A).

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
  HARD_SKILL: { label: 'Hard Skill', cls: 'bg-info-subtle text-info-ink' },
  SOFT_SKILL: { label: 'Soft Skill', cls: 'bg-primary-subtle text-primary' },
  LANGUAGE: { label: 'Idioma', cls: 'bg-success-subtle text-success-ink' },
  TOOL: { label: 'Ferramenta', cls: 'bg-warning-subtle text-warning-ink' },
  LEADERSHIP: { label: 'Liderança', cls: 'bg-accent-subtle text-accent' },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-profile', label: 'O meu perfil' },
  { id: 'matrix', label: 'Skill Matrix' },
  { id: 'dashboard', label: 'Dashboard RH' },
];

export const TITLES: Record<View, string> = {
  catalog: 'Catálogo de Competências',
  'my-profile': 'O meu Perfil de Competências',
  matrix: 'Skill Matrix',
  dashboard: 'Dashboard de Competências',
};
