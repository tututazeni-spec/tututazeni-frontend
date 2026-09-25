import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: '1' });
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
  // Picker de competências específicas (só busca o catálogo quando o
  // toggle "Escolher competências específicas" está ligado); os testes
  // existentes cobrem o caminho por omissão (8 competências-padrão do
  // backend), por isso nunca precisam de dados aqui.
  useApiQuery: () => ({ data: undefined, isLoading: false }),
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

vi.mock('./cycleData', () => ({
  useDepartmentOptions: () => ({
    options: [{ value: '5', label: 'Operações' }],
    loading: false,
  }),
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
  fireEvent.click(screen.getByLabelText('Operações'));
}

describe('CreateCycleModal (evaluation360)', () => {
  test('cria o ciclo, adiciona participantes por departamento e distribui — 3 chamadas em sequência', async () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(3));
    expect(post).toHaveBeenNthCalledWith(1, '/evaluation360/cycles', {
      tenantId: 'default',
      name: 'Ciclo 2026 S1',
      model: 'DEG_360',
      type: 'SEMESTRAL',
      startDate: '2026-01-01',
      endDate: '2026-06-30',
      weightSelf: 10,
      weightManager: 30,
      weightPeer: 20,
      weightSubordinate: 40,
      weightExternal: 0,
      anonymityMode: 'ANONYMOUS',
      quorumMinimum: 3,
      gracePeriodDays: 3,
      linkedToPdi: true,
      linkedToBonus: false,
      linkedToOkrs: false,
    });
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/evaluation360/cycles/1/participants/by-department',
      { departmentIds: ['5'] },
    );
    expect(post).toHaveBeenNthCalledWith(3, '/evaluation360/cycles/1/distribute');
  });

  test('não submete sem departamento seleccionado', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Ciclo 2026 S1' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/pelo menos um departamento/)).toBeInTheDocument();
  });

  test('não submete quando os pesos não somam 100', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    fireEvent.change(screen.getByLabelText('Autoavaliação'), {
      target: { value: '50' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));
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
    fireEvent.click(screen.getByLabelText('Operações'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));
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
    fireEvent.click(screen.getByLabelText('Operações'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('não submete com "competências específicas" ligado mas nenhuma escolhida', () => {
    render(<CreateCycleModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fillValid();
    fireEvent.click(screen.getByLabelText('Escolher competências específicas do catálogo'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar e Distribuir' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/Escolhe pelo menos uma competência/)).toBeInTheDocument();
  });
});
