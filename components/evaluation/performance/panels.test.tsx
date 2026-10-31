import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type {
  PerformanceHistory,
  PerformanceIndicators,
  PerformanceItems,
} from './apiTypes';
import { PerformanceDetailModal } from './PerformanceDetailModal';
import { PerformanceHistoryPanel } from './PerformanceHistoryPanel';
import { PerformanceIndicatorsPanel } from './PerformanceIndicatorsPanel';

// O Radix Select usa Pointer Capture / scrollIntoView, ausentes no jsdom.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (typeof window.PointerEvent === 'undefined') {
    class MockPointerEvent extends MouseEvent {
      pointerType: string;
      constructor(type: string, props: PointerEventInit = {}) {
        super(type, props);
        this.pointerType = props.pointerType ?? 'mouse';
      }
    }
    window.PointerEvent = MockPointerEvent as unknown as typeof PointerEvent;
  }
});

const post = vi.fn().mockResolvedValue({ planId: 1, actionsCreated: 2 });
const patch = vi.fn().mockResolvedValue({});
const notify = vi.fn();
let items: PerformanceItems;
let history: PerformanceHistory;
let currentUser = { id: 10, role: { name: 'GESTOR' } };

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: currentUser }),
}));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_k: unknown, path: string) => {
    if (path.includes('/performance/history/'))
      return { data: history, isLoading: false, isError: false };
    if (path.endsWith('/items'))
      return { data: items, isLoading: false, isError: false };
    return { data: undefined, isLoading: false, isError: false };
  },
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts?: { onSuccess?: (d: unknown) => void },
  ) => ({
    mutate: (v: unknown) => fn(v).then((d) => opts?.onSuccess?.(d)),
    isPending: false,
  }),
}));

const rec = (
  over: Partial<PerformanceItems['recommendations'][number]> = {},
) => ({
  id: 1,
  improvementAreaId: null,
  action: 'Curso de gestão do tempo',
  objective: 'Cumprir prazos',
  actionType: 'FORMACAO',
  successIndicator: '90%',
  priority: 4,
  dueDate: null,
  notes: null,
  responsible: null,
  training: { id: 3, title: 'Gestão do Tempo', status: 'PUBLISHED' },
  trainingParticipation: null,
  pdiAction: null,
  status: 'PENDENTE' as const,
  progressPct: 0,
  overdue: false,
  source: 'RECOMENDACAO' as const,
  ...over,
});

beforeEach(() => {
  post.mockClear();
  patch.mockClear();
  currentUser = { id: 10, role: { name: 'GESTOR' } };
  items = {
    evaluationId: 7,
    pdiPlanId: null,
    strengths: [
      {
        id: 1,
        competency: 'Comunicação',
        score: 5,
        description: 'Explica bem',
        evidence: null,
        impact: null,
        comment: null,
      },
    ],
    improvements: [
      {
        id: 2,
        competency: 'Prazos',
        score: 2,
        description: 'Atrasa',
        evidence: null,
        impact: null,
        comment: null,
        priority: 'ALTA',
      },
    ],
    recommendations: [rec()],
  };
});

describe('PerformanceDetailModal', () => {
  test('mostra as três secções, a formação real e "Sem inscrição"', () => {
    render(
      <PerformanceDetailModal
        evaluationId={7}
        evaluatedId={5}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Comunicação — nota 5/5')).toBeInTheDocument();
    expect(
      screen.getByText(/Prazos — nota 2\/5 · prioridade Alta/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gestão do Tempo · Sem inscrição/),
    ).toBeInTheDocument();
    expect(screen.getByText('Prioridade 4 — Alta')).toBeInTheDocument();
  });

  test('o avaliador gera o PDI e acompanha ações que ainda não estão no PDI', async () => {
    render(
      <PerformanceDetailModal
        evaluationId={7}
        evaluatedId={5}
        onClose={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gerar PDI' }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/evaluations/performance/7/pdi', {}),
    );

    fireEvent.pointerDown(screen.getByRole('combobox'), { button: 0 });
    fireEvent.click(
      await screen.findByRole('option', { name: 'Em curso', hidden: true }),
    );
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/evaluations/recommendations/1', {
        status: 'EM_CURSO',
        progressPct: 50,
      }),
    );
  });

  test('ação ligada ao PDI mostra o estado do PDI e não permite editar aqui', () => {
    items.pdiPlanId = 9;
    items.recommendations = [
      rec({
        status: 'CONCLUIDA',
        progressPct: 100,
        source: 'PDI',
        pdiAction: { id: 4, planId: 9 },
      }),
    ];
    render(
      <PerformanceDetailModal
        evaluationId={7}
        evaluatedId={5}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Concluída')).toBeInTheDocument();
    expect(screen.getByText(/Estado gerido no PDI/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Estado da recomendação/)).toBeNull();
    expect(
      screen.queryByRole('button', { name: /Gerar PDI|Acrescentar/ }),
    ).toBeNull();
    expect(screen.getByText('Esta avaliação já tem PDI')).toBeInTheDocument();
  });

  test('o avaliado não vê "Gerar PDI" nem controlos de acompanhamento', () => {
    currentUser = { id: 5, role: { name: 'COLABORADOR' } };
    render(
      <PerformanceDetailModal
        evaluationId={7}
        evaluatedId={5}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole('button', { name: 'Gerar PDI' })).toBeNull();
    expect(screen.queryByLabelText(/Estado da recomendação/)).toBeNull();
  });

  test('ação em atraso é assinalada por texto, não só por cor', () => {
    items.recommendations = [rec({ overdue: true })];
    render(
      <PerformanceDetailModal
        evaluationId={7}
        evaluatedId={5}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText('Em atraso')).toBeInTheDocument();
  });
});

