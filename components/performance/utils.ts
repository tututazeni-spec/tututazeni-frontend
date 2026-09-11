// components/performance/utils.ts
// Verificação de prazo expirado. Extraído de
// app/(platform)/performance/page.tsx.

import type { CycleRules } from './types';

export function isOverdue(d: string | null): boolean {
  return !!d && new Date() > new Date(d);
}

// Cycle.rules vem sempre como JSON serializado (String?) — nunca ler o campo
// bruto directamente fora daqui. Ausente/inválido degrada para {} (mesmos
// defaults do backend: tudo activo excepto allowRhEvaluation/requireAcceptance).
export function parseCycleRules(rules: string | null | undefined): CycleRules {
  if (!rules) return {};
  try {
    return JSON.parse(rules) as CycleRules;
  } catch {
    return {};
  }
}
