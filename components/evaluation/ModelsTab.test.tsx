import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let templatesData: unknown[] = [];
const del = vi.fn().mockResolvedValue({});

vi.mock('@/lib/apiClient', () => ({
  apiClient: { delete: (...a: unknown[]) => del(...a) },
}));

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/evaluations/templates') return { data: templatesData, isLoading: false };
    return { data: undefined, isLoading: false };
  },
}));

let currentRole: string | undefined = 'ADMIN';
vi.mock('@/hooks/useCurrentRole', () => ({ useCurrentRole: () => currentRole }));

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
    templatesData = [{ id: 1, name: 'Modelo Anual', type: 'Avaliação anual', isDefault: false, isActive: true, criteria: [], _count: { criteria: 3 } }];
    render(<ModelsTab />);
    expect(screen.getByText('Modelo Anual')).toBeInTheDocument();
    expect(screen.queryByText('Novo Modelo')).not.toBeInTheDocument();
    expect(screen.queryByText('Remover')).not.toBeInTheDocument();
  });

  test('remover um modelo pede confirmação e chama o DELETE', async () => {
    templatesData = [{ id: 5, name: 'Modelo X', type: 'GENERIC', isDefault: false, isActive: true, criteria: [], _count: { criteria: 0 } }];
    render(<ModelsTab />);
    fireEvent.click(screen.getByText('Remover'));
    expect(confirmFn).toHaveBeenCalled();
    await waitFor(() => expect(del).toHaveBeenCalledWith('/evaluations/templates/5'));
  });
});
