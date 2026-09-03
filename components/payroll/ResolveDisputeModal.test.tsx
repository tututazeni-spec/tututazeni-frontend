import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const patch = vi.fn().mockResolvedValue({ id: 11, status: 'RESOLVED' });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { patch: (...a: unknown[]) => patch(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));

import { ResolveDisputeModal } from './ResolveDisputeModal';

beforeEach(() => { patch.mockClear(); notify.mockClear(); });

describe('ResolveDisputeModal', () => {
  test('confirm is disabled until resolution has text', () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    const btn = screen.getByRole('button', { name: 'Resolver disputa' });
    expect(btn).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido' } });
    expect(btn).toBeEnabled();
  });

  test('reissue defaults to false and is only sent when checked', async () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0]).toEqual([
      '/payslips/disputes/11/resolve',
      { resolution: 'Corrigido', reissue: false },
    ]);
  });

  test('reissue true is sent when the checkbox is ticked', async () => {
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'Corrigido e reemitido' } });
    fireEvent.click(screen.getByLabelText(/Reemitir recibo/i));
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch.mock.calls[0][1]).toEqual({ resolution: 'Corrigido e reemitido', reissue: true });
  });

  test('409 shows an error toast', async () => {
    patch.mockRejectedValueOnce(Object.assign(new Error('Disputa já resolvida'), { status: 409 }));
    render(<ResolveDisputeModal disputeId={11} payslipId={3} onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Resolução/i), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Resolver disputa' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })));
  });
});
