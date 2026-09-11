// components/departments/constants.ts
// Navegação e títulos por separador. Extraído de
// app/(platform)/departments/page.tsx (o `titles` original vivia como
// const local dentro do componente principal; hoisted para módulo,
// mesmo padrão de NAV/TITLES usado nos restantes módulos deste tipo).

import type { View } from './types';

// `mgmtOnly` — só entra na navegação renderida para papéis ADMIN/RH/GESTOR
// (ver app/(platform)/departments/page.tsx). Espelha o
// @Roles(ADMIN, RH, GESTOR) de GET /departments/dashboard/comparative em
// departments.controller.ts — mesmo padrão de `adminOnly` em
// components/courses/constants.ts.
export const NAV: Array<{
  id: Exclude<View, 'detail'>;
  label: string;
  mgmtOnly?: boolean;
}> = [
  { id: 'list', label: 'Lista' },
  { id: 'tree', label: 'Organograma' },
  { id: 'dashboard', label: 'Dashboard', mgmtOnly: true },
];

export const TITLES: Record<View, string> = {
  list: 'Departamentos',
  tree: 'Organograma',
  detail: 'Detalhe do Departamento',
  dashboard: 'Dashboard Organizacional',
};
