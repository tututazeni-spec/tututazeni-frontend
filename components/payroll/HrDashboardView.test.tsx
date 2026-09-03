import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const useApiQuery = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: (...a: unknown[]) => useApiQuery(...a) }));

import { HrDashboardView } from './HrDashboardView';

const dash = {
  period: '2026-06',
  counts: { total: 10, issued: 6, acknowledged: 3, disputed: 1, notViewed: 3, draft: 0 },
  financials: { totalGross: 2500000, totalNet: 1800000, totalIRT: 400000,
    totalINSSEmployee: 75000, totalINSSEmployer: 200000, avgNet: 180000 },
  compliance: { viewRate: '30.0%', pendingAcknowledgement: 3 },
};

beforeEach(() => useApiQuery.mockReset());

describe('HrDashboardView', () => {
  test('renders the three card groups', () => {
    useApiQuery.mockReturnValue({ data: dash, isLoading: false, error: null });
    render(<HrDashboardView />);
    expect(screen.getByText(/Emitidos/i)).toBeInTheDocument();
    expect(screen.getByText(/Líquido total/i)).toBeInTheDocument();
    expect(screen.getByText(/Taxa de confirmação/i)).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  test('shows an error message when the fetch fails', () => {
    useApiQuery.mockReturnValue({ data: undefined, isLoading: false, error: new Error('down') });
    render(<HrDashboardView />);
    expect(screen.getByText('down')).toBeInTheDocument();
  });

  test('changing the period refetches with the chosen period', () => {
    useApiQuery.mockReturnValue({ data: dash, isLoading: false, error: null });
    render(<HrDashboardView />);
    fireEvent.change(screen.getByPlaceholderText(/AAAA-MM/i), { target: { value: '2026-05' } });
    const last = useApiQuery.mock.calls.at(-1)!;
    expect(last[2].params).toEqual({ period: '2026-05' });
  });
});
