import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

let lastOnError: ((e: Error) => void) | undefined;
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => {
    lastOnError = opts?.onError;
    return {
      mutate: (v: unknown) =>
        fn(v).then(
          (d) => opts?.onSuccess?.(d, v),
          (e) => opts?.onError?.(e as Error),
        ),
      isPending: false,
    };
  },
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

import { SubmitReviewModal } from './SubmitReviewModal';

beforeEach(() => {
  post.mockClear();
  post.mockResolvedValue({ id: 1 });
  lastOnError = undefined;
});

describe('SubmitReviewModal', () => {
  test('mode="manager" mostra potentialScore + os 6 sub-fatores e envia só os preenchidos', async () => {
    render(
      <SubmitReviewModal
        reviewId={42}
        userName="Ana Silva"
        mode="manager"
        scoreMax={100}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Avaliar — Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('Potencial geral')).toBeInTheDocument();
    expect(screen.getByText('Adaptabilidade')).toBeInTheDocument();
    expect(screen.getByText('Readiness para funções futuras')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pontuação (0–100)'), { target: { value: '85' } });
    // 4ª estrela do "Potencial geral" e a 3ª de "Adaptabilidade" — só estas
    // duas ratings ficam preenchidas, o resto deve sair de fora do payload.
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Potencial geral' })).getByRole('button', {
        name: '4 de 5',
      }),
    );
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Adaptabilidade' })).getByRole('button', {
        name: '3 de 5',
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(url).toBe('/performance/submit');
    expect(payload).toEqual({
      reviewId: 42,
      score: 85,
      potentialScore: 4,
      adaptabilityScore: 3,
    });
  });

  test('mode="self" não mostra a secção de potencial e nunca envia potentialScore/sub-fatores', async () => {
    render(<SubmitReviewModal reviewId={7} mode="self" scoreMax={100} onClose={vi.fn()} />);

    expect(screen.getByText('Completar autoavaliação')).toBeInTheDocument();
    expect(screen.queryByText('Potencial geral')).not.toBeInTheDocument();
    expect(screen.queryByText('Eixo Potencial (matriz 9-box)')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Feedback'), {
      target: { value: 'Correu bem este ciclo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).toEqual({ reviewId: 7, feedback: 'Correu bem este ciclo' });
  });

  test('score/feedback/justificativa em branco não vão no payload', async () => {
    render(<SubmitReviewModal reviewId={9} mode="manager" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [, payload] = post.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).toEqual({ reviewId: 9 });
  });

  test('mostra o erro da API quando a submissão falha', async () => {
    post.mockRejectedValueOnce(new Error('Justificativa obrigatória para scores extremos'));
    render(<SubmitReviewModal reviewId={3} mode="self" onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Submeter' }));

    await waitFor(() =>
      expect(screen.getByText('Justificativa obrigatória para scores extremos')).toBeInTheDocument(),
    );
  });
});
