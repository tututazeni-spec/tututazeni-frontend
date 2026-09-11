import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

const post = vi.fn().mockResolvedValue({ id: 'fb-1' });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: [{ id: 1, name: 'Comunicação' }], isLoading: false }),
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
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

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value }: { value?: string }) => <div data-testid="select">{value}</div>,
}));

import { GiveFeedbackModal } from './GiveFeedbackModal';

beforeEach(() => {
  notify.mockReset();
  post.mockClear();
});

describe('GiveFeedbackModal', () => {
  test('envia feedback real para o backend (POST /evaluation360/feedback/continuous)', async () => {
    const onClose = vi.fn();
    render(<GiveFeedbackModal toUserId="42" onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'Excelente trabalho na apresentação.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }));

    expect(post).toHaveBeenCalledWith('/evaluation360/feedback/continuous', {
      tenantId: 'default',
      toUserId: '42',
      type: 'RECOGNITION',
      message: 'Excelente trabalho na apresentação.',
      competencyId: undefined,
    });
  });

  test('mensagem demasiado curta mantém o botão desactivado', () => {
    render(<GiveFeedbackModal toUserId="42" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Enviar Feedback' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'ok' },
    });
    expect(screen.getByRole('button', { name: 'Enviar Feedback' })).toBeDisabled();
  });
});
