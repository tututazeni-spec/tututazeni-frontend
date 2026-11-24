import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mutate = vi.fn();
let queries: Record<string, unknown> = {};
let isAdmin = false;
let mutationData: unknown = null;

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, url: string) => ({
    data: queries[url],
    isLoading: false,
  }),
  useApiMutation: () => ({ mutate, data: mutationData, isPending: false }),
}));
vi.mock('@/hooks/useCurrentRole', () => ({ useHasRole: () => isAdmin }));
vi.mock('@/components/payroll/EditTaxRulesModal', () => ({
  EditTaxRulesModal: () => <div>modal-editar-regras</div>,
}));

import { SimulateView } from './SimulateView';

const rules = {
  id: 1,
  taxYear: 2026,
  countryCode: 'AO',
  minimumWage: 70000,
  socialSecurity: { employeeRate: 0.03, employerRate: 0.08, ceiling: null },
  irtBrackets: [
    { id: 1, min: 0, max: 70000, rate: 0, deduction: 0 },
    { id: 2, min: 70000, max: 100000, rate: 0.07, deduction: 0 },
    { id: 3, min: 100000, max: null, rate: 0.11, deduction: 4000 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  isAdmin = false;
  mutationData = null;
  queries = {
    '/payslips/tax-rules': rules,
    '/payslips/my/compensation': {
      baseSalary: 500000,
      foodAllowance: 25000,
      transportAllowance: 10000,
      otherAllowances: 15000,
      effectiveFrom: '2026-01-01',
    },
  };
});

describe('SimulateView', () => {
  test('o formulário parte dos dados salariais do próprio utilizador', async () => {
    render(<SimulateView />);
    await waitFor(() =>
      expect(screen.getByLabelText(/Salário base/)).toHaveValue(500000),
    );
    expect(screen.getByLabelText(/Subsídio de alimentação/)).toHaveValue(25000);
    expect(screen.getByLabelText(/Subsídio de transporte/)).toHaveValue(10000);
    expect(screen.getByLabelText(/Outros subsídios/)).toHaveValue(15000);
  });

  test('a tabela mostra as regras reais (escalões, taxa e parcela fixa)', () => {
    render(<SimulateView />);
    expect(screen.getByText('Tabela IRT Angola 2026')).toBeInTheDocument();
    expect(screen.getByText('Isento')).toBeInTheDocument();
    expect(screen.getByText('7%')).toBeInTheDocument();
    expect(screen.getByText('11%')).toBeInTheDocument();
    expect(screen.getByText('Parcela fixa')).toBeInTheDocument();
  });

  test('colaborador não vê "Editar tabela"', () => {
    render(<SimulateView />);
    expect(screen.queryByText('Editar tabela')).not.toBeInTheDocument();
  });

  test('Admin/RH vê "Editar tabela" e abre o editor de regras', () => {
    isAdmin = true;
    render(<SimulateView />);
    fireEvent.click(screen.getByText('Editar tabela'));
    expect(screen.getByText('modal-editar-regras')).toBeInTheDocument();
  });

  test('o resultado lista as deduções devolvidas pelo motor real', () => {
    mutationData = {
      grossSalary: 540000,
      incomeTax: 50000,
      socialSecurity: 15000,
      employerInss: 40000,
      totalDeductions: 75000,
      netSalary: 465000,
      deductionLines: [
        { code: 'INSS_EMPLOYEE', name: 'INSS Colaborador (3%)', value: 15000 },
        { code: 'IRT', name: 'IRT', value: 50000 },
        {
          code: 'HEALTH_INSURANCE',
          name: 'Seguro de Saúde (2%)',
          value: 10000,
        },
      ],
      irtDetails: {
        bracket: { min: 100000, max: null, rate: 0.11, deduction: 4000 },
        base: 525000,
        formula: '4 000 + (525 000 − 100 000) × 11% = 50 750 AOA',
        effectiveRate: 9.3,
      },
    };
    render(<SimulateView />);
    expect(screen.getByText('INSS Colaborador (3%)')).toBeInTheDocument();
    expect(screen.getByText('Seguro de Saúde (2%)')).toBeInTheDocument();
    expect(screen.getByText('IRT (11%)')).toBeInTheDocument();
  });
});
