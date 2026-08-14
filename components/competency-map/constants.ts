// components/competency-map/constants.ts
// Mapas de tipo/prontidão/prioridade do mapa de competências. Extraído
// de app/(platform)/competency-map/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { GapPriority, ReadinessLevel, SkillType } from './types';

// 5 categorias de skill sem correspondência semântica directa (não são
// estado/decoração) — usam os 6 tokens de intent disponíveis como paleta
// categórica estável, um por tipo.
export const TYPE_CONFIG: Record<
  SkillType,
  { label: string; color: string; bg: string }
> = {
  TECHNICAL: { label: 'Técnicas', color: 'text-info-ink', bg: 'bg-info-subtle' },
  BEHAVIORAL: {
    label: 'Comportamentais',
    color: 'text-primary',
    bg: 'bg-primary-subtle',
  },
  LEADERSHIP: {
    label: 'Liderança',
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle',
  },
  LANGUAGE: { label: 'Idiomas', color: 'text-accent', bg: 'bg-accent-subtle' },
  CERTIFICATION: {
    label: 'Certificações',
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
  },
};

export type ReadinessIntent = 'success' | 'warning' | 'danger';

export const READINESS_CONFIG: Record<
  ReadinessLevel,
  { label: string; intent: ReadinessIntent; emoji: string }
> = {
  READY: { label: 'Pronto', intent: 'success', emoji: '🟢' },
  DEVELOPING: { label: 'Em Desenvolvimento', intent: 'warning', emoji: '🟡' },
  STARTING: { label: 'Início', intent: 'danger', emoji: '🔴' },
};

// Classes derivadas do intent de READINESS_CONFIG — usadas pelo painel de
// prontidão em GapTab/MySkillsTab (texto/emblema colorido comunica o
// sentido; a barra de progresso em si fica mono via ProgressBar, ver
// constraint "ProgressBar é mono-cor" do plano de rollout).
export const READINESS_INTENT_CLASSES: Record<
  ReadinessIntent,
  { text: string; panel: string }
> = {
  success: { text: 'text-success-ink', panel: 'border-success bg-success-subtle' },
  warning: { text: 'text-warning-ink', panel: 'border-warning bg-warning-subtle' },
  danger: { text: 'text-danger-ink', panel: 'border-danger bg-danger-subtle' },
};

export const PRIORITY_CONFIG: StatusBadgeMap<GapPriority> = {
  HIGH: { label: 'Alta', cls: 'bg-danger-subtle text-danger-ink' },
  MEDIUM: { label: 'Média', cls: 'bg-warning-subtle text-warning-ink' },
  LOW: { label: 'Baixa', cls: 'bg-surface-sunken text-ink-muted' },
};
