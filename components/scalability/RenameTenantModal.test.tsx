import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const notify = vi.fn();
const patch = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/lib/apiClient', () => {
  class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { apiClient: { patch: (...a: unknown[]) => patch(...a) }, ApiError };
});

vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (
      v: unknown,
      opts?: { onSuccess?: (d: unknown) => void; onError?: (e: unknown) => void },
    ) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));

vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ModalContent: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));

import { RenameTenantModal } from './RenameTenantModal';

beforeEach(() => {
  notify.mockReset();
  patch.mockReset();
  patch.mockResolvedValue({});
});

describe('RenameTenantModal', () => {
  test('guarda o novo nome (trim) via PATCH real e fecha', async () => {
    const onClose = vi.fn();
    render(
      <RenameTenantModal
        tenantId="tenant-1"
        currentName="Sonangol EP"
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: '  Sonangol Holding  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(patch).toHaveBeenCalledTimes(1));
    expect(patch).toHaveBeenCalledWith('/scalability/tenants/tenant-1', {
      tenantName: 'Sonangol Holding',
    });
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'success' })),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('erro do backend — toast de erro e modal continua aberto', async () => {
    patch.mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(
      <RenameTenantModal
        tenantId="tenant-1"
        currentName="Sonangol EP"
        onClose={onClose}
      />,
    );

    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: 'Sonangol Holding' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test('botão desactivado quando o nome está vazio', () => {
    render(
      <RenameTenantModal
        tenantId="tenant-1"
        currentName="Sonangol EP"
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('Nome da empresa *'), {
      target: { value: '   ' },
    });
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });

  test('botão desactivado quando o nome não muda', () => {
    render(
      <RenameTenantModal
        tenantId="tenant-1"
        currentName="Sonangol EP"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled();
  });
});
