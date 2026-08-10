// components/micro-learning/constants.ts
// Mapas de badges/labels e navegação do módulo de micro-learning.
// Extraído de app/(platform)/micro-learning/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ContentLevel, ContentType, Nav, TabKey } from './types';

export const TYPE_CFG: Record<
  ContentType,
  { label: string; icon: string; cls: string }
> = {
  VIDEO: { label: 'Vídeo', icon: '▶️', cls: 'bg-red-50 text-red-700' },
  TEXT: { label: 'Leitura', icon: '📄', cls: 'bg-blue-50 text-blue-700' },
  AUDIO: { label: 'Áudio', icon: '🎧', cls: 'bg-purple-50 text-purple-700' },
  INFOGRAPHIC: {
    label: 'Infográfico',
    icon: '📊',
    cls: 'bg-amber-50 text-amber-700',
  },
  QUIZ: { label: 'Quiz', icon: '❓', cls: 'bg-emerald-50 text-emerald-700' },
};

export const LEVEL_CFG: StatusBadgeMap<ContentLevel> = {
  BEGINNER: { label: 'Básico', cls: 'bg-emerald-100 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio', cls: 'bg-amber-100 text-amber-700' },
  ADVANCED: { label: 'Avançado', cls: 'bg-red-100 text-red-700' },
};

export const NAV: Array<{ id: TabKey; label: string }> = [
  { id: 'feed', label: '⚡ Feed' },
  { id: 'saved', label: '🔖 Guardados' },
  { id: 'dashboard', label: '📊 O meu progresso' },
];

export const TITLES: Record<Nav['view'], string> = {
  feed: 'Micro-Learning',
  player: 'A aprender',
  saved: 'Guardados',
  dashboard: 'O meu progresso',
};
