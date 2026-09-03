// components/payroll/PayslipListView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const useApiQuery = vi.fn();
const patch = vi.fn().mockResolvedValue({ id: 1, status: 'ISSUED' });
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
vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: (...a: unknown[]) => patch(...a) } }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
// components/ui/Select é um listbox Radix custom (não um <select> nativo):
// screen.getByRole('combobox') + fireEvent.change não funciona contra o
// componente real. Mesmo mock que RunListView.test.tsx — <select> nativo.
vi.mock('@/components/ui/Select', () => ({
  Select: ({ items, value, onValueChange }: any) => (
    <select
      data-testid="status-select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {items.map((it: any) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

import { PayslipListView } from './PayslipListView';

const row = {
  id: 1, receiptCode: 'REC-1', period: '2026-06', paymentDate: '2026-06-25',
  grossSalary: 250000, netSalary: 180000, status: 'DRAFT',
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
};
const page = { data: [row], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };

beforeEach(() => {
  useApiQuery.mockReset();
  patch.mockClear(); confirm.mockClear(); notify.mockClear();
});

describe('PayslipListView', () => {
  test('shows skeleton while loading', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  test('shows an error message, not the empty state, when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('boom') });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.queryByText(/Sem recibos/i)).not.toBeInTheDocument();
  });

  test('shows empty state when there are no rows', () => {
    useApiQuery.mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false, error: null,
    });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText(/Sem recibos/i)).toBeInTheDocument();
  });

  test('renders a row and calls onSelect on click', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    const onSelect = vi.fn();
    render(<PayslipListView onSelect={onSelect} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  test('status filter change refetches with the chosen status', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'ISSUED' } });
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(lastCall[2].params).toMatchObject({ status: 'ISSUED' });
  });

  test('"Emitir" appears only on DRAFT rows and runs confirm + mutation', async () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Emitir' }));
    await waitFor(() => expect(confirm).toHaveBeenCalled());
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/payslips/1/issue'));
  });

  test('no "Emitir" button when the row is already ISSUED', () => {
    useApiQuery.mockReturnValue({
      data: { ...page, data: [{ ...row, status: 'ISSUED' }] },
      isLoading: false, error: null,
    });
    render(<PayslipListView onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Emitir' })).not.toBeInTheDocument();
  });
});
