// components/payroll/CreateRunModal.test.tsx
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 42, period: '2026-09' });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { CreateRunModal } from './CreateRunModal';

beforeEach(() => {
  post.mockClear();
  notify.mockClear();
});

describe('CreateRunModal', () => {
  test('period is required — submit does not POST with it blank', () => {
    render(<CreateRunModal onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('submits period + payGroup + countryCode + notes and calls onCreated with the new id', async () => {
    const onCreated = vi.fn();
    render(<CreateRunModal onClose={vi.fn()} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText(/Período/i), {
      target: { value: '2026-09' },
    });
    fireEvent.change(screen.getByLabelText(/Grupo/i), {
      target: { value: 'Mensais' },
    });
    fireEvent.change(screen.getByLabelText(/País/i), {
      target: { value: 'AO' },
    });
    fireEvent.change(screen.getByLabelText(/Notas/i), {
      target: { value: 'Folha de Setembro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/payroll/runs',
      expect.objectContaining({
        period: '2026-09',
        payGroup: 'Mensais',
        countryCode: 'AO',
        notes: 'Folha de Setembro',
      }),
    );
    expect(onCreated).toHaveBeenCalledWith(42);
  });

  test('Cancelar calls onClose without posting', () => {
    const onClose = vi.fn();
    render(<CreateRunModal onClose={onClose} onCreated={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
    expect(post).not.toHaveBeenCalled();
  });
});
