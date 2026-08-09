// components/payslips/types.ts
// Tipos e constantes partilhados entre as várias vistas de payslips/page.tsx
// (ListView, DetailView, CompareView, AnnualView) e hooks/usePayslipDetail.ts.
// Ver memory project_innova_component_separation_audit, item 3.2.

import type { StatusBadgeMap } from '@/lib/statusBadge';

export type PayslipStatus = 'DRAFT' | 'ISSUED' | 'ACKNOWLEDGED' | 'DISPUTED';

export interface Payslip {
  id: number;
  receiptCode: string;
  period: string;
  paymentDate: string | null;
  netSalary: number;
  grossSalary: number;
  baseSalary: number;
  mealAllowance: number;
  vacationAllowance: number;
  christmasAllowance: number;
  overtime: number;
  bonuses: number;
  otherAllowances: number;
  incomeTax: number;
  socialSecurity: number;
  employerInss: number;
  healthInsurance: number;
  loanDeduction: number;
  advanceDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  irtBracketRate: number | null;
  irtFormula: string | null;
  status: PayslipStatus;
  issuedAt: string | null;
  acknowledgedAt: string | null;
  notes: string | null;
  user?: {
    id: number;
    fullName: string;
    employeeNumber: string;
    nif: string;
    nib: string;
    hireDate: string;
    position: { name: string } | null;
    department: { name: string } | null;
  };
}

export const PAYSLIP_STATUS_MAP: StatusBadgeMap<PayslipStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-600' },
  ISSUED: { label: 'Emitido', cls: 'bg-emerald-50 text-emerald-700' },
  ACKNOWLEDGED: { label: 'Confirmado', cls: 'bg-blue-50 text-blue-700' },
  DISPUTED: { label: 'Disputa', cls: 'bg-red-50 text-red-700' },
};
