// PLACEHOLDER (Task 9 handoff) — replaced entirely by Task 10.
import type { EmployeeCompensation } from './types';

export interface CompensationFormModalProps {
  mode: 'create' | 'edit';
  record?: EmployeeCompensation | null;
  userId?: number;
  onClose: () => void;
}

export function CompensationFormModal(_props: CompensationFormModalProps) {
  return null;
}
