// components/competency-map/constants.ts
// Mapas de tipo/prontidão/prioridade do mapa de competências. Extraído
// de app/(platform)/competency-map/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { GapPriority, ReadinessLevel, SkillType } from './types';

export const TYPE_CONFIG: Record<
  SkillType,
  { label: string; color: string; bg: string }
> = {
  TECHNICAL: { label: 'Técnicas', color: 'text-blue-700', bg: 'bg-blue-50' },
  BEHAVIORAL: {
    label: 'Comportamentais',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
  },
  LEADERSHIP: {
    label: 'Liderança',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
  },
  LANGUAGE: { label: 'Idiomas', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  CERTIFICATION: {
    label: 'Certificações',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
};

export const READINESS_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; bar: string; emoji: string }
> = {
  READY: {
    label: 'Pronto',
    color: 'text-emerald-700',
    bar: 'bg-emerald-500',
    emoji: '🟢',
  },
  DEVELOPING: {
    label: 'Em Desenvolvimento',
    color: 'text-amber-700',
    bar: 'bg-amber-500',
    emoji: '🟡',
  },
  STARTING: {
    label: 'Início',
    color: 'text-red-700',
    bar: 'bg-red-400',
    emoji: '🔴',
  },
};

export const PRIORITY_CONFIG: StatusBadgeMap<GapPriority> = {
  HIGH: { label: 'Alta', cls: 'bg-red-100 text-red-700' },
  MEDIUM: { label: 'Média', cls: 'bg-amber-100 text-amber-700' },
  LOW: { label: 'Baixa', cls: 'bg-gray-100 text-gray-600' },
};
