'use client';
// src/app/(dashboard)/roles-permissions/page.tsx
//
// Rota standalone — o mesmo conteúdo passou a estar disponível também como
// separador "Permissões por Cargos" de app/(platform)/users/page.tsx (módulo
// "Utilizadores" único na sidebar). Ver
// components/roles-permissions/RolesPermissionsView.tsx.

import { RolesPermissionsView } from '@/components/roles-permissions/RolesPermissionsView';

export default function RolesPermissionsPage() {
  return <RolesPermissionsView />;
}
