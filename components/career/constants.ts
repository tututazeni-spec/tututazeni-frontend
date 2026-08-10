// components/career/constants.ts
// Mapas de badges e navegação do módulo de carreira. Extraído de
// app/(platform)/career/page.tsx.

import type { View } from './types';

export const VACANCY_TYPE: Record<
  string,
  { label: string; icon: string; cls: string }
> = {
  PROMOTION: {
    label: 'Promoção',
    icon: '🚀',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  LATERAL: { label: 'Lateral', icon: '↔️', cls: 'bg-blue-50 text-blue-700' },
  GIG_PROJECT: {
    label: 'Gig Project',
    icon: '⚡',
    cls: 'bg-amber-50 text-amber-700',
  },
  JOB_ROTATION: {
    label: 'Job Rotation',
    icon: '🔄',
    cls: 'bg-purple-50 text-purple-700',
  },
  SHADOWING: {
    label: 'Shadowing',
    icon: '👁',
    cls: 'bg-gray-100 text-gray-600',
  },
};

export const CAREER_PATH_TYPE: Record<string, string> = {
  LINEAR: 'Linear',
  Y_SHAPED: 'Y-shaped',
  T_SHAPED: 'T-shaped',
  W_SHAPED: 'W-shaped',
  LATTICE: 'Lattice',
};

export const READINESS_CFG: Record<string, { label: string; cls: string }> = {
  READY_NOW: { label: 'Pronto agora', cls: 'bg-emerald-50 text-emerald-700' },
  READY_12M: { label: 'Pronto em 12m', cls: 'bg-amber-50 text-amber-700' },
  READY_24M: { label: 'Pronto em 24m', cls: 'bg-orange-50 text-orange-700' },
  NOT_READY: { label: 'Não pronto', cls: 'bg-red-50 text-red-600' },
};

export const NAV = [
  { id: 'dashboard', label: '🗺️ Minha Carreira' },
  { id: 'paths', label: '📍 Trilhas' },
  { id: 'vacancies', label: '🔍 Vagas Internas' },
  { id: 'plan', label: '📋 Meu Plano' },
] as const;

export const TITLES: Record<View, string> = {
  dashboard: 'Dashboard de Carreira',
  paths: 'Trilhas de Carreira',
  vacancies: 'Vagas Internas',
  plan: 'Plano de Carreira',
  succession: 'Planeamento de Sucessão',
};
