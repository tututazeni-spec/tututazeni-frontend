// components/onboarding/utils.ts
// Verificação de prazo expirado + selecção do marco de pesquisa. Extraído de
// app/(platform)/onboarding/page.tsx e MyPlanView.

import { SURVEY_MILESTONES } from './constants';
import type { SurveyMilestone } from './types';

export function isOverdue(d: string | null): boolean {
  return !!d && new Date() > new Date(d);
}

/**
 * Marcos de pesquisa que o colaborador pode responder agora: já passaram
 * `day` dias desde `startDate` e ainda não foram respondidos (`answered`).
 * O backend devolve 409 para um marco repetido, daí filtrar os respondidos.
 */
export function availableSurveyMilestones(
  startDate: string,
  answered: readonly string[],
  now: number = Date.now(),
): typeof SURVEY_MILESTONES {
  const daysIn = Math.floor((now - new Date(startDate).getTime()) / 86_400_000);
  const done = new Set(answered);
  return SURVEY_MILESTONES.filter((m) => daysIn >= m.day && !done.has(m.id));
}

/**
 * Próximo marco ainda por responder cuja janela ainda não abriu — para
 * indicar ao colaborador quando volta a haver pesquisa.
 */
export function nextLockedSurveyMilestone(
  startDate: string,
  answered: readonly string[],
  now: number = Date.now(),
): (typeof SURVEY_MILESTONES)[number] | undefined {
  const daysIn = Math.floor((now - new Date(startDate).getTime()) / 86_400_000);
  const done = new Set(answered);
  return SURVEY_MILESTONES.find((m) => !done.has(m.id) && daysIn < m.day);
}

/** O marco escolhido, ou o mais recente disponível se a escolha for inválida. */
export function resolveActiveMilestone(
  available: typeof SURVEY_MILESTONES,
  choice: SurveyMilestone | '',
): SurveyMilestone | '' {
  if (choice && available.some((m) => m.id === choice)) return choice;
  return available[available.length - 1]?.id ?? '';
}
