import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GestaoView } from './GestaoView';

// ─── Mocks ────────────────────────────────────────────────────────────────
// Mesmo padrão de components/courses/GestaoView.test.tsx: mocka a camada de
// dados para testar só a lógica de UI (que botão dispara que endpoint).

const patch = vi.fn().mockResolvedValue({});
const del = vi.fn().mockResolvedValue({});
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    patch: (...args: unknown[]) => patch(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

vi.mock('./TrainingFormModal', () => ({
  TrainingFormModal: ({ training }: { training: { id: number } | null }) => (
    <div data-testid="training-form-modal">
      {training ? `editing-${training.id}` : 'creating'}
    </div>
  ),
}));

const confirmFn = vi.fn().mockResolvedValue(true);
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirmFn }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

type QueryData = { data: unknown[] } | undefined;
let manageResponse: QueryData;
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: manageResponse, isLoading: false }),
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error, v: unknown) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error, v),
      ),
    isPending: false,
    variables: undefined,
  }),
}));

const draft = {
  id: 1,
  title: 'Liderança 101',
  status: 'DRAFT',
  type: 'PRESENTIAL',
  code: 'FORM-1',
  category: null,
  createdBy: { id: 5, fullName: 'Ana Gestora' },
};
const published = {
  id: 2,
  title: 'Workshop de Vendas',
  status: 'PUBLISHED',
  type: 'WORKSHOP',
  code: null,
  category: 'Comercial',
  createdBy: null,
};

beforeEach(() => {
  patch.mockClear();
  del.mockClear();
  confirmFn.mockClear();
  manageResponse = { data: [draft, published] };
});

describe('GestaoView (trainings)', () => {
  test('lista as formações geríveis', () => {
    render(<GestaoView onManage={vi.fn()} />);
    expect(screen.getByText('Liderança 101')).toBeInTheDocument();
    expect(screen.getByText('Workshop de Vendas')).toBeInTheDocument();
    expect(screen.getByText(/criado por Ana Gestora/)).toBeInTheDocument();
  });

  test('estado vazio quando não há formações geríveis', () => {
    manageResponse = { data: [] };
    render(<GestaoView onManage={vi.fn()} />);
    expect(screen.getByText('Sem formações')).toBeInTheDocument();
  });

  test('Publicar (DRAFT) chama PATCH /trainings/:id/publish', async () => {
    render(<GestaoView onManage={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Publicar' }));
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/trainings/1/publish'));
  });

  test('Arquivar confirma e chama PATCH /trainings/:id/archive', async () => {
    render(<GestaoView onManage={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Arquivar' })[0]);
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/trainings/1/archive'));
  });

  test('Eliminar confirma e chama DELETE /trainings/:id', async () => {
    render(<GestaoView onManage={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Eliminar' })[1]);
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() => expect(del).toHaveBeenCalledWith('/trainings/2'));
  });

  test('"Gerir" e clicar no título chamam onManage com o id da formação', () => {
    const onManage = vi.fn();
    render(<GestaoView onManage={onManage} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Gerir' })[0]);
    expect(onManage).toHaveBeenCalledWith(1);
  });

  test('"Nova Formação" abre o modal em modo criação', () => {
    render(<GestaoView onManage={vi.fn()} />);
    expect(screen.queryByTestId('training-form-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Nova Formação/ }));
    expect(screen.getByTestId('training-form-modal')).toHaveTextContent('creating');
  });

  test('"Editar" abre o modal com a formação da linha', () => {
    render(<GestaoView onManage={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByTestId('training-form-modal')).toHaveTextContent('editing-1');
  });
});
