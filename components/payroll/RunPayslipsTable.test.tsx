import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);
const patch = vi.fn().mockResolvedValue({ id: 5, runId: null });
const confirm = vi.fn().mockResolvedValue(true);
const notify = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@tanstack/react-query', () => ({ keepPreviousData: Symbol('kpd') }));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...a) },
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: () => null,
}));
vi.mock('./RecalcPayslipModal', () => ({
  RecalcPayslipModal: ({ payslip }: any) => (
    <div data-testid="recalc-modal">{payslip.user.fullName}</div>
  ),
}));

import { RunPayslipsTable } from './RunPayslipsTable';

const page1 = {
  data: [
    {
      id: 5,
      userId: 7,
      period: '2026-09',
      grossSalary: 150000,
      netSalary: 120000,
      status: 'DRAFT',
      hasExceptions: true,
      calcInputs: null,
      user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
      items: [],
    },
  ],
  meta: { total: 1, page: 1, limit: 50, totalPages: 1 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
  useApiQuery.mockClear();
  patch.mockClear();
  confirm.mockClear();
});

describe('RunPayslipsTable', () => {
  test('renders a row with collaborator, gross, net, exceptions indicator, status', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('E-7')).toBeInTheDocument();
    expect(screen.getByText(/150.?000/)).toBeInTheDocument();
    expect(screen.getByText(/120.?000/)).toBeInTheDocument();
  });

  test('row actions are hidden when run is not SIMULATED', () => {
    render(<RunPayslipsTable runId={9} runStatus="PENDING_APPROVAL" />);
    expect(screen.queryByRole('button', { name: 'Recalcular' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Excluir' })).not.toBeInTheDocument();
  });

  test('"Recalcular" opens RecalcPayslipModal for that row when run is SIMULATED', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Recalcular' }));
    expect(screen.getByTestId('recalc-modal')).toHaveTextContent('Ana Silva');
  });

  test('"Excluir" confirms then PATCHes the exclude endpoint', async () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/payroll/runs/9/payslips/5/exclude');
  });

  test('"Excluir" does not PATCH when the confirm dialog is declined', async () => {
    confirm.mockResolvedValueOnce(false);
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" />);
    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(patch).not.toHaveBeenCalled();
  });

  test('the row matching highlightPayslipId gets the highlight class', () => {
    render(<RunPayslipsTable runId={9} runStatus="SIMULATED" highlightPayslipId={5} />);
    expect(screen.getByTestId('run-payslip-row-5')).toHaveClass('bg-warning-subtle');
  });
});
