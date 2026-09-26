// components/users/constants.ts
// Navegação e títulos do módulo de utilizadores. Extraído de
// app/(platform)/users/page.tsx.
//
// Módulo "Utilizadores" único na sidebar: integra o ex-módulo
// Roles-Permissions (separador "Permissões por Cargos") sem fundir dados —
// continua a bater no seu próprio controller (/roles-permissions). Ver
// components/roles-permissions/RolesPermissionsView.tsx.
//
// O separador "Colaboradores" (ex-módulo Employees) foi removido daqui —
// docs/modulo_users.md pediu a remoção da aba, mas os modelos Prisma
// (Employee, EmployeeSkill, EmployeeDocument, EmployeeTimeline) e o
// controller /employees mantêm-se intactos; a rota standalone
// app/(platform)/employees/page.tsx continua a existir para quem lá bater
// directamente. Substituído por "Importação" e "Histórico & Auditoria"
// (Ponto 5 e Ponto 6).

import type { View } from './types';

export const NAV: Array<{
  id: Exclude<View, 'detail' | 'create'>;
  label: string;
}> = [
  { id: 'list', label: 'Utilizadores' },
  { id: 'directory', label: 'Diretório' },
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'import', label: 'Importação' },
  { id: 'audit', label: 'Histórico & Auditoria' },
  { id: 'permissions', label: 'Permissões por Cargos' },
];

export const TITLES: Record<View, string> = {
  list: 'Gestão de Utilizadores',
  detail: 'Perfil do Colaborador',
  create: 'Novo Colaborador',
  dashboard: 'Dashboard de RH',
  directory: 'Diretório Interno',
  import: 'Importação',
  audit: 'Histórico & Auditoria',
  permissions: 'Permissões por Cargos',
};
