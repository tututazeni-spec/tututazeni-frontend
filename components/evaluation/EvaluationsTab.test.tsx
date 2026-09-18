import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// `useApiQuery` é chamado várias vezes com paths diferentes (ciclos,
// departamentos, unidades, lista de avaliações) — este mock resolve por
// substring do path, mesmo padrão de outros testes deste módulo que
// simulam múltiplos endpoints com um único mock genérico.
let requestsData: unknown = { data: [], meta: { total: 0, totalPages: 1 } };
const post = vi.fn().mockResolvedValue({});
const patch = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a), patch: (...a: unknown[]) => patch(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (key: unknown, path: string) => {
    if (path === '/evaluations/requests') return { data: requestsData, isLoading: false };
    if (path === '/evaluations/cycles') return { data: { data: [] }, isLoading: false };
    if (path === '/departments/tree') return { data: [], isLoading: false };
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

vi.mock('@/components/departments/departmentFormData', () => ({
  useUnits: () => ({ units: [], loading: false }),
  useDirectoryUsers: () => ({ users: [], loading: false }),
}));

let currentRole: string | undefined = 'ADMIN';
let currentUser: { id: number } | undefined = { id: 1 };
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => currentRole }));
vi.mock('@/hooks/useCurrentUser', () => ({ useCurrentUser: () => ({ data: currentUser }) }));

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

vi.mock('./NewEvaluationWizard', () => ({ NewEvaluationWizard: () => <div data-testid="wizard" /> }));
vi.mock('./EvaluationDetailModal', () => ({ EvaluationDetailModal: () => <div data-testid="detail" /> }));
vi.mock('./SubmitEvaluationModal', () => ({ SubmitEvaluationModal: () => <div data-testid="submit" /> }));

import { EvaluationsTab } from './EvaluationsTab';

beforeEach(() => {
  requestsData = { data: [], meta: { total: 0, totalPages: 1 } };
  currentRole = 'ADMIN';
  currentUser = { id: 1 };
  post.mockClear();
  patch.mockClear();
  notify.mockClear();
});

describe('EvaluationsTab', () => {
  test('COLABORADOR sem MGMT_ROLES vê "Sem acesso"', () => {
    currentRole = 'COLABORADOR';
    render(<EvaluationsTab />);
    expect(screen.getByText('Sem acesso')).toBeInTheDocument();
  });

  test('lista vazia mostra EmptyState', () => {
    render(<EvaluationsTab />);
    expect(screen.getByText('Sem avaliações')).toBeInTheDocument();
  });

  test('linha com avaliador = utilizador actual mostra "Continuar avaliação" e chama o submit modal', () => {
    requestsData = {
      data: [
        {
          key: '1-1',
          id: 10,
          evaluated: { id: 2, fullName: 'Colaborador X' },
          evaluator: { id: 1, fullName: 'Eu' },
          type: 'MANAGER',
          purpose: 'PERFORMANCE',
          name: null,
          cycle: { id: 1, name: 'Ciclo 2026', startDate: '2026-01-01', endDate: '2026-12-31' },
          period: '2026',
          status: 'IN_PROGRESS',
          dueDate: null,
          stage: 'MANAGER_EVAL',
          result: null,
          completedAt: null,
          evaluatorsCount: 1,
        },
      ],
      meta: { total: 1, totalPages: 1 },
    };
    render(<EvaluationsTab />);
    expect(screen.getByText('Colaborador X')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Continuar avaliação'));
    expect(screen.getByTestId('submit')).toBeInTheDocument();
  });

  test('acção "Enviar lembrete" chama POST /evaluations/requests/:id/remind', async () => {
    requestsData = {
      data: [
        {
          key: '1-1',
          id: 10,
          evaluated: { id: 2, fullName: 'Colaborador X' },
          evaluator: { id: 9, fullName: 'Outro Gestor' },
          type: 'MANAGER',
          purpose: null,
          name: null,
          cycle: null,
          period: null,
          status: 'PENDING',
          dueDate: null,
          stage: null,
          result: null,
          completedAt: null,
          evaluatorsCount: 1,
        },
      ],
      meta: { total: 1, totalPages: 1 },
    };
    render(<EvaluationsTab />);
    fireEvent.click(screen.getByLabelText('Enviar lembrete'));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/evaluations/requests/10/remind', {}));
  });

  test('botão "Nova Avaliação" abre o assistente', () => {
    render(<EvaluationsTab />);
    fireEvent.click(screen.getByRole('button', { name: /Nova Avaliação/ }));
    expect(screen.getByTestId('wizard')).toBeInTheDocument();
  });
});
