import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: any, opts: any) => ({ mutate: (v: unknown) => Promise.resolve(fn(v)).then((d: unknown) => opts?.onSuccess?.(d, v)), isPending: false }),
}));
vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: vi.fn().mockResolvedValue({}) }, API_URL: '/api' }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => vi.fn().mockResolvedValue(true) }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('./AccessLogsPanel', () => ({ AccessLogsPanel: () => <div>access-logs</div> }));
vi.mock('./EditPayslipModal', () => ({ EditPayslipModal: () => <div>edit-modal</div> }));
vi.mock('./ResolveDisputeModal', () => ({ ResolveDisputeModal: () => <div>resolve-modal</div> }));

import { AdminPayslipDetailView } from './AdminPayslipDetailView';

const make = (over: Record<string, unknown> = {}) => ({
  data: {
    id: 3, receiptCode: 'REC-3', period: '2026-06', paymentDate: '2026-06-25',
    netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
    mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0, overtime: 0, bonuses: 0, otherAllowances: 0,
    incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
    healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
    totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
    status: 'DRAFT', issuedAt: null, acknowledgedAt: null, notes: null,
    user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
    disputes: [], ...over,
  },
  isLoading: false, error: null,
});

beforeEach(() => useApiQuery.mockReset());

describe('AdminPayslipDetailView', () => {
  test('DRAFT shows Editar and Emitir', () => {
    useApiQuery.mockReturnValue(make());
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Emitir' })).toBeInTheDocument();
  });

  test('ISSUED hides Editar and Emitir', () => {
    useApiQuery.mockReturnValue(make({ status: 'ISSUED' }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Emitir' })).not.toBeInTheDocument();
    expect(screen.getByText(/já não é editável/i)).toBeInTheDocument();
  });

  test('ACKNOWLEDGED hides the actions', () => {
    useApiQuery.mockReturnValue(make({ status: 'ACKNOWLEDGED' }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });

  test('DISPUTED with an OPEN dispute shows the dispute and a Resolver button', () => {
    useApiQuery.mockReturnValue(make({
      status: 'DISPUTED',
      disputes: [{ id: 11, payslipId: 3, userId: 7, reason: 'IRT errado', details: null,
        status: 'OPEN', createdAt: '2026-06-26T00:00:00Z', resolvedAt: null, resolution: null }],
    }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByText('IRT errado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resolver' })).toBeInTheDocument();
  });

  test('a RESOLVED dispute shows no Resolver button', () => {
    useApiQuery.mockReturnValue(make({
      status: 'DISPUTED',
      disputes: [{ id: 11, payslipId: 3, userId: 7, reason: 'x', details: null,
        status: 'RESOLVED', createdAt: '2026-06-26T00:00:00Z', resolvedAt: '2026-06-27T00:00:00Z', resolution: 'feito' }],
    }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument();
  });

  test('renders an error message, not a blank panel, when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('kaboom') });
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByText('kaboom')).toBeInTheDocument();
  });

  test('has a "Descarregar PDF" link to the admin PDF route', () => {
    useApiQuery.mockReturnValue(make({ status: 'ISSUED' }));
    render(<AdminPayslipDetailView payslipId={3} onBack={vi.fn()} />);
    expect(screen.getByRole('link', { name: /Descarregar PDF/i })).toHaveAttribute(
      'href',
      '/api/payslips/3/pdf',
    );
  });
});
