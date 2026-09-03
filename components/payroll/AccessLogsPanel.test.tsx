import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));

import { AccessLogsPanel } from './AccessLogsPanel';

beforeEach(() => useApiQuery.mockReset());

describe('AccessLogsPanel', () => {
  test('renders rows with viewer name, action label and IP', () => {
    useApiQuery.mockReturnValue({
      data: [
        { id: 1, payslipId: 3, userId: 9, action: 'ADMIN_VIEW', ipAddress: '10.0.0.2',
          accessedAt: '2026-06-26T10:00:00Z', user: { id: 9, fullName: 'RH User' } },
      ],
      isLoading: false, error: null,
    });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText('RH User')).toBeInTheDocument();
    expect(screen.getByText(/Visualização \(admin\)/i)).toBeInTheDocument();
    expect(screen.getByText('10.0.0.2')).toBeInTheDocument();
  });

  test('shows an error message, not "sem acessos", when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('nope') });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText('nope')).toBeInTheDocument();
    expect(screen.queryByText(/Sem acessos/i)).not.toBeInTheDocument();
  });

  test('shows empty text when there are no logs', () => {
    useApiQuery.mockReturnValue({ data: [], isLoading: false, error: null });
    render(<AccessLogsPanel payslipId={3} />);
    expect(screen.getByText(/Sem acessos registados/i)).toBeInTheDocument();
  });
});
