// components/career/succession/constants.ts
// Rótulos PT-PT para os enums do separador "Sucessão" — mesmo padrão de
// components/career/constants.ts (tokens semânticos da fundação de design).

import type { BadgeProps } from '@/components/ui/Badge';
import type { BusinessImpact, ReadinessLevel, ReplacementTime, RiskLevel } from './types';

// Módulo Career, secção 7, acrescento 1: "Nível de prontidão" — Pronto
// agora, pronto em <1 ano, 1-2 anos, 2-3 anos, desenvolvimento de longo
// prazo. Mapeia directamente o enum Prisma ReadinessLevel (5 valores).
export const READINESS_LABEL: Record<ReadinessLevel, string> = {
  READY_NOW: 'Pronto agora',
  READY_SOON: 'Pronto em <1 ano',
  READY_1_2_YEARS: 'Pronto em 1–2 anos',
  READY_2_3_YEARS: 'Pronto em 2–3 anos',
  NEEDS_DEVELOPMENT: 'Desenvolvimento de longo prazo',
};

// Módulo Career, secção 7, acrescento 2: "Risco de sucessão" — Baixo,
// médio, alto, calculado (computeExitRisk), nunca atribuído manualmente
// como CRITICAL pelo motor automático.
export const RISK_INTENT: Record<RiskLevel, NonNullable<BadgeProps['intent']>> = {
  LOW: 'success',
  MEDIUM: 'warning',
  HIGH: 'danger',
  CRITICAL: 'danger',
};

export const RISK_LABEL: Record<RiskLevel, string> = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
};

export const BUSINESS_IMPACT_LABEL: Record<BusinessImpact, string> = {
  LOW: 'Baixo',
  MEDIUM: 'Médio',
  HIGH: 'Alto',
  CRITICAL: 'Crítico',
};

export const REPLACEMENT_TIME_LABEL: Record<ReplacementTime, string> = {
  IMMEDIATE: 'Imediato',
  SHORT_TERM: 'Curto prazo',
  MEDIUM_TERM: 'Médio prazo',
  LONG_TERM: 'Longo prazo',
};

export const READINESS_OPTIONS = (Object.keys(READINESS_LABEL) as ReadinessLevel[]).map((v) => ({
  value: v,
  label: READINESS_LABEL[v],
}));

export const BUSINESS_IMPACT_OPTIONS = (Object.keys(BUSINESS_IMPACT_LABEL) as BusinessImpact[]).map(
  (v) => ({ value: v, label: BUSINESS_IMPACT_LABEL[v] }),
);

export const REPLACEMENT_TIME_OPTIONS = (
  Object.keys(REPLACEMENT_TIME_LABEL) as ReplacementTime[]
).map((v) => ({ value: v, label: REPLACEMENT_TIME_LABEL[v] }));

export const COVERAGE_LABEL: Record<string, string> = {
  CRITICAL: 'Sem sucessor',
  AT_RISK: 'Cobertura parcial',
  COVERED: 'Coberto',
  UNKNOWN: '—',
};
