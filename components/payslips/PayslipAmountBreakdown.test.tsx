import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PayslipAmountBreakdown } from './PayslipAmountBreakdown';
import type { Payslip } from './types';

const base: Payslip = {
  id: 1, receiptCode: 'REC-1', period: '2026-06', paymentDate: '2026-06-25',
  netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
  mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0,
  overtime: 0, bonuses: 0, otherAllowances: 0,
  incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
  healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
  totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
  status: 'ISSUED', issuedAt: null, acknowledgedAt: null, notes: null,
};

describe('PayslipAmountBreakdown', () => {
  test('renders base, gross and net', () => {
    render(<PayslipAmountBreakdown payslip={base} />);
    expect(screen.getByText(/Salário base/i)).toBeInTheDocument();
    expect(screen.getByText(/Total bruto/i)).toBeInTheDocument();
    expect(screen.getByText(/Salário líquido/i)).toBeInTheDocument();
  });

  test('hides optional earning rows when zero', () => {
    render(<PayslipAmountBreakdown payslip={base} />);
    expect(screen.queryByText(/Subsídio de alimentação/i)).not.toBeInTheDocument();
  });

  test('shows an optional earning row when > 0', () => {
    render(<PayslipAmountBreakdown payslip={{ ...base, mealAllowance: 15000 }} />);
    expect(screen.getByText(/Subsídio de alimentação/i)).toBeInTheDocument();
  });
});
