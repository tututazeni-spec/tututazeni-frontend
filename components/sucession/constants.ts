// components/sucession/constants.ts
// Mapas de badges/labels e navegação do módulo de sucessão. Extraído
// de app/(platform)/sucession/page.tsx.
//
// Cores mapeadas para os tokens semânticos da fundação de design (Fase
// A). READINESS_CFG ganhou `textCls` como campo próprio em vez de
// fatiar `cls` com `.split(' ')[1]` para extrair só a cor do texto
// (mesma correcção aplicada a GRADE_COLOR no piloto engagement — ver
// components/engagement/constants.ts).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { CoverageStatus, ReadinessLevel, RiskLevel, View } from './types';

export const READINESS_CFG: Record<
  ReadinessLevel,
  { label: string; cls: string; textCls: string }
> = {
  READY_NOW: {
    label: 'Pronto agora',
    cls: 'bg-success-subtle text-success-ink',
    textCls: 'text-success-ink',
  },
  READY_SOON: {
    label: 'Pronto em breve',
    cls: 'bg-warning-subtle text-warning-ink',
    textCls: 'text-warning-ink',
  },
  NEEDS_DEVELOPMENT: {
    label: 'Em desenvolvimento',
    cls: 'bg-info-subtle text-info-ink',
    textCls: 'text-info-ink',
  },
};

export const RISK_CFG: StatusBadgeMap<RiskLevel> = {
  LOW: { label: 'Baixo', cls: 'bg-success-subtle text-success-ink' },
  MEDIUM: { label: 'Médio', cls: 'bg-warning-subtle text-warning-ink' },
  HIGH: { label: 'Alto', cls: 'bg-danger-subtle text-danger-ink' },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger text-canvas' },
};

export const COVERAGE_CFG: StatusBadgeMap<CoverageStatus> = {
  COVERED: { label: 'Coberto', cls: 'bg-success-subtle text-success-ink' },
  AT_RISK: { label: 'Em risco', cls: 'bg-warning-subtle text-warning-ink' },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger-subtle text-danger-ink' },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'org-chart', label: 'Mapa de Sucessão' },
  { id: 'positions', label: 'Cargos Críticos' },
  { id: 'talent-pool', label: 'Talent Pool' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'Dashboard de Sucessão',
  'org-chart': 'Mapa de Sucessão',
  positions: 'Cargos Críticos e Pipeline',
  'talent-pool': 'Talent Pool',
};
