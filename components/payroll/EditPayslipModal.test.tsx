import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const put = vi.fn().mockResolvedValue({ id: 3 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { put: (...a: unknown[]) => put(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));

import { EditPayslipModal } from './EditPayslipModal';
import type { AdminPayslip } from './types';

const payslip = {
  id: 3, receiptCode: 'REC-3', period: '2026-06', paymentDate: '2026-06-25',
  netSalary: 180000, grossSalary: 250000, baseSalary: 250000,
  mealAllowance: 0, vacationAllowance: 0, christmasAllowance: 0,
  overtime: 0, bonuses: 0, otherAllowances: 0,
  incomeTax: 40000, socialSecurity: 7500, employerInss: 20000,
  healthInsurance: 0, loanDeduction: 0, advanceDeduction: 0, otherDeductions: 0,
  totalDeductions: 70000, irtBracketRate: 0.13, irtFormula: null,
  status: 'DRAFT', issuedAt: null, acknowledgedAt: null, notes: null,
  disputes: [],
} as unknown as AdminPayslip;

beforeEach(() => { put.mockClear(); notify.mockClear(); });

describe('EditPayslipModal', () => {
  test('shows the DRAFT-reversion warning', () => {
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByText(/devolve o recibo a Rascunho/i)).toBeInTheDocument();
  });

  test('pre-fills base salary from the payslip', () => {
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Salário base/i)).toHaveValue(250000);
  });

  test('PUTs the changed fields to /payslips/:id', async () => {
    const onClose = vi.fn();
    render(<EditPayslipModal payslip={payslip} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '300000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/payslips/3');
    expect(body).toMatchObject({ baseSalary: 300000 });
    expect(onClose).toHaveBeenCalled();
  });

  test('403 shows an error toast', async () => {
    put.mockRejectedValueOnce(Object.assign(new Error('Recibo não editável no estado actual'), { status: 403 }));
    render(<EditPayslipModal payslip={payslip} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })));
  });
});
