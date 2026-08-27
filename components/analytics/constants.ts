// components/analytics/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/analytics/page.tsx.

import type { View } from './types';

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'overview', label: 'Visão geral' },
  { id: 'my', label: 'O Meu Progresso' },
  { id: 'manager', label: 'Equipa' },
  { id: 'hr', label: 'RH' },
  { id: 'risks', label: 'Riscos' },
];

export const TITLES: Record<View, string> = {
  overview: 'Análise de Dados',
  my: 'O Meu Dashboard',
  manager: 'Dashboard Gestor',
  hr: 'Dashboard RH',
  risks: 'Alertas de Risco',
};
