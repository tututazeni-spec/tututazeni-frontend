import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const patch = vi.fn().mockResolvedValue({ id: 5 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { RecalcPayslipModal } from './RecalcPayslipModal';
import type { RunPayslip } from './types';

const payslip: RunPayslip = {
  id: 5,
  userId: 7,
  period: '2026-09',
  grossSalary: 150000,
  netSalary: 120000,
  status: 'DRAFT',
  hasExceptions: false,
  calcInputs: { absenceDays: 2, overtimeHours: 0, bonusAmount: null, advanceDeduction: null },
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
  items: [],
};

beforeEach(() => {
  patch.mockClear();
  notify.mockClear();
});

describe('RecalcPayslipModal', () => {
  test('prefills inputs from payslip.calcInputs', () => {
    render(<RecalcPayslipModal runId={9} payslip={payslip} onClose={vi.fn()} />);
    expect(screen.getByLabelText(/Dias de falta/i)).toHaveValue(2);
    expect(screen.getByLabelText(/Horas extra/i)).toHaveValue(0);
    expect(screen.getByLabelText(/Bónus/i)).toHaveValue(null);
    expect(screen.getByLabelText(/Adiantamento/i)).toHaveValue(null);
  });

  test('starts blank when calcInputs is null', () => {
    render(
      <RecalcPayslipModal
        runId={9}
        payslip={{ ...payslip, calcInputs: null }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/Dias de falta/i)).toHaveValue(null);
  });

  test('submits only the filled fields as numbers to the right endpoint', async () => {
    const onClose = vi.fn();
    render(<RecalcPayslipModal runId={9} payslip={payslip} onClose={onClose} />);
    fireEvent.change(screen.getByLabelText(/Bónus/i), { target: { value: '10000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    const [url, body] = patch.mock.calls[0];
    expect(url).toBe('/payroll/runs/9/payslips/5/recalc');
    expect(body).toEqual({ absenceDays: 2, overtimeHours: 0, bonusAmount: 10000 });
    expect(onClose).toHaveBeenCalled();
  });
});
