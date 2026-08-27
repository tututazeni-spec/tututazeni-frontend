// components/organization/constants.ts
// Mapas de badges/labels e navegação do módulo de estrutura
// organizacional. Extraído de app/(platform)/organization/page.tsx.
//
// LEVEL_CFG: 8 níveis de cargo sem correspondência semântica directa —
// cor de nível/profundidade tratada como decorativa (ver nota "cores de
// nível/profundidade" do plano de rollout), usa os 6 tokens de intent
// disponíveis como paleta categórica estável, repetindo nos extremos
// (INTERN fica neutro; DIRECTOR/EXECUTIVE partilham danger).
// CHANGE_CFG: 6 tipos de movimentação com correspondência 1:1 aos 6 tokens
// de intent (positivo=success/accent, neutro=info/primary, negativo=danger,
// atenção=warning).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ChangeType, PosLevel, View } from './types';

export const LEVEL_CFG: StatusBadgeMap<PosLevel> = {
  INTERN: { label: 'Estagiário', cls: 'bg-surface-sunken text-ink-muted' },
  JUNIOR: { label: 'Júnior', cls: 'bg-success-subtle text-success-ink' },
  MID: { label: 'Pleno', cls: 'bg-info-subtle text-info-ink' },
  SENIOR: { label: 'Sénior', cls: 'bg-primary-subtle text-primary' },
  LEAD: { label: 'Lead', cls: 'bg-accent-subtle text-accent' },
  MANAGER: { label: 'Gestor', cls: 'bg-warning-subtle text-warning-ink' },
  DIRECTOR: { label: 'Director', cls: 'bg-danger-subtle text-danger-ink' },
  EXECUTIVE: { label: 'Executivo', cls: 'bg-danger-subtle text-danger-ink' },
};

export const CHANGE_CFG: Record<
  ChangeType,
  { label: string; cls: string; icon: string }
> = {
  PROMOTION: {
    label: 'Promoção',
    cls: 'bg-success-subtle text-success-ink',
    icon: '⬆️',
  },
  TRANSFER: {
    label: 'Transferência',
    cls: 'bg-info-subtle text-info-ink',
    icon: '↔️',
  },
  RESTRUCTURE: {
    label: 'Reestruturação',
    cls: 'bg-primary-subtle text-primary',
    icon: '🔄',
  },
  HIRE: {
    label: 'Admissão',
    cls: 'bg-accent-subtle text-accent',
    icon: '🆕',
  },
  TERMINATION: {
    label: 'Desligamento',
    cls: 'bg-danger-subtle text-danger-ink',
    icon: '🔴',
  },
  MANAGER_CHANGE: {
    label: 'Mudança gestor',
    cls: 'bg-warning-subtle text-warning-ink',
    icon: '👤',
  },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chart', label: 'Organograma' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'positions', label: 'Cargos' },
  { id: 'timeline', label: 'Linha Cronológica' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'Estrutura Organizacional',
  chart: 'Organograma',
  departments: 'Departamentos',
  positions: 'Cargos e Posições',
  timeline: 'Linha Cronológia Organizacional',
};
