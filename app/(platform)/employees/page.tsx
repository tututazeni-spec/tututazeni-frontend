'use client';

// Rota standalone — o mesmo conteúdo passou a estar disponível também como
// separador "Colaboradores" de app/(platform)/users/page.tsx (módulo
// "Utilizadores" único na sidebar). Ver components/employees/EmployeesView.tsx.

import { EmployeesView } from '@/components/employees/EmployeesView';

export default function EmployeesPage() {
  return <EmployeesView />;
}
