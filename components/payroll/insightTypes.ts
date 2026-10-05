// components/payroll/insightTypes.ts
// Tipos das secções agregadas do Payroll (docs/payroll.md §1, §3, §5, §7,
// §8, §9) — espelham src/payslips/payroll-insights.service.ts e
// payroll-payments.service.ts.

import type { StatusBadgeMap } from '@/lib/statusBadge';

export interface PayrollOverview {
  period: string;
  run: {
    id: number;
    status: string;
    payGroup: string | null;
    closed: boolean;
  } | null;
  employees: { total: number; processed: number; pending: number };
  financials: {
    totalGross: number;
    totalNet: number;
    totalEarnings: number;
    totalDeductions: number;
    totalInss: number;
    totalIrt: number;
    employerCharges: number;
    totalPersonnelCost: number;
    totalPayable: number;
  };
  previous: { period: string; totalGross: number; totalNet: number };
  monthlyVariation: { absolute: number; pct: number } | null;
  pendingPayments: number;
  receipts: { issued: number; pending: number };
  alerts: Array<{
    code: string;
    severity: 'info' | 'warning' | 'error';
    message: string;
  }>;
}

export interface RunEmployeeRow {
  payslipId: number;
  userId: number;
  fullName: string;
  employeeNumber: string | null;
  nif: string | null;
  department: string | null;
  position: string | null;
  baseSalary: number;
  allowances: number;
  overtime: number;
  bonuses: number;
  absenceDays: number;
  inss: number;
  irt: number;
  otherDeductions: number;
  grossSalary: number;
  netSalary: number;
  employerCost: number;
  status: string;
  hasExceptions: boolean;
}

export interface EmployeeProfile {
  user: {
    id: number;
    fullName: string;
    employeeNumber: string | null;
    nif: string | null;
    nib: string | null;
    department: { name: string } | null;
    position: { name: string } | null;
    unit: { name: string } | null;
  };
  compensation: {
    baseSalary: number;
    foodAllowance: number | null;
    transportAllowance: number | null;
    bankName: string | null;
    effectiveFrom: string;
    components: Array<{ id: number; componentCode: string; value: number }>;
  } | null;
  salaryHistory: Array<{
    id: number;
    baseSalary: number;
    effectiveFrom: string;
    effectiveTo: string | null;
  }>;
  payslips: Array<{
    id: number;
    period: string;
    receiptCode: string | null;
    grossSalary: number;
    netSalary: number;
    status: string;
    paymentDate: string | null;
  }>;
  payments: Array<{
    period: string;
    paymentDate: string | null;
    netSalary: number;
  }>;
}

export interface DeductionsSummary {
  period: string;
  employees: number;
  types: Array<{
    code: string;
    name: string;
    mandatory: boolean;
    total: number;
    employeesAffected: number;
  }>;
  inss: {
    contributoryBase: number;
    employeeTotal: number;
    employerTotal: number;
  };
  irt: {
    taxableIncome: number;
    withheld: number;
    byBracket: Array<{ bracket: string; employees: number; irt: number }>;
  };
  config: TaxConfig | null;
}

export interface TaxConfig {
  id: number;
  taxYear: number;
  countryCode: string;
  minimumWage: number;
  socialSecurity: {
    employeeRate: number;
    employerRate: number;
    ceiling: number | null;
  };
  irtBrackets: Array<{
    id: number;
    min: number;
    max: number | null;
    rate: number;
    deduction: number | null;
  }>;
}

export type PaymentStatus =
  | 'PENDING'
  | 'PREPARED'
  | 'SENT_TO_BANK'
  | 'PROCESSED'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED';

export const PAYMENT_STATUS_MAP: StatusBadgeMap<PaymentStatus> = {
  PENDING: { label: 'Pendente', cls: 'bg-surface-sunken text-ink-muted' },
  PREPARED: { label: 'Preparado', cls: 'bg-info-subtle text-info-ink' },
  SENT_TO_BANK: {
    label: 'Enviado ao banco',
    cls: 'bg-info-subtle text-info-ink',
  },
  PROCESSED: {
    label: 'Processado',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  PAID: { label: 'Pago', cls: 'bg-success-subtle text-success-ink' },
  FAILED: { label: 'Falhou', cls: 'bg-danger-subtle text-danger-ink' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-surface-sunken text-ink-muted' },
};

/** Próximos estados válidos — espelha TRANSITIONS no backend. */
export const PAYMENT_NEXT: Record<PaymentStatus, PaymentStatus[]> = {
  PENDING: ['PREPARED', 'CANCELLED'],
  PREPARED: ['SENT_TO_BANK', 'FAILED', 'CANCELLED'],
  SENT_TO_BANK: ['PROCESSED', 'FAILED', 'CANCELLED'],
  PROCESSED: ['PAID', 'FAILED'],
  PAID: [],
  FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: [],
};

export interface PayrollPayment {
  id: number;
  runId: number;
  period: string;
  bankName: string | null;
  paymentAccount: string | null;
  employeeCount: number;
  totalAmount: number;
  expectedDate: string | null;
  effectiveDate: string | null;
  status: PaymentStatus;
  reference: string | null;
  bankFileGeneratedAt: string | null;
  errorMessage: string | null;
  responsibleName: string | null;
}

export interface ClosureOverview {
  runId: number;
  period: string;
  status: string;
  closed: boolean;
  hrValidation: { at: string; by: string | null } | null;
  financeValidation: { at: string; by: string | null } | null;
  approval: { at: string; by: string | null } | null;
  closedAt: string | null;
  closedBy: string | null;
  totals: {
    employees: number;
    totalGross: number;
    totalNet: number;
    totalTaxes: number;
    totalEmployerCharges: number;
    receiptsIssued: number;
    paymentsProcessed: number;
  };
  checklist: Array<{ code: string; label: string; ok: boolean }>;
  canClose: boolean;
}

export interface ReportResult {
  type: string;
  totals: Record<string, number>;
  rows: Array<Record<string, string | number | null>>;
}
