import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const notify = vi.fn();
const post = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/lib/apiClient', () => {
  // Mesma assinatura do ApiError real (status primeiro) — ver
  // components/onboarding/AssignPlanModal.test.tsx para o mesmo padrão.
  class ApiError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  return { apiClient: { post: (...a: unknown[]) => post(...a) }, ApiError };
});

// Mesma assinatura real: mutate(vars, { onSuccess, onError }) — ver
// components/onboarding/AssignPlanModal.test.tsx para o mesmo padrão.
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

import { ImportUsersModal } from './ImportUsersModal';

function upload(csv: string, name = 'users.csv') {
  const file = new File([csv], name, { type: 'text/csv' });
  const input = screen.getByLabelText('Ficheiro CSV') as HTMLInputElement;
  fireEvent.change(input, { target: { files: [file] } });
}

beforeEach(() => {
  notify.mockReset();
  post.mockReset();
});

describe('ImportUsersModal', () => {
  test('ficheiro válido — pré-visualização e POST real com tenantId', async () => {
    post.mockResolvedValue({ total: 2, created: 2, updated: 0, skipped: 0, failed: 0, errors: [] });
    const onClose = vi.fn();
    render(<ImportUsersModal tenantId="tenant-1" onClose={onClose} />);

    upload('name,email\nAna,ana@x.com\nBeto,beto@x.com\nSemMail,,');

    await screen.findByText(/2 v[aá]lidas/i);

    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [path, body] = post.mock.calls[0];
    expect(path).toBe('/scalability/users/bulk-import');
    expect(body).toMatchObject({ tenantId: 'tenant-1', format: 'CSV' });
    expect(typeof body.payload).toBe('string');

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'success' })),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('falhas parciais — mostra aviso em vez de sucesso', async () => {
    post.mockResolvedValue({ total: 2, created: 1, updated: 0, skipped: 0, failed: 1, errors: [{ row: 2, reason: 'Email inválido' }] });
    render(<ImportUsersModal tenantId="tenant-1" onClose={vi.fn()} />);

    upload('email\na@x.com\nb@x.com');
    await screen.findByText(/2 v[aá]lidas/i);
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'info' })),
    );
  });

  test('erro de rede — mostra toast de erro e não fecha o modal', async () => {
    post.mockRejectedValue(new Error('network down'));
    const onClose = vi.fn();
    render(<ImportUsersModal tenantId="tenant-1" onClose={onClose} />);

    upload('email\na@x.com');
    await screen.findByText(/1 v[aá]lida/i);
    fireEvent.click(screen.getByRole('button', { name: 'Importar' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test('ficheiro sem coluna email — erro e botão desactivado', async () => {
    render(<ImportUsersModal tenantId="tenant-1" onClose={vi.fn()} />);

    upload('nome,departamento\nAna,RH');

    await screen.findByText(/coluna 'email'/i);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
    expect(post).not.toHaveBeenCalled();
  });

  test('sem ficheiro escolhido — botão Importar desactivado', () => {
    render(<ImportUsersModal tenantId="tenant-1" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });

  test('ficheiro só com cabeçalho — erro, sem importação possível', async () => {
    render(<ImportUsersModal tenantId="tenant-1" onClose={vi.fn()} />);

    upload('name,email');
    await screen.findByText(/Nenhuma linha de dados/i);
    expect(screen.getByRole('button', { name: 'Importar' })).toBeDisabled();
  });
});
