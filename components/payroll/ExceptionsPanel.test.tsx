import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (...a: unknown[]) => useApiQuery(...a),
}));

import { ExceptionsPanel } from './ExceptionsPanel';

const exceptions = [
  {
    payslipId: 5,
    userId: 7,
    fullName: 'Ana Silva',
    code: 'NET_BELOW_MINIMUM_WAGE',
    severity: 'WARNING',
    message: 'Líquido abaixo do salário mínimo.',
  },
  {
    payslipId: 6,
    userId: 8,
    fullName: 'Rui Costa',
    code: 'ZERO_BASE_SALARY',
    severity: 'ERROR',
    message: 'Salário-base é 0.',
  },
];

beforeEach(() => {
  queryResult = { data: exceptions, isLoading: false };
  useApiQuery.mockClear();
});

describe('ExceptionsPanel', () => {
  test('renders ERROR before WARNING, each with its count', () => {
    render(<ExceptionsPanel runId={9} />);
    const headings = screen
      .getAllByRole('heading', { level: 4 })
      .map((h) => h.textContent);
    expect(headings.join(' ')).toMatch(/Erros[\s\S]*Avisos/);
    expect(screen.getByText(/Erros \(1\)/)).toBeInTheDocument();
    expect(screen.getByText(/Avisos \(1\)/)).toBeInTheDocument();
  });

  test('renders the message and collaborator for each exception', () => {
    render(<ExceptionsPanel runId={9} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(
      screen.getByText('Líquido abaixo do salário mínimo.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Rui Costa')).toBeInTheDocument();
    expect(screen.getByText('Salário-base é 0.')).toBeInTheDocument();
  });

  test('empty list shows "Sem exceções"', () => {
    queryResult = { data: [], isLoading: false };
    render(<ExceptionsPanel runId={9} />);
    expect(screen.getByText(/Sem exceções/i)).toBeInTheDocument();
  });

  test('clicking a row calls onSelectException with the payslipId', () => {
    const onSelectException = vi.fn();
    render(<ExceptionsPanel runId={9} onSelectException={onSelectException} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    expect(onSelectException).toHaveBeenCalledWith(5);
  });

  test('fetch error renders the error message and not "Sem exceções"', () => {
    queryResult = {
      data: undefined,
      isLoading: false,
      error: { message: 'Falha ao carregar' },
    };
    render(<ExceptionsPanel runId={9} />);
    expect(screen.getByText('Falha ao carregar')).toBeInTheDocument();
    expect(screen.queryByText(/Sem exceções/i)).not.toBeInTheDocument();
  });
});
