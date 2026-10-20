import { describe, expect, test, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReconcilePathsModal } from './ReconcilePathsModal';

const post = vi.hoisted(() => vi.fn());
vi.mock('@/lib/apiClient', () => ({ apiClient: { post } }));

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

const report = (over = {}) => ({
  dryRun: true,
  checked: 5,
  eligible: 2,
  issued: 0,
  items: [{ userId: 1, learningPathId: 3, outcome: 'SKIPPED' }],
  ...over,
});

describe('ReconcilePathsModal', () => {
  beforeEach(() => post.mockReset());

  test('simula primeiro e só emite depois de confirmar', async () => {
    post
      .mockResolvedValueOnce(report())
      .mockResolvedValueOnce(report({ dryRun: false, issued: 2 }));
    renderWithProviders(<ReconcilePathsModal onClose={() => undefined} />);

    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    expect(await screen.findByText(/seriam emitidos/)).toBeInTheDocument();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0][0]).not.toContain('dryRun=false');

    fireEvent.click(
      screen.getByRole('button', { name: 'Emitir 2 certificados' }),
    );
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2));
    expect(post.mock.calls[1][0]).toContain('dryRun=false');
    expect(
      await screen.findByText(/certificados emitidos/),
    ).toBeInTheDocument();
  });

  test('sem elegíveis não oferece emitir', async () => {
    post.mockResolvedValueOnce(report({ eligible: 0 }));
    renderWithProviders(<ReconcilePathsModal onClose={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: 'Simular' }));
    await screen.findByText(/seriam emitidos/);
    expect(screen.queryByRole('button', { name: /^Emitir/ })).toBeNull();
  });
});
