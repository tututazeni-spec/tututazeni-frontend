// components/payslips/ComponentFormModal.tsx
// PLACEHOLDER (Task 5 handoff) — substituído integralmente pela Task 6.
// Existe apenas para satisfazer `tsc`/`build`: ComponentsView.tsx importa este
// componente, e o teste de ComponentsView faz-lhe stub via vi.mock.
'use client';

import type { SalaryComponent } from './types';

interface ComponentFormModalProps {
  component?: SalaryComponent | null;
  onClose: () => void;
}

export function ComponentFormModal(_props: ComponentFormModalProps) {
  return null;
}
