// components/leadership/constants.ts
// Mapas de badges e labels do módulo de liderança. Extraído de
// app/(platform)/leadership/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { Competency, HealthStatus, ProgramLevel, View } from './types';

export const LEVEL_CFG: StatusBadgeMap<ProgramLevel> = {
  INITIAL: { label: 'Inicial', cls: 'bg-emerald-50 text-emerald-700' },
  INTERMEDIATE: { label: 'Intermédio', cls: 'bg-amber-50 text-amber-700' },
  ADVANCED: { label: 'Avançado', cls: 'bg-red-50 text-red-700' },
};

export const HEALTH_CFG: Record<
  HealthStatus,
  { label: string; dot: string; cls: string }
> = {
  GREEN: { label: 'Bom', dot: 'bg-emerald-500', cls: 'text-emerald-700' },
  YELLOW: { label: 'Atenção', dot: 'bg-amber-500', cls: 'text-amber-700' },
  RED: { label: 'Crítico', dot: 'bg-red-500', cls: 'text-red-700' },
};

export const CLASS_CFG: StatusBadgeMap<string> = {
  TOP_10: { label: '🏆 Top 10%', cls: 'bg-amber-100 text-amber-800' },
  ABOVE_AVERAGE: {
    label: '⬆ Acima da média',
    cls: 'bg-emerald-50 text-emerald-700',
  },
  AVERAGE: { label: '= Médio', cls: 'bg-gray-100 text-gray-600' },
  BELOW_AVERAGE: { label: '⬇ Abaixo', cls: 'bg-orange-50 text-orange-700' },
  CRITICAL: { label: '🔴 Crítico', cls: 'bg-red-100 text-red-800' },
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
  { id: 'ranking', label: 'Ranking' },
  { id: 'kudos', label: 'Kudos' },
];

export const TITLES: Record<View, string> = {
  'my-dashboard': 'Dashboard do Líder',
  team: 'A minha Equipa',
  programs: 'Programas de Liderança',
  feedback360: 'Feedback 360° de Liderança',
  ranking: 'Leadership Scorecard',
  kudos: 'Mural de Reconhecimento',
};
