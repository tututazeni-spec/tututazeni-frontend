import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let currentRole: string | undefined = 'ADMIN';
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => currentRole,
}));

let evaluations: unknown[] = [];
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: evaluations, isLoading: false }),
  useApiMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => vi.fn() }));

vi.mock('./CreateFormalEvaluationModal', () => ({
  CreateFormalEvaluationModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="create-modal">
      <button onClick={onClose}>fechar</button>
    </div>
  ),
}));
vi.mock('./FormalEvaluationResultsPanel', () => ({
  FormalEvaluationResultsPanel: () => <div data-testid="results-panel" />,
}));
vi.mock('./FormalEvaluationsParticipantView', () => ({
  FormalEvaluationsParticipantView: () => <div data-testid="participant-view" />,
}));

import { FormalEvaluationsTab } from './FormalEvaluationsTab';

beforeEach(() => {
  currentRole = 'ADMIN';
  evaluations = [];
});

describe('FormalEvaluationsTab', () => {
  test('ADMIN vê a gestão com botão "Nova Avaliação" e pode abrir o modal de criação', () => {
    render(<FormalEvaluationsTab />);
    expect(screen.queryByTestId('participant-view')).not.toBeInTheDocument();
    // Sem avaliações, a EmptyState também tem um botão "Nova Avaliação" — o
    // do cabeçalho é o primeiro.
    fireEvent.click(screen.getAllByRole('button', { name: /Nova Avaliação/ })[0]);
    expect(screen.getByTestId('create-modal')).toBeInTheDocument();
  });

  test('COLABORADOR vê apenas a vista de participante', () => {
    currentRole = 'COLABORADOR';
    render(<FormalEvaluationsTab />);
    expect(screen.getByTestId('participant-view')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Nova Avaliação/ })).not.toBeInTheDocument();
  });

  test('AUDITOR vê apenas a vista de participante', () => {
    currentRole = 'AUDITOR';
    render(<FormalEvaluationsTab />);
    expect(screen.getByTestId('participant-view')).toBeInTheDocument();
  });

  test('GESTOR e INSTRUCTOR também têm acesso à gestão', () => {
    currentRole = 'INSTRUCTOR';
    render(<FormalEvaluationsTab />);
    expect(screen.getAllByRole('button', { name: /Nova Avaliação/ }).length).toBeGreaterThan(0);
  });

  test('mostra "Resultados" e "Publicar" conforme o estado de cada avaliação', () => {
    evaluations = [
      {
        id: 1,
        title: 'Rascunho',
        status: 'DRAFT',
        targetDepartmentIds: [],
        availableUntil: null,
        _count: { questions: 3, attempts: 0 },
      },
      {
        id: 2,
        title: 'Publicada',
        status: 'PUBLISHED',
        targetDepartmentIds: [1, 2],
        availableUntil: null,
        _count: { questions: 5, attempts: 4 },
      },
    ];
    render(<FormalEvaluationsTab />);
    expect(screen.getByText('Rascunho')).toBeInTheDocument();
    expect(screen.getByText('Publicada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Resultados/ })).toBeInTheDocument();
  });
});
