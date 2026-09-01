import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const del = vi.fn().mockResolvedValue({ message: 'Competência eliminada' });
const patch = vi.fn().mockResolvedValue({});
const put = vi.fn().mockResolvedValue({});
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    delete: (...a: unknown[]) => del(...a),
    patch: (...a: unknown[]) => patch(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));

// Resultado do GET /competencies/:id — reconfigurado por teste.
let detailResult: {
  data: unknown;
  isLoading: boolean;
  error: unknown;
} = { data: undefined, isLoading: false, error: null };

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => detailResult,
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
}));

// confirm() resolve `true` por defeito; testes individuais reconfiguram.
const confirmFn = vi.fn();
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => confirmFn,
}));

const toast = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => toast,
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

import { CompetencyDetailModal } from './CompetencyDetailModal';

const baseDetail = {
  id: 7,
  name: 'Negociação',
  description: 'Descrição',
  category: 'SOFT_SKILL',
  tags: [],
  status: 'ACTIVE',
  proficiencyLevels: [],
  courses: [],
  positions: [],
  _count: { userCompetencies: 0, endorsements: 0 },
};

function renderModal(
  props: Partial<React.ComponentProps<typeof CompetencyDetailModal>> = {},
) {
  return render(
    <CompetencyDetailModal
      competencyId={7}
      canManage
      canDelete
      onEdit={vi.fn()}
      onClose={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  del.mockClear();
  patch.mockClear();
  put.mockClear();
  toast.mockClear();
  confirmFn.mockReset();
  confirmFn.mockResolvedValue(true);
  detailResult = { data: baseDetail, isLoading: false, error: null };
});

describe('CompetencyDetailModal — acção "Apagar"', () => {
  test('não aparece quando canDelete é falso', () => {
    renderModal({ canDelete: false });
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Apagar' }),
    ).not.toBeInTheDocument();
  });

  test('confirmar envia DELETE /competencies/:id e fecha o modal', async () => {
    const onClose = vi.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    await waitFor(() => expect(del).toHaveBeenCalledTimes(1));
    expect(del).toHaveBeenCalledWith('/competencies/7');
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'success' }),
    );
  });

  test('cancelar a confirmação não envia DELETE', async () => {
    confirmFn.mockResolvedValue(false);
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    await Promise.resolve();
    expect(del).not.toHaveBeenCalled();
  });

  test('fica desativado e mostra aviso quando há utilizadores associados', () => {
    detailResult = {
      data: { ...baseDetail, _count: { userCompetencies: 4, endorsements: 0 } },
      isLoading: false,
      error: null,
    };
    renderModal();

    expect(screen.getByRole('button', { name: 'Apagar' })).toBeDisabled();
    expect(screen.getByText(/4 utilizadores associados/i)).toBeInTheDocument();
  });

  test('erro do backend é mostrado como toast danger', async () => {
    del.mockRejectedValueOnce(
      new Error(
        'Competência tem 4 utilizadores associados. Archive-a em vez de eliminar.',
      ),
    );
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Apagar' }));

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ intent: 'danger' }),
      ),
    );
  });
});
