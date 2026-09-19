import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let requestsData: unknown = { data: [] };
let pendingData: unknown[] = [];
let myEvaluationsData: unknown[] = [];
const post = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string, opts?: { enabled?: boolean }) => {
    if (opts?.enabled === false) return { data: undefined, isLoading: false };
    if (path === '/evaluations/requests') return { data: requestsData, isLoading: false };
    if (path === '/evaluations/pending') return { data: pendingData, isLoading: false };
    if (path === '/evaluations/my-evaluations') return { data: myEvaluationsData, isLoading: false };
    return { data: undefined, isLoading: false };
  },
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts?: { onSuccess?: (d: unknown) => void; onError?: (e: Error) => void },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));

let currentRole: string | undefined = 'COLABORADOR';
let currentUser: { id: number } | undefined = { id: 1 };
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => currentRole }));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: currentUser }) }));

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

vi.mock('./SubmitEvaluationModal', () => ({
  SubmitEvaluationModal: ({ evaluatedName }: { evaluatedName: string }) => (
    <div data-testid="submit-modal">{evaluatedName}</div>
  ),
}));

import { PendingTab } from './PendingTab';

beforeEach(() => {
  requestsData = { data: [] };
  pendingData = [];
  myEvaluationsData = [];
  currentRole = 'COLABORADOR';
  currentUser = { id: 1 };
  post.mockClear();
  notify.mockClear();
});

describe('PendingTab', () => {
  test('COLABORADOR não vê a fila do gestor', () => {
    render(<PendingTab />);
    expect(screen.queryByText('Avaliações Pendentes — Para Avaliar')).not.toBeInTheDocument();
    expect(screen.getByText('Sem avaliações pendentes')).toBeInTheDocument();
  });

  test('COLABORADOR sem histórico vê estado vazio de concluídas', () => {
    render(<PendingTab />);
    expect(screen.getByText('Ainda sem avaliações concluídas')).toBeInTheDocument();
  });

  test('GESTOR vê a fila própria e pode enviar lembrete', async () => {
    currentRole = 'GESTOR';
    requestsData = {
      data: [
        {
          key: '2-1',
          id: 10,
          evaluated: { id: 2, fullName: 'Ana Costa' },
          evaluator: { id: 1, fullName: 'Eu' },
          type: 'MANAGER',
          purpose: null,
          name: 'Avaliação Q3',
          cycle: { id: 1, name: 'Ciclo 2026' },
          period: '2026',
          status: 'PENDING',
          progress: 0,
          dueDate: null,
          stage: null,
          result: null,
          completedAt: null,
          evaluatorsCount: 1,
        },
      ],
    };
    render(<PendingTab />);
    expect(screen.getByText('Ana Costa')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Lembrar'));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/evaluations/requests/10/remind', {}));
  });

  test('secção "Feedback recebido" mostra os pontos fortes/a melhorar', () => {
    myEvaluationsData = [
      {
        id: 1,
        type: 'MANAGER',
        period: '2026-01',
        overallScore: 4.2,
        strengths: 'Excelente comunicação',
        improvements: 'Gestão de tempo',
        recommendations: null,
        createdAt: '2026-01-15T00:00:00.000Z',
        evaluator: { id: 9, fullName: 'Chefe Directo' },
      },
    ];
    render(<PendingTab />);
    expect(screen.getByText('Feedback recebido')).toBeInTheDocument();
    expect(screen.getByText(/Excelente comunicação/)).toBeInTheDocument();
  });
});
