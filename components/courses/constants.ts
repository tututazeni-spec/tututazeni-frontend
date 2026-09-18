// components/courses/constants.ts
// Navegação e títulos do módulo de cursos. Extraído de
// app/(platform)/courses/page.tsx.

import type { TopLevelView, View } from './types';

// `adminOnly` — só entra na navegação renderida para papéis ADMIN/RH
// (ver app/(platform)/courses/page.tsx). Espelha o @Roles(ADMIN, RH) dos
// endpoints correspondentes em courses.controller.ts.
// docs/06-modulo-courses.md secção 12: "Não criar módulos separados no menu
// principal para Cursos, Módulos e Lições. No menu apenas Cursos." — por
// isso 'modulos' (Módulos & Lições) NÃO entra aqui como separador de topo;
// continua acessível via deep link a partir de Gestão ("Gerir módulos" num
// curso — ver ModulosView initialCourseId) e TITLES abaixo continua a
// precisar da entrada para esse header.
export const NAV: Array<{
  id: TopLevelView;
  label: string;
  adminOnly?: boolean;
}> = [
  { id: 'catalog', label: 'Todos os cursos' },
  { id: 'my-courses', label: 'Meus cursos' },
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
  modulos: 'Módulos & Lições',
};
