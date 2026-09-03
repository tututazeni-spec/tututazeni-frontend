// components/payroll/types.ts
// Tipos e mapas de estado partilhados pelas vistas do workflow de runs
// (RunListView, RunDetailView, RunPayslipsTable, ExceptionsPanel,
// CreateRunModal, RecalcPayslipModal). Espelha o schema real de
// PayrollRun/Payslip do backend (innova, prisma/schema.prisma) — ver
// docs/superpowers/specs/2026-09-03-payroll-runs-frontend-design.md.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { PayslipStatus, Payslip } from '@/components/payslips/types';

export type RunStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'SIMULATED'
  | 'PENDING_APPROVAL'
  | 'CALCULATED' // legado — nenhum serviço o define, mantido no enum do backend
  | 'APPROVED'
  | 'PUBLISHED'
  | 'CANCELLED';

export interface PayrollRun {
  id: number;
  period: string;
  countryCode: string;
  status: RunStatus;
  notes: string | null;
  payGroup: string | null;
  taxYear: number | null;
  employeeCount: number | null;
  exceptionsCount: number | null;
  errorCount: number | null;
  totalGross: number | null;
  totalNet: number | null;
  totalDeductions: number | null;
  totalEmployerCost: number | null;
  createdAt: string;
  createdById: number;
  processedAt: string | null;
  processedById: number | null;
  submittedAt: string | null;
  submittedById: number | null;
  approvedAt: string | null;
  approvedById: number | null;
  publishedAt: string | null;
  publishedById: number | null;
  rejectionReason: string | null;
  cancellationReason: string | null;
}

export interface TimelineStep {
  step: 'created' | 'processed' | 'submitted' | 'approved' | 'published';
  at: string | null;
  by: { id: number; fullName: string } | null;
}

export interface PayrollRunDetail extends PayrollRun {
  timeline: TimelineStep[];
}

export interface RunException {
  payslipId: number;
  userId: number;
  fullName: string;
  code: string;
  severity: 'ERROR' | 'WARNING';
  message: string;
}

export interface RunPayslipItem {
  id: number;
  code: string;
  name: string;
  type: 'EARNING' | 'DEDUCTION';
  value: number;
  isTaxable: boolean;
}

export interface RunCalcInputs {
  absenceDays?: number | null;
  overtimeHours?: number | null;
  bonusAmount?: number | null;
  advanceDeduction?: number | null;
  workingDaysInMonth?: number | null;
}

export interface RunPayslip {
  id: number;
  userId: number;
  period: string;
  grossSalary: number;
  netSalary: number;
  status: PayslipStatus;
  hasExceptions: boolean;
  calcInputs: RunCalcInputs | null;
  user: { id: number; fullName: string; employeeNumber: string | null };
  items: RunPayslipItem[];
}

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const RUN_STATUS_MAP: StatusBadgeMap<RunStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  PROCESSING: { label: 'A processar', cls: 'bg-info-subtle text-info-ink' },
  SIMULATED: { label: 'Simulado', cls: 'bg-info-subtle text-info-ink' },
  PENDING_APPROVAL: {
    label: 'Pendente de aprovação',
    cls: 'bg-warning-subtle text-warning-ink',
  },
  CALCULATED: { label: 'Calculado', cls: 'bg-surface-sunken text-ink-muted' },
  APPROVED: { label: 'Aprovado', cls: 'bg-success-subtle text-success-ink' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success text-white' },
  CANCELLED: { label: 'Cancelado', cls: 'bg-danger-subtle text-danger-ink' },
};

export const EXCEPTION_SEVERITY_MAP: StatusBadgeMap<'ERROR' | 'WARNING'> = {
  ERROR: { label: 'Erro', cls: 'bg-danger-subtle text-danger-ink' },
  WARNING: { label: 'Aviso', cls: 'bg-warning-subtle text-warning-ink' },
};

export const EXCEPTION_CODE_LABEL: Record<string, string> = {
  NO_COMPENSATION: 'Sem compensação',
  ZERO_BASE_SALARY: 'Salário-base zero',
  NEGATIVE_NET: 'Líquido negativo',
  DUPLICATE_PAYSLIP_FOR_PERIOD: 'Recibo duplicado no período',
  NET_BELOW_MINIMUM_WAGE: 'Líquido abaixo do salário mínimo',
  MISSING_BANK_DETAILS: 'Dados bancários em falta',
  HIGH_VARIANCE_VS_PREV_MONTH: 'Variação alta face ao mês anterior',
  USING_FALLBACK_TAX_CONFIG: 'A usar configuração fiscal por omissão',
};

export type DisputeStatus = 'OPEN' | 'RESOLVED';

export interface PayslipDispute {
  id: number;
  payslipId: number;
  userId: number;
  reason: string;
  details: string | null;
  status: DisputeStatus;
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
  user?: { id: number; fullName: string; employeeNumber: string | null };
  payslip?: {
    id: number;
    receiptCode: string | null;
    period: string;
    userId: number;
    status: PayslipStatus;
  };
}

export interface PayslipAccessLog {
  id: number;
  payslipId: number;
  userId: number;
  action: 'VIEW' | 'ADMIN_VIEW' | 'DOWNLOAD';
  ipAddress: string | null;
  accessedAt: string;
  user?: { id: number; fullName: string };
}

export type AdminPayslip = Payslip & {
  disputes: PayslipDispute[];
  run?: { id: number; status: string } | null;
};

export interface HrDashboard {
  period: string;
  counts: {
    total: number;
    issued: number;
    acknowledged: number;
    disputed: number;
    notViewed: number;
    draft: number;
  };
  financials: {
    totalGross: number;
    totalNet: number;
    totalIRT: number;
    totalINSSEmployee: number;
    totalINSSEmployer: number;
    avgNet: number;
  };
  compliance: { viewRate: string; pendingAcknowledgement: number };
}

export const DISPUTE_STATUS_MAP: StatusBadgeMap<DisputeStatus> = {
  OPEN: { label: 'Aberta', cls: 'bg-warning-subtle text-warning-ink' },
  RESOLVED: { label: 'Resolvida', cls: 'bg-success-subtle text-success-ink' },
};
