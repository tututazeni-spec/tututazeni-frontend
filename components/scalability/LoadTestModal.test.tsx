import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const notify = vi.fn();
const post = vi.fn();

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
  return { apiClient: { post: (...a: unknown[]) => post(...a) }, ApiError };
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

import { LoadTestModal } from './LoadTestModal';

beforeEach(() => {
  notify.mockReset();
  post.mockReset();
  post.mockResolvedValue({ message: 'Teste de carga agendado.' });
});

describe('LoadTestModal', () => {
  test('submete com os valores por omissão — POST real e toast com a resposta do backend', async () => {
    const onClose = vi.fn();
    render(<LoadTestModal onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/api/courses' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agendar teste' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/scalability/load-test', {
      concurrentUsers: 100,
      durationSeconds: 300,
      rampUpSeconds: undefined,
      targetEndpoint: '/api/courses',
    });

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'success', title: 'Teste de carga agendado.' }),
      ),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('erro do backend — toast de erro e modal continua aberto', async () => {
    post.mockRejectedValue(new Error('boom'));
    const onClose = vi.fn();
    render(<LoadTestModal onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agendar teste' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test('rejeita utilizadores simultâneos fora dos limites (1–10000)', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Utilizadores simultâneos *'), {
      target: { value: '99999' },
    });

    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Agendar teste' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('rejeita duração abaixo de 30s', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Duração (segundos) *'), {
      target: { value: '10' },
    });
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });

  test('endpoint alvo em falta — botão desactivado', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });

  test('rampa opcional inválida bloqueia a submissão', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Rampa de subida (segundos)'), {
      target: { value: '-5' },
    });
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });
});
