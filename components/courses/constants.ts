// components/courses/constants.ts
// Navegação e títulos do módulo de cursos. Extraído de
// app/(platform)/courses/page.tsx.

import type { TopLevelView, View } from './types';

export const NAV: Array<{ id: TopLevelView; label: string }> = [
  { id: 'catalog', label: 'Catálogo' },
  { id: 'my-courses', label: 'Os Meus Cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'dashboard', label: 'Dashboard (Admin)' },
];

export const TITLES: Record<View, string> = {
  catalog: 'Catálogo de Cursos',
  detail: 'Curso',
  'my-courses': 'Os Meus Cursos',
  certificates: 'Os Meus Certificados',
  dashboard: 'Dashboard de Formação',
};
