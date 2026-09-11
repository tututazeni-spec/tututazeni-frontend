import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

let cycles: unknown[] = [];
const mutateMock = vi.fn();
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: cycles, isLoading: false }),
  useApiMutation: () => ({ mutate: mutateMock, isPending: false }),
}));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => vi.fn().mockResolvedValue(true),
}));
vi.mock('./CreatePerformanceCycleModal', () => ({
  CreatePerformanceCycleModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-cycle-modal">
      <button onClick={onClose}>fechar</button>
    </div>
  ),
}));

import { CyclesTab } from './CyclesTab';

beforeEach(() => {
  cycles = [];
  mutateMock.mockClear();
});

describe('CyclesTab', () => {
  test('sem ciclos mostra EmptyState com botão "Nova Avaliação"', () => {
    render(<CyclesTab />);
    expect(screen.getByText('Sem ciclos de avaliação')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: /Nova Avaliação/ })[0]);
    expect(screen.getByTestId('create-cycle-modal')).toBeInTheDocument();
  });

  test('ciclo PLANNED mostra botão "Activar"', () => {
    cycles = [
      {
        id: 1,
        name: 'Avaliação Anual 2026',
        code: null,
        status: 'PLANNED',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        targetDepartmentIds: [],
        goalsWeight: 40,
        competenciesWeight: 40,
        behaviorsWeight: 20,
        _count: { reviews: 0 },
      },
    ];
    render(<CyclesTab />);
    expect(screen.getByText('Avaliação Anual 2026')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Activar/ })).toBeInTheDocument();
  });

  test('ciclo ACTIVE não mostra botão "Activar"', () => {
    cycles = [
      {
        id: 2,
        name: 'Ciclo em curso',
        code: null,
        status: 'ACTIVE',
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        targetDepartmentIds: [7],
        goalsWeight: 40,
        competenciesWeight: 40,
        behaviorsWeight: 20,
        _count: { reviews: 12 },
      },
    ];
    render(<CyclesTab />);
    expect(screen.queryByRole('button', { name: /Activar/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 departamento(s)')).toBeInTheDocument();
  });

  test('clicar em "Activar" chama a mutação depois de confirmar', async () => {
    cycles = [
      {
        id: 3,
        name: 'Ciclo Q1',
        code: null,
        status: 'PLANNED',
        startDate: '2026-01-01',
        endDate: '2026-03-31',
        targetDepartmentIds: [],
        goalsWeight: 40,
        competenciesWeight: 40,
        behaviorsWeight: 20,
        _count: { reviews: 0 },
      },
    ];
    render(<CyclesTab />);
    fireEvent.click(screen.getByRole('button', { name: /Activar/ }));
    await waitFor(() => expect(mutateMock).toHaveBeenCalledWith(3));
  });
});
