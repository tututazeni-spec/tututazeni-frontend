// components/history/constants.ts
// Configuração visual de categorias e navegação de tabs do módulo
// de histórico. Extraído de app/(platform)/history/page.tsx.
//
// CATEGORY_COLOR migrado para os tokens semânticos da fundação de design
// (Fase A) — 8 categorias de domínio para 6 tokens semânticos + neutral,
// por isso ATTENDANCE/FINANCIAL (ambas verdes no original: teal/emerald)
// partilham 'success', mesmo padrão de reaproveitamento usado em
// components/automation/constants.ts (CATEGORY_INTENT).

import { Activity, Award, Clock, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Tab } from './types';

export const CATEGORY_COLOR: Record<
  string,
  { color: string; bg: string; fill: string }
> = {
  LEARNING: { color: 'text-info-ink', bg: 'bg-info-subtle', fill: 'bg-info' },
  PERFORMANCE: {
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle',
    fill: 'bg-warning',
  },
  CAREER: {
    color: 'text-primary',
    bg: 'bg-primary-subtle',
    fill: 'bg-primary',
  },
  ENGAGEMENT: {
    color: 'text-accent',
    bg: 'bg-accent-subtle',
    fill: 'bg-accent',
  },
  SYSTEM: {
    color: 'text-ink-muted',
    bg: 'bg-surface-sunken',
    fill: 'bg-ink-faint',
  },
  COMPLIANCE: {
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle',
    fill: 'bg-danger',
  },
  ATTENDANCE: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
  FINANCIAL: {
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    fill: 'bg-success',
  },
};

export const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'milestones', label: 'Marcos', icon: Award },
  { id: 'stats', label: 'Actividade', icon: Activity },
  { id: 'audit', label: 'Auditoria', icon: Shield },
];
