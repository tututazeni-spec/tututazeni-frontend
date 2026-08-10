// components/learning-paths/constants.ts
// Mapas de badges e navegação do módulo. Extraído de
// app/(platform)/learning-paths/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { LPLevel, LPStatus, View } from './types';

export const LP_STATUS_MAP: StatusBadgeMap<LPStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
};

export const LP_LEVEL_MAP: StatusBadgeMap<LPLevel> = {
  BEGINNER: { label: 'Básico', cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio', cls: 'bg-amber-50 text-amber-700' },
  ADVANCED: { label: 'Avançado', cls: 'bg-red-50 text-red-700' },
};

export const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-paths', label: 'As minhas trilhas' },
  { id: 'dashboard', label: 'Dashboard (Admin)' },
];

export const TITLES: Record<View, string> = {
  catalog: 'Trilhas de Aprendizagem',
  detail: 'Detalhe da Trilha',
  'my-paths': 'As minhas trilhas',
  dashboard: 'Dashboard de Learning Paths',
};
