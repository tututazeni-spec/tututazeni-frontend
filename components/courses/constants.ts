// components/courses/constants.ts
// Navegação e títulos do módulo de cursos. Extraído de
// app/(platform)/courses/page.tsx.
//
// docs/modulo_courses.md secção 0 ("Abas principais") pede: Visão Geral,
// Cursos, Categorias, Conteúdos, Avaliações, Inscrições, Progresso, Turmas,
// Certificados, Relatórios, Configurações. Sessão anterior implementou até à
// secção 4 (Progresso); esta sessão acrescenta 5 (Turmas), 6 (Categorias) e
// 7 (Relatórios). Conteúdos/Avaliações/Configurações continuam de fora —
// não criadas como abas vazias (ver CLAUDE.md "sem implementações a meio").
// O separador "Cursos" funde o antigo "Todos os cursos" (catálogo, todos) e
// "Gestão" (tabela admin) — mesmo `id` ('catalog'), a página escolhe o
// componente por role.

import type { Role } from '@/lib/roles';
import type { TopLevelView, View } from './types';

// `roles` — restringe o separador aos papéis listados (undefined = todos os
// autenticados). Espelha os @Roles() dos endpoints por trás de cada aba:
// admin/dashboard e a tabela de gestão de cursos são ADMIN/RH; inscrições e
// progresso (courses/enrollments) também aceitam GESTOR.
export const NAV: Array<{
  id: TopLevelView;
  label: string;
  roles?: readonly Role[];
}> = [
  { id: 'dashboard', label: 'Visão Geral', roles: ['ADMIN', 'RH'] },
  { id: 'catalog', label: 'Cursos' },
  { id: 'categorias', label: 'Categorias', roles: ['ADMIN', 'RH'] },
  { id: 'inscricoes', label: 'Inscrições', roles: ['ADMIN', 'RH', 'GESTOR'] },
  { id: 'progresso', label: 'Progresso', roles: ['ADMIN', 'RH', 'GESTOR'] },
  { id: 'turmas', label: 'Turmas', roles: ['ADMIN', 'RH', 'INSTRUCTOR'] },
  { id: 'my-courses', label: 'Meus cursos' },
  { id: 'certificates', label: 'Certificados' },
  { id: 'relatorios', label: 'Relatórios', roles: ['ADMIN', 'RH'] },
];

export const TITLES: Record<View, string> = {
  catalog: 'Cursos',
  detail: 'Curso',
  'my-courses': 'Os meus cursos',
  certificates: 'Os meus certificados',
  dashboard: 'Visão Geral',
  gestao: 'Cursos',
  inscricoes: 'Inscrições',
  progresso: 'Progresso',
  modulos: 'Módulos & Lições',
  turmas: 'Turmas',
  categorias: 'Categorias',
  relatorios: 'Relatórios',
};