describe('PerformanceHistoryPanel', () => {
  const entry = (id: number, period: string, score: number | null) => ({
    evaluationId: id,
    period,
    type: 'MANAGER',
    cycleName: null,
    overallScore: score,
    ratingLabel: score === null ? null : 'Bom',
    submittedAt: '2026-01-01',
    recommendations: { total: 2, done: 1, open: 1, overdue: 1 },
  });

  test('sem avaliações submetidas', () => {
    history = { userId: 5, type: 'MANAGER', entries: [], comparison: null };
    render(<PerformanceHistoryPanel userId={5} />);
    expect(
      screen.getByText(/Ainda sem avaliações submetidas/),
    ).toBeInTheDocument();
  });

  test('uma só avaliação: lista e pede uma segunda para comparar', () => {
    history = {
      userId: 5,
      type: 'MANAGER',
      entries: [entry(1, '2025', 3.2)],
      comparison: null,
    };
    render(<PerformanceHistoryPanel userId={5} />);
    expect(screen.getByText('3.20 — Bom')).toBeInTheDocument();
    expect(
      screen.getByText(/São precisas duas avaliações/),
    ).toBeInTheDocument();
  });

  test('comparação mostra variação com texto e a limitação quando os critérios mudaram', () => {
    history = {
      userId: 5,
      type: 'MANAGER',
      entries: [entry(1, '2025', 3), entry(2, '2026', 3.6)],
      comparison: {
        from: { period: '2025', overallScore: 3 },
        to: { period: '2026', overallScore: 3.6 },
        comparable: false,
        limitation:
          'Os critérios ou pesos desta avaliação diferem da anterior.',
        overallDelta: 0.6,
        competencies: [
          { competency: 'Prazos', previous: 2, current: 3, delta: 1 },
        ],
        strengthsMaintained: ['Comunicação'],
        strengthsNew: [],
        improvementsResolved: ['Foco'],
        improvementsPending: ['Prazos'],
        improvementsNew: [],
        previousRecommendations: { total: 2, done: 1, open: 1, overdue: 1 },
      },
    };
    render(<PerformanceHistoryPanel userId={5} />);
    expect(screen.getByText('Comparação com reservas')).toBeInTheDocument();
    expect(screen.getByText(/diferem da anterior/)).toBeInTheDocument();
    // Classificação não comparável: sem seta de variação global.
    expect(
      screen.queryByText('(melhoria)', { exact: false }),
    ).toBeInTheDocument(); // delta por competência
    expect(
      screen.getByText('Áreas de melhoria resolvidas'),
    ).toBeInTheDocument();
    expect(screen.getByText('Foco')).toBeInTheDocument();
  });

  test('avaliação sem classificação final não mostra nota', () => {
    history = {
      userId: 5,
      type: 'MANAGER',
      entries: [entry(1, '2025', null)],
      comparison: null,
    };
    render(<PerformanceHistoryPanel userId={5} />);
    expect(screen.getByText('Sem classificação final')).toBeInTheDocument();
  });
});

describe('PerformanceIndicatorsPanel', () => {
  const data: PerformanceIndicators = {
    byRating: [{ label: 'Muito bom', count: 4 }],
    topStrengths: [{ competency: 'Equipa', count: 3, avgScore: 4.33 }],
    recurringImprovements: [],
    recommendations: {
      total: 5,
      byStatus: { PENDENTE: 2, CONCLUIDA: 3 },
      byPriority: { '4': 2 },
      overdue: 1,
      trainingNeeds: 2,
    },
    pdi: { plans: 2, avgProgress: 40 },
  };

  test('mostra agregados por competência, estado e prioridade', () => {
    render(<PerformanceIndicatorsPanel data={data} />);
    expect(screen.getByText('Equipa')).toBeInTheDocument();
    expect(screen.getByText(/média 4\.3\/5/)).toBeInTheDocument();
    expect(
      screen.getByText(/5 no total · 2 necessidades de formação/),
    ).toBeInTheDocument();
    expect(screen.getByText('1 em atraso')).toBeInTheDocument();
    expect(screen.getByText(/progresso médio 40%/)).toBeInTheDocument();
    expect(
      screen.getByText('Sem áreas de melhoria registadas neste filtro.'),
    ).toBeInTheDocument();
  });
});

describe('PerformanceIndicatorsPanel — privacidade', () => {
  test('com poucas avaliações explica que os dados estão ocultos', () => {
    render(
      <PerformanceIndicatorsPanel
        data={{
          restricted: true,
          byRating: [],
          topStrengths: [],
          recurringImprovements: [],
          recommendations: {
            total: 1,
            byStatus: { CONCLUIDA: 1 },
            byPriority: {},
            overdue: 0,
            trainingNeeds: 0,
          },
          pdi: { plans: 0, avgProgress: null },
        }}
      />,
    );
    expect(screen.getAllByText(/Oculto por privacidade/).length).toBe(3);
    expect(screen.queryByText(/Sem pontos fortes registados/)).toBeNull();
  });
});
