// components/learning-paths/constants.ts
// Mapas de badges e navegação do módulo. Extraído de
// app/(platform)/learning-paths/page.tsx. Migrado para a fundação de
// design: classes de paleta crua trocadas por tokens semânticos;
// LP_TYPE_MAP adicionado para substituir o TypeBadge local de atoms.tsx
// por StatusBadge da fundação.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { LPLevel, LPStatus, LPType, View } from './types';

export const LP_STATUS_MAP: StatusBadgeMap<LPStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
};

export const LP_LEVEL_MAP: StatusBadgeMap<LPLevel> = {
  BEGINNER: { label: 'Básico', cls: 'bg-success-subtle text-success-ink' },
  INTERMEDIATE: {
    label: 'Intermédio',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ADVANCED: { label: 'Avançado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const LP_TYPE_MAP: StatusBadgeMap<LPType> = {
  ONBOARDING: { label: 'Integração de Colaboradores', cls: 'bg-info-subtle text-info-ink' },
  UPSKILLING: { label: 'Desenvolvimento de Competências', cls: 'bg-info-subtle text-info-ink' },
  RESKILLING: { label: 'Reconversão de Competências', cls: 'bg-info-subtle text-info-ink' },
  COMPLIANCE: { label: 'Compliance', cls: 'bg-info-subtle text-info-ink' },
  LEADERSHIP: { label: 'Liderança', cls: 'bg-info-subtle text-info-ink' },
  CERTIFICATION: {
    label: 'Certificação',
    cls: 'bg-info-subtle text-info-ink',
  },
  CUSTOM: { label: 'Personalizado', cls: 'bg-info-subtle text-info-ink' },
};

// Subconjunto usado no filtro de tipo do catálogo — mesmas opções do
// <select> original (RESKILLING/CUSTOM nunca foram opções de filtro).
export const PATH_TYPE_FILTER_KEYS: LPType[] = [
  'ONBOARDING',
  'UPSKILLING',
  'COMPLIANCE',
  'LEADERSHIP',
  'CERTIFICATION',
];

export const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-paths', label: 'As minhas trilhas' },
  { id: 'dashboard', label: 'Dashboard (Admin)' },
];

export const TITLES: Record<View, string> = {
  catalog: 'Trilhas de Aprendizagem',
  detail: 'Detalhe da Trilha',
  'my-paths': 'As minhas trilhas',
  dashboard: 'Painel de Percursos de Aprendizagem',
};
