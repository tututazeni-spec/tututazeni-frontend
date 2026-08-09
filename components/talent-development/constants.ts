// components/talent-development/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo. Extraído verbatim de app/(platform)/talent-development/page.tsx.

import type { Tier } from './types';

export const TIER_COLOR: Record<Tier, string> = {
  HIGH: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  DEVELOPING: 'bg-slate-100 text-slate-600',
};

export const TIER_LABEL: Record<Tier, string> = {
  HIGH: 'Alto Potencial',
  MEDIUM: 'Médio',
  DEVELOPING: 'Em Desenvolvimento',
};

export const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-blue-100 text-blue-700',
  PAUSED: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export const PRIORITY_COLOR: Record<string, string> = {
  LOW: 'text-slate-400',
  MEDIUM: 'text-amber-500',
  HIGH: 'text-orange-500',
  CRITICAL: 'text-red-600',
};
