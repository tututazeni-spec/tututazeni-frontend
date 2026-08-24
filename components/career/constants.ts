// components/career/constants.ts
// Mapas de badges e navegação do módulo de carreira. Cores mapeadas para
// os tokens semânticos da fundação de design (Fase A) — os tipos de vaga
// (PROMOTION/LATERAL/...) são categorias decorativas, não estados, por
// isso repetem tokens onde não há uma correspondência 1:1. Extraído de
// app/(platform)/career/page.tsx.

import type { BadgeProps } from '@/components/ui/Badge';
import type { View } from './types';

export const VACANCY_TYPE: Record<
  string,
  { label: string; icon: string; intent: NonNullable<BadgeProps['intent']> }
> = {
  PROMOTION: { label: 'Promoção', intent: 'success' },
  LATERAL: { label: 'Lateral', intent: 'info' },
  GIG_PROJECT: { label: 'Projecto Temporário', intent: 'warning' },
  JOB_ROTATION: { label: 'Rotação de Funções', intent: 'neutral' },
  SHADOWING: { label: 'Acompanhamento Profissional', intent: 'neutral' },
};

export const CAREER_PATH_TYPE: Record<string, string> = {
  LINEAR: 'Linear',
  Y_SHAPED: 'Y-shaped',
  T_SHAPED: 'T-shaped',
  W_SHAPED: 'W-shaped',
  LATTICE: 'Lattice',
};

// 'cls' deixou de existir aqui — no ficheiro original só `.label` era
// consumido (DashboardView), a cor nunca chegava a ser lida por ninguém.
export const READINESS_CFG: Record<string, { label: string }> = {
  READY_NOW: { label: 'Pronto agora' },
  READY_12M: { label: 'Pronto em 12m' },
  READY_24M: { label: 'Pronto em 24m' },
  NOT_READY: { label: 'Não pronto' },
};

export const NAV = [
  { id: 'dashboard', label: '🗺️ Minha Carreira' },
  { id: 'paths', label: ' Trilhas' },
  { id: 'vacancies', label: ' Vagas Internas' },
  { id: 'plan', label: ' Meu Plano' },
] as const;

export const TITLES: Record<View, string> = {
  dashboard: 'Gestão de Carreira',
  paths: 'Trilhas de Carreira',
  vacancies: 'Vagas Internas',
  plan: 'Plano de Carreira',
  succession: 'Planeamento de Sucessão',
};
