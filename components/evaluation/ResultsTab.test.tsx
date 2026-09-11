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

// Papel/utilizador actual — controlados por estes refs. Sem role definido
// (undefined) o componente segue o mesmo comportamento de sempre (pesquisa
// livre por ID), tal como app/(platform)/evaluation/page.tsx trata o role
// ainda não carregado como "não-colaborador".
let currentRole: string | undefined = undefined;
let currentUser: { id: number } | undefined = undefined;
vi.mock('@/hooks/useCurrentRole', () => ({
  useCurrentRole: () => currentRole,
}));
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: currentUser }),
}));

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('./RadarChart', () => ({
  RadarChart: () => <div data-testid="radar" />,
}));

import { ResultsTab } from './ResultsTab';

beforeEach(() => {
  mutationData = undefined;
  currentRole = undefined;
  currentUser = undefined;
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
    // Não-colaborador (role ainda não carregado) mantém a acção de PDI.
    expect(
      screen.getByText(/Gerar Sugestão de PDI com base nestes resultados/),
    ).toBeInTheDocument();
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

  describe('COLABORADOR — só vê os seus próprios resultados', () => {
    beforeEach(() => {
      currentRole = 'COLABORADOR';
      currentUser = { id: 42 };
    });

    test('sem pesquisa por ID — só filtro de mês/ano e o próprio ID', () => {
      render(<ResultsTab />);
      expect(
        screen.queryByPlaceholderText('ID do colaborador...'),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Ver Resultados' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'Ver Total' }),
      ).toBeInTheDocument();
    });

    test('"Ver Total" usa sempre o próprio ID, sem filtro de período', () => {
      render(<ResultsTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Ver Total' }));
      expect(mutate).toHaveBeenCalledWith({ uid: '42' });
    });

    test('"Ver Resultados" com mês/ano em "Todos" equivale a ver o total', () => {
      render(<ResultsTab />);
      fireEvent.click(screen.getByRole('button', { name: 'Ver Resultados' }));
      expect(mutate).toHaveBeenCalledWith({ uid: '42', period: undefined });
    });

    test('sem PDI trigger — acção reservada a quem gere avaliações', () => {
      mutationData = [
        {
          evaluated: { id: 42, fullName: 'Eu Próprio' },
          finalScore: 3.9,
          scoreLabel: 'Acima Esperado',
          byType: { SELF: 4 },
          competencies: {},
          concordance: null,
          totalEvaluators: 5,
          qualitative: { strengths: [], improvements: [], recommendations: [] },
        },
        { userId: 42, evolution: [] },
      ];
      render(<ResultsTab />);
      expect(
        screen.queryByText(/Gerar Sugestão de PDI/),
      ).not.toBeInTheDocument();
    });
  });
});
