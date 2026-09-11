import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let rosterData: unknown = undefined;
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (key: readonly unknown[]) => {
    // A chave do roster inclui 'results'; a do drilldown inclui 'attempt-review'.
    if (key.includes('attempt-review')) {
      return { data: undefined, isLoading: false };
    }
    return { data: rosterData, isLoading: false };
  },
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

import { FormalEvaluationResultsPanel } from './FormalEvaluationResultsPanel';

beforeEach(() => {
  rosterData = undefined;
});

describe('FormalEvaluationResultsPanel', () => {
  test('mostra EmptyState quando ainda não há participantes', () => {
    rosterData = {
      assessment: { id: 1, title: 'Prova Final', maxGrade: 20, passingScore: 70 },
      roster: [],
    };
    render(<FormalEvaluationResultsPanel assessmentId={1} onClose={vi.fn()} />);
    expect(screen.getByText('Ainda sem resultados')).toBeInTheDocument();
  });

  test('lista nome, departamento, nota e rótulo qualitativo de cada participante', () => {
    rosterData = {
      assessment: { id: 1, title: 'Prova Final', maxGrade: 20, passingScore: 70 },
      roster: [
        {
          attemptId: 42,
          userId: 2,
          fullName: 'Ana Silva',
          department: 'RH',
          score: 90,
          displayGrade: 18,
          qualitativeLabel: 'Excelente',
          passed: true,
          status: 'PASSED',
          submittedAt: '2026-09-01T10:00:00Z',
        },
      ],
    };
    render(<FormalEvaluationResultsPanel assessmentId={1} onClose={vi.fn()} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText('RH')).toBeInTheDocument();
    expect(screen.getByText('Excelente')).toBeInTheDocument();
  });

  test('clicar numa linha abre o drilldown das respostas desse utilizador', () => {
    rosterData = {
      assessment: { id: 1, title: 'Prova Final', maxGrade: 20, passingScore: 70 },
      roster: [
        {
          attemptId: 42,
          userId: 2,
          fullName: 'Ana Silva',
          department: 'RH',
          score: 90,
          displayGrade: 18,
          qualitativeLabel: 'Excelente',
          passed: true,
          status: 'PASSED',
          submittedAt: null,
        },
      ],
    };
    render(<FormalEvaluationResultsPanel assessmentId={1} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Ana Silva'));
    // O título do drilldown cai para o placeholder até a query resolver —
    // confirma que o segundo Modal (drilldown) foi montado.
    expect(screen.getByText('Respostas do participante')).toBeInTheDocument();
  });
});
