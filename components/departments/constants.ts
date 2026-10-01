// components/departments/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/departments/page.tsx (o `titles` original vivia como
// const local dentro do componente principal; hoisted para módulo,
// mesmo padrão de NAV/TITLES usado nos restantes módulos deste tipo).

import type { View } from './types';

export const NAV: Array<{ id: Exclude<View, 'detail'>; label: string }> = [
  { id: 'list', label: 'Lista' },
  { id: 'structure', label: 'Estrutura Organizacional' },
  { id: 'tree', label: 'Organograma' },
  { id: 'heads', label: 'Responsáveis' },
  { id: 'dashboard', label: 'Dashboard' },
];

export const TITLES: Record<View, string> = {
  list: 'Departamentos',
  structure: 'Estrutura Organizacional',
  tree: 'Organograma',
  heads: 'Responsáveis',
  detail: 'Detalhe do Departamento',
  dashboard: 'Dashboard Organizacional',
};
