import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// `data` do loadResults é controlado por este ref — cada teste define a forma
// que o backend devolveria antes de renderizar.
let mutationData: unknown = undefined;
const mutate = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: () => ({
    mutate,
    data: mutationData,
    isPending: false,
    isError: false,
    error: null,
  }),
}));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}));

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('./RadarChart', () => ({
  RadarChart: () => <div data-testid="radar" />,
}));

import { ResultsTab } from './ResultsTab';

beforeEach(() => {
  mutationData = undefined;
  mutate.mockClear();
  notify.mockClear();
});

describe('ResultsTab', () => {
  test('hasResults:false — mostra estado vazio, sem rebentar', () => {
    mutationData = [
      { evaluated: { id: 7, fullName: 'Maria Silva' }, hasResults: false },
      { userId: 7, evolution: [] },
    ];
    render(<ResultsTab />);
    expect(screen.getByText('Sem avaliações registadas')).toBeInTheDocument();
    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument();
    // O bloco de resultados (que faria finalScore.toFixed) não é renderizado.
    expect(screen.queryByText('Score 360°')).not.toBeInTheDocument();
  });

  test('resultado completo — rende o score', () => {
    mutationData = [
      {
        evaluated: { id: 7, fullName: 'Maria Silva' },
        finalScore: 3.9,
        scoreLabel: 'Acima Esperado',
        byType: { SELF: 4 },
        competencies: {},
        concordance: null,
        totalEvaluators: 5,
        qualitative: { strengths: [], improvements: [], recommendations: [] },
      },
      { userId: 7, evolution: [] },
    ];
    render(<ResultsTab />);
    expect(screen.getByText('Score 360°')).toBeInTheDocument();
    expect(screen.getByText('3.9')).toBeInTheDocument();
  });

  test('ID não numérico — não dispara a query, avisa por toast', () => {
    render(<ResultsTab />);
    fireEvent.change(screen.getByPlaceholderText('ID do colaborador...'), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ver Resultados' }));
    expect(mutate).not.toHaveBeenCalled();
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({ intent: 'danger' }),
    );
  });
});
