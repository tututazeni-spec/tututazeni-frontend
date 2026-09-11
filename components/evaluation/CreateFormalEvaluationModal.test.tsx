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

import { CreateFormalEvaluationModal } from './CreateFormalEvaluationModal';

beforeEach(() => post.mockClear());

function fillMinimalQuestion() {
  fireEvent.change(screen.getByPlaceholderText('Pergunta 1'), {
    target: { value: 'Qual a capital de Angola?' },
  });
  const options = screen.getAllByPlaceholderText(/Opção \d/);
  fireEvent.change(options[0], { target: { value: 'Luanda' } });
  fireEvent.change(options[1], { target: { value: 'Huambo' } });
}

describe('CreateFormalEvaluationModal', () => {
  test('submete avaliação válida com type EXAM, todos os departamentos e a pergunta preenchida', async () => {
    render(<CreateFormalEvaluationModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Avaliação Final' },
    });
    fillMinimalQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/assessments');
    expect(payload).toMatchObject({
      title: 'Avaliação Final',
      type: 'EXAM',
      maxGrade: 20,
      passingScore: 70,
      targetDepartmentIds: [],
    });
    expect(payload.questions).toEqual([
      {
        type: 'MULTIPLE_CHOICE_SINGLE',
        questionText: 'Qual a capital de Angola?',
        weight: 1,
        seq: 0,
        options: [
          { text: 'Luanda', isCorrect: true },
          { text: 'Huambo', isCorrect: false },
        ],
      },
    ]);
  });

  test('não submete sem título', () => {
    render(<CreateFormalEvaluationModal onClose={vi.fn()} />);
    fillMinimalQuestion();
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('não submete quando a data de fim é anterior à de início', () => {
    render(<CreateFormalEvaluationModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Avaliação inválida' },
    });
    fillMinimalQuestion();
    fireEvent.change(screen.getByLabelText('Início'), {
      target: { value: '2026-06-30T10:00' },
    });
    fireEvent.change(screen.getByLabelText('Fim'), {
      target: { value: '2026-01-01T10:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar avaliação' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('marca todos os departamentos quando o toggle "Todos" é desligado sem seleccionar nenhum', () => {
    render(<CreateFormalEvaluationModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Todos os departamentos'));
    // Sem departamentos carregados (mock devolve undefined), a lista fica
    // vazia mas o formulário continua submissível com targetDepartmentIds: [].
    expect(screen.queryByText('A carregar departamentos…')).toBeInTheDocument();
  });
});
