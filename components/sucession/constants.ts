// components/sucession/constants.ts
// Mapas de badges/labels e navegação do módulo de sucessão. Extraído
// de app/(platform)/sucession/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { CoverageStatus, ReadinessLevel, RiskLevel, View } from './types';

export const READINESS_CFG: Record<
  ReadinessLevel,
  { label: string; cls: string; dot: string }
> = {
  READY_NOW: {
    label: 'Pronto agora',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  READY_SOON: {
    label: 'Pronto em breve',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  NEEDS_DEVELOPMENT: {
    label: 'Em desenvolvimento',
    cls: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-400',
  },
};

export const RISK_CFG: StatusBadgeMap<RiskLevel> = {
  LOW: { label: 'Baixo', cls: 'bg-emerald-50 text-emerald-700' },
  MEDIUM: { label: 'Médio', cls: 'bg-amber-50 text-amber-700' },
  HIGH: { label: 'Alto', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: 'Crítico', cls: 'bg-red-100 text-red-800' },
};

export const COVERAGE_CFG: StatusBadgeMap<CoverageStatus> = {
  COVERED: { label: 'Coberto', cls: 'bg-emerald-50 text-emerald-700' },
  AT_RISK: { label: 'Em risco', cls: 'bg-amber-50 text-amber-700' },
  CRITICAL: { label: 'Crítico', cls: 'bg-red-50 text-red-700' },
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
