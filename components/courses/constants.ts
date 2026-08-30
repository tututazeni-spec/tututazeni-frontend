// components/courses/constants.ts
// Navegação e títulos do módulo de cursos. Extraído de
// app/(platform)/courses/page.tsx.

import type { TopLevelView, View } from './types';

// `adminOnly` — só entra na navegação renderida para papéis ADMIN/RH
// (ver app/(platform)/courses/page.tsx). Espelha o @Roles(ADMIN, RH) dos
// endpoints correspondentes em courses.controller.ts.
export const NAV: Array<{
  id: TopLevelView;
  label: string;
  adminOnly?: boolean;
}> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-courses', label: 'Os meus cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'dashboard', label: 'Dashboard (Admin)', adminOnly: true },
  { id: 'gestao', label: 'Gestão', adminOnly: true },
];

export const TITLES: Record<View, string> = {
  catalog: 'Catálogo de Cursos',
  detail: 'Curso',
  'my-courses': 'Os meus cursos',
  certificates: 'Os meus certificados',
  dashboard: 'Dashboard de Formação',
  gestao: 'Gestão de Cursos',
};
