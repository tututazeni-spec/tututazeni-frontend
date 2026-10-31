import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SubmitEvaluationModal } from './SubmitEvaluationModal';

const post = vi.fn().mockResolvedValue({});
const confirmFn = vi.fn().mockResolvedValue(true);
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirmFn }));
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { id: 1, fullName: 'Ana Gestora' } }),
}));

const questions = [
  { id: 11, text: 'Qualidade do Trabalho', type: 'SCALE', required: true },
  { id: 12, text: 'Comunicação', type: 'NA_ALLOWED', required: true },
];

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string, opts?: { enabled?: boolean }) => {
    if (opts?.enabled === false) return { data: undefined, isLoading: false };
    if (path.startsWith('/evaluations/cycles/'))
      return { data: { form: { id: 9 } }, isLoading: false };
    if (path === '/evaluations/forms/9')
      return { data: { id: 9, title: 'F', questions }, isLoading: false };
    if (path === '/competencies')
      return {
        data: { data: [{ id: 5, name: 'Liderança' }] },
        isLoading: false,
      };
    return { data: undefined, isLoading: false };
  },
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts?: {
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

const renderModal = () =>
  render(
    <SubmitEvaluationModal
      requestId={3}
      cycleId={1}
      evaluatedName="Rui Costa"
      evaluatedId={2}
      onClose={() => {}}
    />,
  );

describe('SubmitEvaluationModal', () => {
  beforeEach(() => {
    post.mockClear();
    confirmFn.mockClear();
  });

  test('mostra os critérios com escala 1–5 e progresso 0%', () => {
    renderModal();
    expect(screen.getAllByRole('radiogroup')).toHaveLength(2);
    expect(screen.getByText(/0\/2 · 0%/)).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /^0 / })).toBeNull();
  });

  test('submissão com critérios em falta é bloqueada e não chama a API', async () => {
    renderModal();
    fireEvent.click(
      screen.getByRole('button', { name: /5\. Rever e submeter/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));
    await waitFor(() =>
      expect(screen.getByText('Há campos por completar')).toBeInTheDocument(),
    );
    expect(post).not.toHaveBeenCalled();
    expect(confirmFn).not.toHaveBeenCalled();
  });

  test('avaliação completa pede confirmação e envia notas e registos estruturados', async () => {
    renderModal();
    fireEvent.click(screen.getAllByRole('radio', { name: /4 — Muito bom/ })[0]);
    fireEvent.click(
      screen.getByLabelText('Não aplicável (fica fora do cálculo)'),
    );
    expect(screen.getByText(/2\/2 · 100%/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /2\. Pontos fortes/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Adicionar ponto forte/ }),
    );
    fireEvent.change(screen.getByLabelText('Competência *'), {
      target: { value: 'Liderança' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /5 — Excelente/ }));
    fireEvent.change(screen.getByLabelText('Descrição *'), {
      target: { value: 'Motiva a equipa' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: /5\. Rever e submeter/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(confirmFn).toHaveBeenCalled();
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/evaluations/submit');
    expect(body).toMatchObject({
      requestId: 3,
      isDraft: false,
      answers: [
        { questionId: 11, score: 4 },
        { questionId: 12, notApplicable: true },
      ],
      strengthItems: [
        {
          competencyId: 5,
          competency: 'Liderança',
          score: 5,
          description: 'Motiva a equipa',
        },
      ],
      improvementItems: [],
      recommendationItems: [],
    });
  });

  test('rascunho segue sem validação completa e só com itens completos', async () => {
    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /2\. Pontos fortes/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Adicionar ponto forte/ }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar rascunho' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][1]).toMatchObject({
      isDraft: true,
      strengthItems: [],
    });
    expect(confirmFn).not.toHaveBeenCalled();
  });
});
