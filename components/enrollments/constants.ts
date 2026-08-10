// components/enrollments/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/enrollments/page.tsx.

import type { View } from './types';

export const NAV: Array<{ id: View; label: string }> = [
  { id: 'my', label: 'As minhas matrículas' },
  { id: 'admin', label: 'Gestão (Admin)' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'team', label: 'Equipa' },
];

export const TITLES: Record<View, string> = {
  my: 'As minhas matrículas',
  admin: 'Gestão de Matrículas',
  compliance: 'Dashboard de Compliance',
  team: 'Progresso da Equipa',
};
