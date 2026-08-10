// components/competencies/constants.ts
// Labels de nível, badge de categoria e navegação do módulo. Extraído
// de app/(platform)/competencies/page.tsx.

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
  HARD_SKILL: { label: 'Hard Skill', cls: 'bg-blue-50 text-blue-700' },
  SOFT_SKILL: { label: 'Soft Skill', cls: 'bg-purple-50 text-purple-700' },
  LANGUAGE: { label: 'Idioma', cls: 'bg-emerald-50 text-emerald-700' },
  TOOL: { label: 'Ferramenta', cls: 'bg-amber-50 text-amber-700' },
  LEADERSHIP: { label: 'Liderança', cls: 'bg-red-50 text-red-700' },
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
