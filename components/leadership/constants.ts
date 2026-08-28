// components/leadership/constants.ts
// Mapas de badges e labels do módulo de liderança. Extraído de
// app/(platform)/leadership/page.tsx.
//
// Cores mapeadas para os tokens semânticos da fundação de design (Fase
// A) — mesmo padrão de components/sucession/constants.ts. CLASS_CFG usa
// variantes sólidas (bg-warning/bg-danger + text-canvas) para os
// extremos (TOP_10, CRITICAL) e subtle para os intermédios, preservando
// a gradação de intensidade que a paleta crua original comunicava.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Competency, HealthStatus, ProgramLevel, View } from './types';

export const LEVEL_CFG: StatusBadgeMap<ProgramLevel> = {
  INITIAL: { label: 'Inicial', cls: 'bg-success-subtle text-success-ink' },
  INTERMEDIATE: {
    label: 'Intermédio',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  ADVANCED: { label: 'Avançado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const HEALTH_CFG: Record<
  HealthStatus,
  { label: string; dot: string; cls: string }
> = {
  GREEN: { label: 'Bom', dot: 'bg-success', cls: 'text-success-ink' },
  YELLOW: { label: 'Atenção', dot: 'bg-warning', cls: 'text-warning-ink' },
  RED: { label: 'Crítico', dot: 'bg-danger', cls: 'text-danger-ink' },
};

export const CLASS_CFG: StatusBadgeMap<string> = {
  TOP_10: { label: 'Top 10%', cls: 'bg-warning text-canvas' },
  ABOVE_AVERAGE: {
    label: 'Acima da média',
    cls: 'bg-success-subtle text-success-ink',
  },
  AVERAGE: { label: '= Médio', cls: 'bg-surface-sunken text-ink-muted' },
  BELOW_AVERAGE: {
    label: 'Abaixo',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  CRITICAL: { label: 'Crítico', cls: 'bg-danger text-canvas' },
};

export const COMP_LABELS: Record<Competency, string> = {
  COMMUNICATION: 'Comunicação',
  DEVELOPMENT: 'Desenvolvimento',
  RECOGNITION: 'Reconhecimento',
  AUTONOMY: 'Autonomia',
  FAIRNESS: 'Equidade',
  EXAMPLE: 'Exemplo',
  STRATEGY: 'Estratégia',
  RESILIENCE: 'Resiliência',
};

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'my-dashboard', label: 'O meu painel' },
  { id: 'team', label: 'A minha equipa' },
  { id: 'programs', label: 'Programas' },
  { id: 'feedback360', label: 'Feedback 360°' },
  { id: 'ranking', label: 'Classificação' },
  { id: 'kudos', label: 'Reconhecimento' },
];

export const TITLES: Record<View, string> = {
  'my-dashboard': 'Desenvolvimento de Liderança',
  team: 'A minha Equipa',
  programs: 'Programas de Liderança',
  feedback360: 'Feedback 360° de Liderança',
  ranking: 'Quadro de Indicadores de Liderança',
  kudos: 'Mural de Reconhecimento',
};
