import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let criteriaData: unknown[] = [];
const del = vi.fn().mockResolvedValue({});
const patch = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    delete: (...a: unknown[]) => del(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/evaluations/criteria') return { data: criteriaData, isLoading: false };
    return { data: undefined, isLoading: false };
  },
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts?: { onSuccess?: (d: unknown) => void },
  ) => ({
    mutate: (v: unknown) => fn(v).then((d) => opts?.onSuccess?.(d)),
    isPending: false,
  }),
}));

let currentRole: string | undefined = 'ADMIN';
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => currentRole }));

const confirmFn = vi.fn().mockResolvedValue(true);
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirmFn }));
const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

vi.mock('./CriteriaFormModal', () => ({
  CriteriaFormModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="criteria-modal">
      <button onClick={onClose}>fechar</button>
    </div>
  ),
}));

import { CriteriaTab } from './CriteriaTab';

beforeEach(() => {
  criteriaData = [];
  currentRole = 'ADMIN';
  del.mockClear();
  patch.mockClear();
  confirmFn.mockClear();
  notify.mockClear();
});

describe('CriteriaTab', () => {
  test('lista vazia mostra EmptyState', () => {
    render(<CriteriaTab />);
    expect(screen.getByText('Sem critérios criados')).toBeInTheDocument();
  });

  test('ADMIN vê botão "Novo Critério" e abre o modal', () => {
    render(<CriteriaTab />);
    fireEvent.click(screen.getByText('Novo Critério'));
    expect(screen.getByTestId('criteria-modal')).toBeInTheDocument();
  });

  test('COLABORADOR não vê acções de gestão', () => {
    currentRole = 'COLABORADOR';
    criteriaData = [
      { id: 1, name: 'Comunicação', weight: 1, isActive: true, code: null, category: null, scale: null },
    ];
    render(<CriteriaTab />);
    expect(screen.queryByText('Novo Critério')).not.toBeInTheDocument();
    expect(screen.queryByText('Remover')).not.toBeInTheDocument();
  });

  test('linha existente permite remover com confirmação', async () => {
    criteriaData = [
      { id: 1, name: 'Comunicação', weight: 1, isActive: true, code: null, category: null, scale: null },
    ];
    render(<CriteriaTab />);
    fireEvent.click(screen.getByText('Remover'));
    expect(confirmFn).toHaveBeenCalled();
    await waitFor(() => expect(del).toHaveBeenCalledWith('/evaluations/criteria/1'));
  });
});
