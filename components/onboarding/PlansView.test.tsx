import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: { data: unknown; isLoading: boolean } = {
  data: undefined,
  isLoading: false,
};
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => queryResult,
}));

vi.mock('./planData', () => ({
  useTemplateOptions: () => ({ options: [], loading: false }),
  useDepartmentOptions: () => ({ options: [], loading: false }),
}));

// Stub — o detalhe tem cobertura própria.
vi.mock('./PlanDetailModal', () => ({
  PlanDetailModal: ({ planId }: { planId: number }) => (
    <div>stub-detail-{planId}</div>
  ),
}));

vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    value,
    onValueChange,
  }: {
    items: { value: string; label: string }[];
    value?: string;
    onValueChange: (v: string) => void;
  }) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

import { PlansView } from './PlansView';

const plan = {
  id: 42,
  status: 'IN_PROGRESS',
  startDate: '2026-08-01T00:00:00.000Z',
  expectedEndDate: null,
  xpEarned: 0,
  user: {
    id: 1,
    fullName: 'Ana Silva',
    email: 'ana@innova.com',
    avatarUrl: null,
    position: { name: 'Programadora' },
  },
  template: { id: 3, name: 'Onboarding TI', durationDays: 30 },
  buddy: null,
  hrResponsible: null,
  _count: { taskInstances: 5, documents: 2 },
};

const page1 = {
  data: [plan],
  meta: { total: 1, page: 1, limit: 20, totalPages: 1 },
};

beforeEach(() => {
  queryResult = { data: page1, isLoading: false };
});

describe('PlansView', () => {
  test('lista um plano com colaborador e template', () => {
    render(<PlansView />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    expect(screen.getByText(/Onboarding TI/)).toBeInTheDocument();
    expect(screen.getByText('1 planos')).toBeInTheDocument();
  });

  test('clicar numa linha abre o detalhe', () => {
    render(<PlansView />);
    fireEvent.click(screen.getByRole('button', { name: /Ana Silva/ }));
    expect(screen.getByText('stub-detail-42')).toBeInTheDocument();
  });

  test('sem resultados mostra estado vazio', () => {
    queryResult = {
      data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } },
      isLoading: false,
    };
    render(<PlansView />);
    expect(screen.getByText('Sem planos')).toBeInTheDocument();
  });
});
