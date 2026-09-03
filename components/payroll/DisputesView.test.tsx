// components/payroll/DisputesView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));
vi.mock('./ResolveDisputeModal', () => ({ ResolveDisputeModal: () => <div>resolve-modal</div> }));
// components/ui/Select é um listbox Radix custom (não um <select> nativo):
// screen.getByRole('combobox') + fireEvent.change não funciona contra o
// componente real. Mesmo mock que PayslipListView.test.tsx — <select> nativo.
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

import { DisputesView } from './DisputesView';

const row = {
  id: 11, payslipId: 3, userId: 7, reason: 'IRT errado', details: null,
  status: 'OPEN', createdAt: '2026-06-26T00:00:00Z', resolvedAt: null, resolution: null,
  user: { id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' },
  payslip: { id: 3, receiptCode: 'REC-3', period: '2026-06', userId: 7, status: 'DISPUTED' },
};
const page = { data: [row], meta: { total: 1, page: 1, limit: 20, totalPages: 1 } };

beforeEach(() => useApiQuery.mockReset());

describe('DisputesView', () => {
  test('defaults the status filter to OPEN', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toMatchObject({ status: 'OPEN' });
  });

  test('shows an error message, not the empty state, on fetch failure', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('argh') });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    expect(screen.getByText('argh')).toBeInTheDocument();
    expect(screen.queryByText(/Sem disputas/i)).not.toBeInTheDocument();
  });

  test('"Resolver" only shows on OPEN rows', () => {
    useApiQuery.mockReturnValue({
      data: { ...page, data: [{ ...row, status: 'RESOLVED', resolvedAt: '2026-06-27T00:00:00Z', resolution: 'ok' }] },
      isLoading: false, error: null,
    });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Resolver' })).not.toBeInTheDocument();
  });

  test('clicking the receipt calls onOpenPayslip', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    const onOpen = vi.fn();
    render(<DisputesView onOpenPayslip={onOpen} />);
    fireEvent.click(screen.getByText(/REC-3/));
    expect(onOpen).toHaveBeenCalledWith(3);
  });

  test('changing the filter to RESOLVED refetches', () => {
    useApiQuery.mockReturnValue({ data: page, isLoading: false, error: null });
    render(<DisputesView onOpenPayslip={vi.fn()} />);
    fireEvent.change(screen.getByTestId('status-select'), { target: { value: 'RESOLVED' } });
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toMatchObject({ status: 'RESOLVED' });
  });
});
