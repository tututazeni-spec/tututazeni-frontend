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
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  ISSUED: { label: 'Emitido', cls: 'bg-success-subtle text-success-ink' },
  ACKNOWLEDGED: { label: 'Confirmado', cls: 'bg-info-subtle text-info-ink' },
  DISPUTED: { label: 'Disputa', cls: 'bg-danger-subtle text-danger-ink' },
};

// ─── Tipos das restantes views (List/Compare/Simulate/Annual) ─────────────────
// Extraído de app/(platform)/payslips/page.tsx.

// `GET /payslips/my` devolve o envelope padrão `{ data, meta }` do backend
// (buildPaginatedResponse). Antes tipado como flat `{ data, total, page, … }`,
// o que fazia `data.total`/`data.totalPages` serem sempre `undefined` — a
// contagem mostrava "0 recibos" e o paginador nunca aparecia.
export type PaginatedPayslips = Paginated<Payslip>;

export interface AnnualSummary {
  year: string;
  months: number;
  totalGross: number;
  totalNet: number;
  totalIRT: number;
  totalINSSEmployee: number;
  totalINSSEmployer: number;
  totalMealAllowance: number;
  totalVacationAllowance: number;
  totalChristmasAllowance: number;
  totalBonuses: number;
  totalDeductions: number;
  monthlySeries: {
    period: string;
    grossSalary: number;
    netSalary: number;
    incomeTax: number;
    socialSecurity: number;
  }[];
}

export interface CompareResult {
  periodA: string;
  periodB: string;
  [key: string]:
    { a: number; b: number; delta: number; pct: number | null } | string;
}

export interface SimulateResult {
  grossSalary: number;
  incomeTax: number;
  socialSecurity: number;
  employerInss: number;
  totalDeductions: number;
  netSalary: number;
  irtDetails: {
    bracket: {
      min: number;
      max: number | null;
      rate: number;
      deduction: number;
    };
    formula: string;
    effectiveRate: number;
  };
}

export interface MyCompensation {
  baseSalary: number;
  foodAllowance: number | null;
  transportAllowance: number | null;
  bankName: string | null;
  ibanMasked: string | null;
  effectiveFrom: string;
}

export type ComponentType = 'EARNING' | 'DEDUCTION';
export type ComponentCalcType = 'FIXED' | 'PERCENT' | 'FORMULA' | 'TABLE';

export interface SalaryComponent {
  code: string;
  name: string;
  description: string | null;
  type: ComponentType;
  calcType: ComponentCalcType;
  fixedValue: number | null;
  rate: number | null;
  formula: string | null;
  isTaxable: boolean;
  isMandatory: boolean;
  order: number;
  active: boolean;
  countryCode: string | null;
  createdAt: string;
  updatedAt: string;
}

export type View =
  | 'list'
  | 'detail'
  | 'compare'
  | 'simulate'
  | 'annual'
  | 'compensation'
  | 'components'
  | 'compensations'
  | 'comp-detail';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "detail sem id" irrepresentável.
export type Nav =
  | { view: Exclude<View, 'detail' | 'comp-detail'> }
  | { view: 'detail'; selectedId: number }
  | { view: 'comp-detail'; userId: number };

// ─── Aba "Compensações" (admin) — B-3 ────────────────────────────────────────

export interface CompUserRef {
  id: number;
  fullName: string;
  employeeNumber: string | null;
  department: { id: number; name: string } | null;
}

export interface EmployeeCompensationComponent {
  id: number;
  compensationId: number;
  componentCode: string;
  value: number;
  override: boolean;
}

export interface EmployeeCompensation {
  id: number;
  userId: number;
  baseSalary: number;
  countryCode: string | null;
  bankName: string | null;
  iban: string | null;
  accountNumber: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  foodAllowance: number | null;
  transportAllowance: number | null;
  components: EmployeeCompensationComponent[];
  user?: CompUserRef;
}

export interface CompensationListRow {
  id: number;
  userId: number;
  baseSalary: number;
  countryCode: string | null;
  foodAllowance: number | null;
  transportAllowance: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  user: CompUserRef;
  _count: { components: number };
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
