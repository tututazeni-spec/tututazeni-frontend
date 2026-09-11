import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: undefined, isLoading: false }),
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
  ModalContent: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));
vi.mock('@/components/ui/Select', () => ({
  Select: () => <div data-testid="select" />,
}));

import { CreatePerformanceCycleModal } from './CreatePerformanceCycleModal';

beforeEach(() => post.mockClear());

function fillRequired() {
  fireEvent.change(screen.getByLabelText('Nome *'), {
    target: { value: 'Avaliação Anual 2026' },
  });
  fireEvent.change(screen.getByLabelText('Início *'), { target: { value: '2026-01-01' } });
  fireEvent.change(screen.getByLabelText('Fim *'), { target: { value: '2026-12-31' } });
}

describe('CreatePerformanceCycleModal', () => {
  test('submete um ciclo válido com todos os departamentos e pesos por omissão (40/40/20)', async () => {
    render(<CreatePerformanceCycleModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/performance/cycles');
    expect(payload).toMatchObject({
      name: 'Avaliação Anual 2026',
      type: 'ANNUAL',
      targetDepartmentIds: [],
      goalsWeight: 40,
      competenciesWeight: 40,
      behaviorsWeight: 20,
      scoreScale: 5,
      selfBeforeManager: true,
      anonymous360: true,
    });
    expect(payload.rules).toMatchObject({
      allowSelfEvaluation: true,
      allowManagerEvaluation: true,
      allowRhEvaluation: false,
      calibrationEnabled: true,
      pdiEnabled: true,
      feedbackMeetingEnabled: true,
      allowDispute: true,
      requireAcceptance: false,
    });
  });

  test('não submete sem nome', () => {
    render(<CreatePerformanceCycleModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Início *'), { target: { value: '2026-01-01' } });
    fireEvent.change(screen.getByLabelText('Fim *'), { target: { value: '2026-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('não submete quando a data de fim é anterior à de início', () => {
    render(<CreatePerformanceCycleModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), { target: { value: 'Ciclo inválido' } });
    fireEvent.change(screen.getByLabelText('Início *'), { target: { value: '2026-06-30' } });
    fireEvent.change(screen.getByLabelText('Fim *'), { target: { value: '2026-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('não submete quando os pesos não somam 100%', () => {
    render(<CreatePerformanceCycleModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.change(screen.getByLabelText('Objectivos/KPIs (%)'), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));
    expect(screen.getByText(/a soma dos pesos tem de ser 100%/)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  test('departamento específico envia apenas os IDs seleccionados', async () => {
    render(<CreatePerformanceCycleModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByLabelText('Todos os departamentos'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    // Sem departamentos carregados (mock devolve undefined), a lista fica
    // vazia mas o formulário continua submissível com targetDepartmentIds: [].
    expect(payload.targetDepartmentIds).toEqual([]);
  });
});
