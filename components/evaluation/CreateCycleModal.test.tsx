import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
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

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

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
  Select: () => <div data-testid="select" />,
}));

import { CreateCycleModal } from './CreateCycleModal';

beforeEach(() => post.mockClear());

function fillValid() {
  fireEvent.change(screen.getByLabelText('Nome *'), {
    target: { value: 'Ciclo 2026 S1' },
  });
  fireEvent.change(screen.getByLabelText('Início *'), {
    target: { value: '2026-01-01' },
  });
  fireEvent.change(screen.getByLabelText('Fim *'), {
    target: { value: '2026-06-30' },
  });
}

describe('CreateCycleModal', () => {
  test('submete com pesos-semente (somam 100) — payload completo', async () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/evaluations/cycles', {
      name: 'Ciclo 2026 S1',
      model: '360',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      selfEvalIncludedInScore: true,
      weights: [
        { type: 'SELF', weight: 10 },
        { type: 'MANAGER', weight: 40 },
        { type: 'PEER', weight: 30 },
        { type: 'SUBORDINATE', weight: 15 },
        { type: 'CLIENT', weight: 5 },
      ],
    });
  });

  test('linhas de peso a 0 são omitidas do payload', async () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    // Zera CLIENT (5) e passa PEER 30 -> 35 para a soma continuar 100.
    fireEvent.change(screen.getByLabelText('Cliente'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByLabelText('Par'), {
      target: { value: '35' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0] as [string, { weights: unknown[] }];
    expect(payload.weights).toEqual([
      { type: 'SELF', weight: 10 },
      { type: 'MANAGER', weight: 40 },
      { type: 'PEER', weight: 35 },
      { type: 'SUBORDINATE', weight: 15 },
    ]);
  });

  test('não submete quando os pesos não somam 100', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    fireEvent.change(screen.getByLabelText('Autoavaliação'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/somar 100/)).toBeInTheDocument();
  });

  test('não submete sem nome', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('não submete quando a data de fim é anterior à de início', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Ciclo inválido' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));
    expect(post).not.toHaveBeenCalled();
  });
});
