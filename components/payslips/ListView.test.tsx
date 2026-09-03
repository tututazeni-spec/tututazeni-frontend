import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

let queryResult: {
  data: unknown;
  isLoading: boolean;
  error?: { message: string };
} = { data: undefined, isLoading: false };

vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: () => queryResult }));
vi.mock('@/lib/apiClient', () => ({ API_URL: 'http://api.test' }));
vi.mock('@/components/ui/Select', () => ({
  Select: ({ items, value, onValueChange }: any) => (
    <select
      data-testid="year"
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

import { ListView } from './ListView';

const row = {
  id: 1,
  receiptCode: 'RC-1',
  period: '2026-04',
  paymentDate: '2026-04-25',
  netSalary: 1000,
  grossSalary: 1200,
  status: 'ISSUED' as const,
};

const envelope = (total: number, totalPages: number) => ({
  data: [row],
  meta: { total, page: 1, limit: 12, totalPages },
});

beforeEach(() => {
  queryResult = { data: envelope(1, 1), isLoading: false };
  vi.spyOn(window, 'open').mockImplementation(() => null);
});

describe('ListView (os meus recibos)', () => {
  test('reads the receipt count from the { data, meta } envelope', () => {
    queryResult = { data: envelope(37, 4), isLoading: false };
    render(<ListView onSelect={() => {}} />);
    expect(screen.getByText('37 recibos')).toBeInTheDocument();
  });

  test('shows the paginator when meta.totalPages > 1', () => {
    queryResult = { data: envelope(37, 4), isLoading: false };
    render(<ListView onSelect={() => {}} />);
    expect(screen.getByText('Página 1 de 4')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Próxima/ }),
    ).toBeInTheDocument();
  });

  test('hides the paginator on a single page', () => {
    render(<ListView onSelect={() => {}} />);
    expect(screen.queryByText(/Página 1 de/)).not.toBeInTheDocument();
  });
});
