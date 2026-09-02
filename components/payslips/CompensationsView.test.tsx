import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
}));
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }));
vi.mock('@tanstack/react-query', () => ({ keepPreviousData: Symbol('kpd') }));
vi.mock('./CompensationFormModal', () => ({
  CompensationFormModal: ({ mode, userId }: any) => (
    <div data-testid="form-modal">{`${mode}:${userId ?? 'none'}`}</div>
  ),
}));
vi.mock('@/components/ui/Pagination', () => ({
  Pagination: ({ page, totalPages, onPageChange }: any) => (
    <button data-testid="next-page" onClick={() => onPageChange(page + 1)}>
      {`${page}/${totalPages}`}
    </button>
  ),
}));

import { CompensationsView } from './CompensationsView';

const page1 = {
  data: [
    {
      id: 1,
      userId: 7,
      baseSalary: 150000,
      countryCode: 'AO',
      foodAllowance: 20000,
      transportAllowance: 15000,
      effectiveFrom: '2026-06-01T00:00:00.000Z',
      effectiveTo: null,
      user: {
        id: 7,
        fullName: 'Ana Silva',
        employeeNumber: 'E-7',
        department: { id: 2, name: 'Financeiro' },
      },
      _count: { components: 3 },
    },
  ],
  meta: { total: 1, page: 1, limit: 20, totalPages: 2 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
  useApiQuery.mockClear();
});

describe('CompensationsView', () => {
  test('renders a row with name, employeeNumber, dept, base salary, effectiveFrom, #components', () => {
    render(<CompensationsView onOpenDetail={vi.fn()} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('E-7')).toBeInTheDocument();
    expect(screen.getByText('Financeiro')).toBeInTheDocument();
    expect(screen.getByText(/150.?000/)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('typing in the search box feeds the query params', () => {
    render(<CompensationsView onOpenDetail={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar/i), {
      target: { value: 'ana' },
    });
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('ana');
  });

  test('row click calls onOpenDetail with the userId', () => {
    const onOpenDetail = vi.fn();
    render(<CompensationsView onOpenDetail={onOpenDetail} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(onOpenDetail).toHaveBeenCalledWith(7);
  });

  test('pagination advances the page param', () => {
    render(<CompensationsView onOpenDetail={vi.fn()} />);
    fireEvent.click(screen.getByTestId('next-page'));
    const lastCall = useApiQuery.mock.calls.at(-1)!;
    expect(JSON.stringify(lastCall)).toContain('"page":2');
  });

  test('empty list shows the EmptyState', () => {
    queryResult = {
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
    };
    render(<CompensationsView onOpenDetail={vi.fn()} />);
    expect(
      screen.getByText(/Nenhum colaborador com compensação/i),
    ).toBeInTheDocument();
  });

  test('"+ Nova compensação" opens the create modal without a userId', () => {
    render(<CompensationsView onOpenDetail={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova compensação' }));
    expect(screen.getByTestId('form-modal')).toHaveTextContent('create:none');
  });
});
