// components/payslips/PayslipAmountBreakdown.tsx
// Bloco apresentacional Remunerações / Deduções / Resumo final de um recibo.
// Extraído de PayslipDetailView para ser partilhado entre a vista do
// colaborador (components/payslips) e a vista admin (components/payroll/
// AdminPayslipDetailView) — evita que os dois divirjam no cálculo/render.

import { formatKz as fmtKz } from '@/lib/format';
import type { Payslip } from './types';

export interface PayslipAmountBreakdownProps {
  payslip: Pick<
    Payslip,
    | 'baseSalary' | 'mealAllowance' | 'vacationAllowance' | 'christmasAllowance'
    | 'overtime' | 'bonuses' | 'otherAllowances' | 'grossSalary'
    | 'incomeTax' | 'socialSecurity' | 'employerInss' | 'healthInsurance'
    | 'loanDeduction' | 'advanceDeduction' | 'otherDeductions'
    | 'totalDeductions' | 'netSalary' | 'irtBracketRate'
  >;
}

interface SalaryRowProps {
  label: string;
  amount: number;
  type?: 'positive' | 'deduction' | 'neutral';
  sub?: string;
}

function SalaryRow({ label, amount, type = 'neutral', sub }: SalaryRowProps) {
  return (
    <div className="flex items-baseline justify-between border-b border-border py-1.5 last:border-0">
      <div>
        <span className="font-body text-sm text-ink-muted">{label}</span>
        {sub && <span className="ml-2 font-body text-xs text-ink-faint">{sub}</span>}
      </div>
      <span
        className={`font-mono text-sm font-medium ${
          type === 'positive'
            ? 'text-success'
            : type === 'deduction'
              ? 'text-danger'
              : 'text-ink'
        }`}
      >
        {type === 'deduction' ? '− ' : ''}
        {fmtKz(amount)}
      </span>
    </div>
  );
}

export function PayslipAmountBreakdown({ payslip: data }: PayslipAmountBreakdownProps) {
  const irtSub =
    data.irtBracketRate !== null
      ? `${((data.irtBracketRate ?? 0) * 100).toFixed(0)}%`
      : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Remunerações
          </div>
          <SalaryRow label="Salário base" amount={data.baseSalary} />
          {data.mealAllowance > 0 && (
            <SalaryRow label="Subsídio de alimentação" amount={data.mealAllowance} type="positive" />
          )}
          {data.vacationAllowance > 0 && (
            <SalaryRow label="Subsídio de férias" amount={data.vacationAllowance} type="positive" />
          )}
          {data.christmasAllowance > 0 && (
            <SalaryRow label="Subsídio de Natal" amount={data.christmasAllowance} type="positive" />
          )}
          {data.overtime > 0 && (
            <SalaryRow label="Horas extras" amount={data.overtime} type="positive" />
          )}
          {data.bonuses > 0 && (
            <SalaryRow label="Prémios / Comissões" amount={data.bonuses} type="positive" />
          )}
          {data.otherAllowances > 0 && (
            <SalaryRow label="Outros subsídios" amount={data.otherAllowances} type="positive" />
          )}
          <div className="mt-1 flex items-baseline justify-between py-2">
            <span className="font-body text-sm font-medium text-ink">Total bruto</span>
            <span className="font-mono text-sm font-semibold text-ink">
              {fmtKz(data.grossSalary)}
            </span>
          </div>
        </div>
        <div>
          <div className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            Deduções
          </div>
          <SalaryRow label="IRT" amount={data.incomeTax} type="deduction" sub={irtSub} />
          <SalaryRow label="INSS colaborador (3%)" amount={data.socialSecurity} type="deduction" />
          {data.healthInsurance > 0 && (
            <SalaryRow label="Seguro de saúde" amount={data.healthInsurance} type="deduction" />
          )}
          {data.loanDeduction > 0 && (
            <SalaryRow label="Dedução empréstimo" amount={data.loanDeduction} type="deduction" />
          )}
          {data.advanceDeduction > 0 && (
            <SalaryRow label="Adiantamento salarial" amount={data.advanceDeduction} type="deduction" />
          )}
          {data.otherDeductions > 0 && (
            <SalaryRow label="Outras deduções" amount={data.otherDeductions} type="deduction" />
          )}
          <div className="mt-1 flex items-baseline justify-between py-2">
            <span className="font-body text-sm font-medium text-ink">Total deduções</span>
            <span className="font-mono text-sm font-semibold text-danger">
              − {fmtKz(data.totalDeductions)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-card bg-primary-subtle px-5 py-4">
        <div>
          <div className="font-body text-sm font-semibold text-ink">Salário líquido</div>
          <div className="mt-0.5 font-body text-xs text-ink-muted">
            INSS empregador (informativo): {fmtKz(data.employerInss)}
            &nbsp;·&nbsp; Encargo total empresa: {fmtKz(data.grossSalary + data.employerInss)}
          </div>
        </div>
        <div className="font-mono text-2xl font-bold text-primary">{fmtKz(data.netSalary)}</div>
      </div>
    </div>
  );
}
