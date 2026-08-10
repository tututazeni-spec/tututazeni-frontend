// components/organization/constants.ts
// Mapas de badges/labels e navegação do módulo de estrutura
// organizacional. Extraído de app/(platform)/organization/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ChangeType, PosLevel, View } from './types';

export const LEVEL_CFG: StatusBadgeMap<PosLevel> = {
  INTERN: { label: 'Estagiário', cls: 'bg-gray-100 text-gray-600' },
  JUNIOR: { label: 'Júnior', cls: 'bg-emerald-50 text-emerald-700' },
  MID: { label: 'Pleno', cls: 'bg-blue-50 text-blue-700' },
  SENIOR: { label: 'Sénior', cls: 'bg-purple-50 text-purple-700' },
  LEAD: { label: 'Lead', cls: 'bg-amber-50 text-amber-700' },
  MANAGER: { label: 'Gestor', cls: 'bg-orange-50 text-orange-700' },
  DIRECTOR: { label: 'Director', cls: 'bg-red-50 text-red-700' },
  EXECUTIVE: { label: 'Executivo', cls: 'bg-red-100 text-red-800' },
};

export const CHANGE_CFG: Record<
  ChangeType,
  { label: string; cls: string; icon: string }
> = {
  PROMOTION: {
    label: 'Promoção',
    cls: 'bg-emerald-50 text-emerald-700',
    icon: '⬆️',
  },
  TRANSFER: {
    label: 'Transferência',
    cls: 'bg-blue-50 text-blue-700',
    icon: '↔️',
  },
  RESTRUCTURE: {
    label: 'Reestruturação',
    cls: 'bg-purple-50 text-purple-700',
    icon: '🔄',
  },
  HIRE: { label: 'Admissão', cls: 'bg-amber-50 text-amber-700', icon: '🆕' },
  TERMINATION: {
    label: 'Desligamento',
    cls: 'bg-red-50 text-red-700',
    icon: '🔴',
  },
  MANAGER_CHANGE: {
    label: 'Mudança gestor',
    cls: 'bg-orange-50 text-orange-700',
    icon: '👤',
  },
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'chart', label: 'Organograma' },
  { id: 'departments', label: 'Departamentos' },
  { id: 'positions', label: 'Cargos' },
  { id: 'timeline', label: 'Timeline' },
];

export const TITLES: Record<View, string> = {
  dashboard: 'Estrutura Organizacional',
  chart: 'Organograma',
  departments: 'Departamentos',
  positions: 'Cargos e Posições',
  timeline: 'Timeline Organizacional',
};
