// components/micro-learning/constants.ts
// Mapas de badges/labels e navegação do módulo de micro-learning. Cores
// mapeadas para os tokens semânticos da fundação de design (Fase A) —
// sem correspondência directa "1 cor decorativa = 1 tipo de conteúdo",
// cada ContentType recebe um token distinto (danger/info/primary/warning/
// success) só para manter a distinção visual entre os 5 tipos.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ContentLevel, ContentType, Nav, TabKey } from './types';

export const TYPE_CFG: Record<
  ContentType,
  { label: string; icon: string; cls: string }
> = {
  VIDEO: { label: 'Vídeo', icon: '▶️', cls: 'bg-danger-subtle text-danger-ink' },
  TEXT: { label: 'Leitura', icon: '📄', cls: 'bg-info-subtle text-info-ink' },
  AUDIO: { label: 'Áudio', icon: '🎧', cls: 'bg-primary-subtle text-primary' },
  INFOGRAPHIC: {
    label: 'Infográfico',
    icon: '📊',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  QUIZ: { label: 'Questionário', icon: '❓', cls: 'bg-success-subtle text-success-ink' },
};

export const LEVEL_CFG: StatusBadgeMap<ContentLevel> = {
  BEGINNER: { label: 'Básico', cls: 'bg-success-subtle text-success-ink' },
  INTERMEDIATE: {
    label: 'Intermédio',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ADVANCED: { label: 'Avançado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const NAV: Array<{ id: TabKey; label: string }> = [
  { id: 'feed', label: ' Feed' },
  { id: 'saved', label: ' Guardados' },
  { id: 'dashboard', label: ' O Meu Progresso' },
];

export const TITLES: Record<Nav['view'], string> = {
  feed: 'Micro-Aprendizagem',
  player: 'A aprender',
  saved: 'Guardados',
  dashboard: 'O Meu Progresso',
};
