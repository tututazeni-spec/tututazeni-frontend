// components/users/constants.ts
// Navegação e títulos do módulo de utilizadores. Extraído de
// app/(platform)/users/page.tsx.
//
// Módulo "Utilizadores" único na sidebar: integra os ex-módulos Employees
// (separador "Colaboradores") e Roles-Permissions (separador "Permissões
// por Cargos") sem fundir dados — cada um continua a bater no seu próprio
// controller (/employees, /roles-permissions). Ver
// components/employees/EmployeesView.tsx e
// components/roles-permissions/RolesPermissionsView.tsx. Mesmo padrão de
// app/(platform)/learning-paths/page.tsx (separadores 'lms-*').

import type { View } from './types';

export const NAV: Array<{
  id: Exclude<View, 'detail' | 'create'>;
  label: string;
}> = [
  { id: 'list', label: 'Utilizadores' },
  { id: 'directory', label: 'Diretório' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'employees', label: 'Colaboradores' },
  { id: 'permissions', label: 'Permissões por Cargos' },
];

export const TITLES: Record<View, string> = {
  list: 'Gestão de Utilizadores',
  detail: 'Perfil do Colaborador',
  create: 'Novo Colaborador',
  dashboard: 'Dashboard de RH',
  directory: 'Diretório Interno',
  employees: 'Colaboradores',
  permissions: 'Permissões por Cargos',
};
