// components/payroll/RunListView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
}));
vi.mock('@tanstack/react-query', () => ({ keepPreviousData: Symbol('kpd') }));
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
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({ page, totalPages, onPageChange }: any) => (
    <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>
      {`${page}/${totalPages}`}
    </button>
  ),
}));
vi.mock('./CreateRunModal', () => ({
  CreateRunModal: ({ onCreated }: any) => (
    <button data-testid="create-modal" onClick={() => onCreated(99)}>
      mock-create
    </button>
  ),
}));

import { RunListView } from './RunListView';

const page1 = {
  data: [
    {
      id: 7,
      period: '2026-09',
      payGroup: 'Mensais',
      countryCode: 'AO',
      status: 'SIMULATED',
      employeeCount: 120,
      totalNet: 45000000,
      exceptionsCount: 3,
      errorCount: 1,
      createdAt: '2026-09-01T10:00:00.000Z',
    },
  ],
  meta: { total: 1, page: 1, limit: 20, totalPages: 2 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
  useApiQuery.mockClear();
});

describe('RunListView', () => {
  test('renders a row with period, payGroup, status, employeeCount, totalNet, exceptions', () => {
    render(<RunListView onSelect={vi.fn()} />);
    expect(screen.getByText('2026-09')).toBeInTheDocument();
    expect(screen.getByText('Mensais')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText(/45.?000.?000/)).toBeInTheDocument();
  });

  test('status filter feeds the query params', () => {
    render(<RunListView onSelect={vi.fn()} />);
    fireEvent.change(screen.getByTestId('status-select'), {
      target: { value: 'APPROVED' },
    });
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('"status":"APPROVED"');
  });

  test('row click calls onSelect with the run id', () => {
    const onSelect = vi.fn();
    render(<RunListView onSelect={onSelect} />);
    fireEvent.click(screen.getByText('2026-09'));
    expect(onSelect).toHaveBeenCalledWith(7);
  });

  test('pagination advances the page param', () => {
    render(<RunListView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByTestId('next-page'));
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('"page":2');
  });

  test('empty list shows the EmptyState', () => {
    queryResult = {
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
    };
    render(<RunListView onSelect={vi.fn()} />);
    expect(screen.getByText(/Nenhum run encontrado/i)).toBeInTheDocument();
  });

  test('"+ Novo run" opens CreateRunModal; onCreated calls onSelect', () => {
    const onSelect = vi.fn();
    render(<RunListView onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo run' }));
    fireEvent.click(screen.getByTestId('create-modal'));
    expect(onSelect).toHaveBeenCalledWith(99);
  });
});
