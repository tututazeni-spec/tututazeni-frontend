import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

let templatesData: unknown[] = [];
const del = vi.fn().mockResolvedValue({});
const patch = vi.fn().mockResolvedValue({});
const getFn = vi
  .fn()
  .mockResolvedValue({ id: 5, name: 'Modelo X', criteria: [] });

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    delete: (...a: unknown[]) => del(...a),
    patch: (...a: unknown[]) => patch(...a),
    get: (...a: unknown[]) => getFn(...a),
  },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/evaluations/templates')
      return { data: templatesData, isLoading: false };
    return { data: undefined, isLoading: false };
  },
  useApiMutation: (fn: (v: unknown) => Promise<unknown>) => ({
    mutate: (v: unknown) => void fn(v),
    isPending: false,
  }),
}));

let currentRole: string | undefined = 'ADMIN';
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => currentRole,
  useHasRole: (allowed: readonly string[]) =>
    !!currentRole && allowed.includes(currentRole as string),
}));

const confirmFn = vi.fn().mockResolvedValue(true);
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirmFn }));
const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

vi.mock('./TemplateFormModal', () => ({
  TemplateFormModal: () => <div data-testid="template-modal" />,
}));

import { ModelsTab } from './ModelsTab';

beforeEach(() => {
  templatesData = [];
  currentRole = 'ADMIN';
  del.mockClear();
  confirmFn.mockClear();
  notify.mockClear();
});

describe('ModelsTab', () => {
  test('lista vazia mostra EmptyState', () => {
    render(<ModelsTab />);
    expect(screen.getByText('Sem modelos criados')).toBeInTheDocument();
  });

  test('ADMIN vê botão "Novo Modelo" e abre o modal', () => {
    render(<ModelsTab />);
    fireEvent.click(screen.getByText('Novo Modelo'));
    expect(screen.getByTestId('template-modal')).toBeInTheDocument();
  });

  test('GESTOR (leitura) não vê acções de gestão', () => {
    currentRole = 'GESTOR';
    templatesData = [
      {
        id: 1,
        name: 'Modelo Anual',
        type: 'Avaliação anual',
        isDefault: false,
        isActive: true,
        criteria: [],
        _count: { criteria: 3 },
      },
    ];
    render(<ModelsTab />);
    expect(screen.getByText('Modelo Anual')).toBeInTheDocument();
    expect(screen.queryByText('Novo Modelo')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^Remover/ }),
    ).not.toBeInTheDocument();
  });

  test('remover um modelo pede confirmação e chama o DELETE', async () => {
    templatesData = [
      {
        id: 5,
        name: 'Modelo X',
        type: 'GENERIC',
        isDefault: false,
        isActive: true,
        criteria: [],
        _count: { criteria: 0 },
      },
    ];
    render(<ModelsTab />);
    await userEvent.click(
      screen.getByRole('button', { name: /^Mais opções de/ }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', { name: 'Remover' }),
    );
    expect(confirmFn).toHaveBeenCalled();
    await waitFor(() =>
      expect(del).toHaveBeenCalledWith('/evaluations/templates/5'),
    );
  });

  test('botão Desactivar faz PATCH isActive=false ao modelo', async () => {
    templatesData = [
      {
        id: 5,
        name: 'Modelo X',
        type: 'GENERIC',
        isDefault: false,
        isActive: true,
        criteria: [],
        _count: { criteria: 0 },
      },
    ];
    render(<ModelsTab />);
    fireEvent.click(screen.getByRole('button', { name: /^Desactivar/ }));
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/evaluations/templates/5', {
        isActive: false,
      }),
    );
  });

  test('menu de três pontos abre "Novo critério de avaliação"', async () => {
    templatesData = [
      {
        id: 5,
        name: 'Modelo X',
        type: 'GENERIC',
        isDefault: false,
        isActive: true,
        criteria: [],
        _count: { criteria: 0 },
      },
    ];
    render(<ModelsTab />);
    await userEvent.click(
      screen.getByRole('button', { name: /^Mais opções de/ }),
    );
    await userEvent.click(
      await screen.findByRole('menuitem', {
        name: 'Novo critério de avaliação',
      }),
    );
    expect(
      await screen.findByText('Novo critério de avaliação', {
        selector: 'h2, [role=dialog] *',
      }),
    ).toBeInTheDocument();
  });
});
