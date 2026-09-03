// components/payroll/RunDetailView.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
const useApiQuery = vi.fn((..._a: unknown[]) => queryResult);
const post = vi.fn().mockResolvedValue({});
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
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('./RunPayslipsTable', () => ({
  RunPayslipsTable: ({ runStatus }: any) => (
    <div data-testid="payslips-table">{runStatus}</div>
  ),
}));
vi.mock('./ExceptionsPanel', () => ({
  ExceptionsPanel: () => <div data-testid="exceptions-panel" />,
}));

import { RunDetailView } from './RunDetailView';

function makeRun(overrides: Record<string, unknown>) {
  return {
    id: 9,
    period: '2026-09',
    payGroup: 'Mensais',
    countryCode: 'AO',
    status: 'DRAFT',
    notes: null,
    taxYear: 2026,
    employeeCount: 100,
    exceptionsCount: 0,
    errorCount: 0,
    totalGross: 50000000,
    totalNet: 40000000,
    totalDeductions: 8000000,
    totalEmployerCost: 4000000,
    createdAt: '2026-09-01T08:00:00.000Z',
    createdById: 1,
    processedAt: null,
    processedById: null,
    submittedAt: null,
    submittedById: null,
    approvedAt: null,
    approvedById: null,
    publishedAt: null,
    publishedById: null,
    rejectionReason: null,
    cancellationReason: null,
    timeline: [
      {
        step: 'created',
        at: '2026-09-01T08:00:00.000Z',
        by: { id: 1, fullName: 'Rita RH' },
      },
      { step: 'processed', at: null, by: null },
      { step: 'submitted', at: null, by: null },
      { step: 'approved', at: null, by: null },
      { step: 'published', at: null, by: null },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  useApiQuery.mockClear();
  post.mockClear();
  confirm.mockClear();
  confirm.mockResolvedValue(true);
  notify.mockClear();
});

describe('RunDetailView — action visibility per status', () => {
  test('DRAFT shows only "Processar"', () => {
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Processar' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Submeter' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Aprovar' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Publicar' }),
    ).not.toBeInTheDocument();
  });

  test('SIMULATED with no errors shows Reprocessar/Submeter(enabled)/Cancelar', () => {
    queryResult = {
      data: makeRun({ status: 'SIMULATED', errorCount: 0 }),
      isLoading: false,
    };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Reprocessar' }),
    ).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Submeter' });
    expect(submit).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Cancelar' }),
    ).toBeInTheDocument();
  });

  test('SIMULATED with errorCount>0 disables Submeter and shows the backend warning text', () => {
    queryResult = {
      data: makeRun({ status: 'SIMULATED', errorCount: 2 }),
      isLoading: false,
    };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Submeter' })).toBeDisabled();
    expect(
      screen.getByText(
        'Run tem 2 exceção(ões) de erro — resolver antes de submeter.',
      ),
    ).toBeInTheDocument();
  });

  test('PENDING_APPROVAL shows Aprovar/Rejeitar/Cancelar; Rejeitar opens the reason panel', async () => {
    queryResult = {
      data: makeRun({ status: 'PENDING_APPROVAL' }),
      isLoading: false,
    };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Aprovar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Rejeitar' }));
    const confirmReject = screen.getByRole('button', {
      name: 'Confirmar rejeição',
    });
    expect(confirmReject).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Motivo/i), {
      target: { value: 'Valores incorrectos' },
    });
    expect(confirmReject).toBeEnabled();
    fireEvent.click(confirmReject);
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/payroll/runs/9/reject', {
      reason: 'Valores incorrectos',
    });
  });

  test('APPROVED shows Publicar/Cancelar; Publicar asks for confirmation before POSTing', async () => {
    queryResult = { data: makeRun({ status: 'APPROVED' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/payroll/runs/9/publish', {}),
    );
  });

  test('a declined confirm does not POST', async () => {
    confirm.mockResolvedValueOnce(false);
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Processar' }));
    await waitFor(() => expect(confirm).toHaveBeenCalledTimes(1));
    expect(post).not.toHaveBeenCalled();
  });

  test('PUBLISHED and CANCELLED show no action buttons', () => {
    queryResult = { data: makeRun({ status: 'PUBLISHED' }), isLoading: false };
    const { rerender } = render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(
      screen.queryByRole('button', {
        name: /Processar|Submeter|Aprovar|Publicar|Cancelar/,
      }),
    ).not.toBeInTheDocument();

    queryResult = { data: makeRun({ status: 'CANCELLED' }), isLoading: false };
    rerender(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(
      screen.queryByRole('button', {
        name: /Processar|Submeter|Aprovar|Publicar|Cancelar/,
      }),
    ).not.toBeInTheDocument();
  });

  test('renders the timeline with dates and actor names', () => {
    queryResult = { data: makeRun({ status: 'DRAFT' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByText('Rita RH')).toBeInTheDocument();
  });

  test('passes run.status through to RunPayslipsTable', () => {
    queryResult = { data: makeRun({ status: 'SIMULATED' }), isLoading: false };
    render(<RunDetailView runId={9} onBack={vi.fn()} />);
    expect(screen.getByTestId('payslips-table')).toHaveTextContent('SIMULATED');
  });
});
