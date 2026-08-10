// components/users/constants.ts
// Navegação e títulos do módulo de utilizadores. Extraído de
// app/(platform)/users/page.tsx.

import type { View } from './types';

export const NAV: Array<{
  id: Exclude<View, 'detail' | 'create'>;
  label: string;
}> = [
  { id: 'list', label: 'Utilizadores' },
  { id: 'directory', label: 'Diretório' },
  { id: 'dashboard', label: 'Dashboard' },
];

export const TITLES: Record<View, string> = {
  list: 'Gestão de Utilizadores',
  detail: 'Perfil do Colaborador',
  create: 'Novo Colaborador',
  dashboard: 'Dashboard de RH',
  directory: 'Diretório Interno',
};
