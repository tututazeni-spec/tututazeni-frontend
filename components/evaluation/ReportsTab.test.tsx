import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReportsTab } from './ReportsTab';

const get = vi.fn();
let orgWide = true;
let overview: unknown;

vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: (...a: unknown[]) => get(...a) },
}));
vi.mock('@/hooks/useApiQuery', async () => {
  const { useState } = await import('react');
  return {
    useApiMutation: (fn: (v: unknown) => Promise<unknown>) => {
      const [data, setData] = useState<unknown>(undefined);
      return {
        data,
        isPending: false,
        isError: false,
        error: null,
        mutate: (v: unknown) => fn(v).then(setData),
      };
    },
  };
});
vi.mock('@/hooks/useCurrentRole', () => ({
  useHasRole: () => orgWide,
}));
vi.mock('./filterOptions', () => ({
  ALL: '__all__',
  useCycleOptions: () => [],
  useDepartmentOptions: () => [],
}));
vi.mock('@/components/departments/departmentFormData', () => ({
  useUnits: () => ({ units: [] }),
}));
vi.mock('@/components/competencies/modelFormData', () => ({
  usePositionOptions: () => ({ options: [] }),
}));
vi.mock('@/components/departments/DepartmentUserPicker', () => ({
  DepartmentUserPicker: () => <div />,
}));

const base = {
  totalEvaluations: 2,
  avgScore: 3.2,
  completionRate: 50,
  distribution: { exceptional: 0, above: 1, expected: 1, below: 0 },
  byDepartment: [],
  byUnit: [],
  byPosition: [],
  byManager: [],
  evolution: [],
  competencyGaps: [],
  objectivesAchieved: { total: 0, avgAchievement: null },
};

describe('ReportsTab — filtros e privacidade', () => {
  beforeEach(() => {
    orgWide = true;
    get.mockReset();
    overview = base;
    get.mockImplementation(async () => overview);
  });

  test('o pedido inclui tipo de avaliação e estado das ações escolhidos', async () => {
    render(<ReportsTab />);
    expect(screen.getByText('Tipo de avaliação')).toBeInTheDocument();
    expect(screen.getByText('Estado das ações')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Relatório' }));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(1));
    expect(get.mock.calls[0][0]).toBe('/evaluations/reports/overview');
  });

  test('mostra o aviso quando há grupos ocultos por privacidade', async () => {
    overview = {
      ...base,
      privacy: {
        minGroupSize: 3,
        restricted: false,
        suppressed: {
          byDepartment: 2,
          byUnit: 0,
          byPosition: 1,
          byManager: 0,
          evolution: 0,
        },
      },
    };
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Relatório' }));
    expect(
      await screen.findByText(/Alguns dados estão ocultos/),
    ).toBeInTheDocument();
    expect(screen.getByText(/menos de 3 avaliações/)).toBeInTheDocument();
    expect(screen.getByText('3 grupo(s) ocultos')).toBeInTheDocument();
  });

  test('sem nada oculto não mostra aviso', async () => {
    overview = {
      ...base,
      privacy: {
        minGroupSize: 3,
        restricted: false,
        suppressed: {
          byDepartment: 0,
          byUnit: 0,
          byPosition: 0,
          byManager: 0,
          evolution: 0,
        },
      },
    };
    render(<ReportsTab />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerar Relatório' }));
    await waitFor(() => expect(get).toHaveBeenCalled());
    expect(screen.queryByText(/Alguns dados estão ocultos/)).toBeNull();
  });

  test('ADMIN/RH têm filtro de gestor e exportações', () => {
    render(<ReportsTab />);
    expect(screen.getByText('CSV')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('PDF')).toBeInTheDocument();
    expect(screen.queryByText(/equipa que lidera diretamente/)).toBeNull();
  });

  test('chefias não têm exportações e veem o aviso de âmbito da equipa', () => {
    orgWide = false;
    render(<ReportsTab />);
    expect(screen.queryByText('CSV')).toBeNull();
    expect(screen.queryByText('Excel')).toBeNull();
    expect(screen.queryByText('PDF')).toBeNull();
    expect(
      screen.getByText(/equipa que lidera diretamente/),
    ).toBeInTheDocument();
  });
});
