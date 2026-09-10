import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const outcomes = {
  programId: 1,
  participants: {
    total: 4,
    byStatus: { COMPLETED: 2, WITHDRAWN: 1, IN_PROGRESS: 1 },
    completionRate: 50,
    dropoutRate: 25,
  },
  attendance: { averageRate: 88 },
  score: { averageFinalScore: 79 },
  competencyEvolution: { initialAvg: 55, finalAvg: 72, delta: 17 },
  projects: { total: 3, completed: 2, averageScore: 84 },
  readiness: { byLevel: { READY_NOW: 1, READY_SOON: 2 }, readyNow: 1 },
  succession: { linked: 1 },
  cost: {
    currency: 'AOA',
    totalPlanned: 1000,
    totalActual: 900,
    byCategory: { INSTRUCTOR: { planned: 700, actual: 650 } },
  },
  certificates: { issued: 2 },
  satisfaction: null,
  promotions: null,
  mobility: null,
  roi: null,
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: outcomes, isLoading: false, error: null, refetch: vi.fn() }),
}));

import { ResultsView } from './ResultsView';

describe('ResultsView', () => {
  test('mostra as parcelas do resultado (breakdown por estado, readiness, evolução, custo)', () => {
    render(<ResultsView programId={1} />);

    // KPIs
    expect(screen.getByText('Taxa de conclusão')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Breakdown por estado (rótulo traduzido do PARTICIPANT_STATUS_CFG)
    expect(screen.getByText('Participantes por estado')).toBeInTheDocument();
    expect(screen.getByText('Concluído')).toBeInTheDocument();
    expect(screen.getByText('Desistiu')).toBeInTheDocument();

    // Distribuição de readiness
    expect(screen.getByText('Distribuição de readiness')).toBeInTheDocument();
    expect(screen.getByText('Pronto agora')).toBeInTheDocument();
    expect(screen.getByText('Pronto em breve')).toBeInTheDocument();

    // Evolução de competências (inicial vs final + variação)
    expect(screen.getByText('Evolução de competências')).toBeInTheDocument();
    expect(screen.getByText('Variação')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();

    // Custo por categoria
    expect(screen.getByText('Custo do programa')).toBeInTheDocument();
    expect(screen.getByText('INSTRUCTOR')).toBeInTheDocument();

    // Métricas sem fonte → "sem dados"
    expect(screen.getAllByText('sem dados').length).toBeGreaterThanOrEqual(4);
  });
});
