import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// useApiQuery é totalmente mockado — o componente não fala com a rede.
// Mesmo padrão de components/onboarding/PlansView.test.tsx.
let queryResult: {
  data: unknown;
  isLoading: boolean;
  error?: { message: string };
} = { data: undefined, isLoading: false };

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => queryResult,
}));

import { CompensationView } from './CompensationView';

const full = {
  baseSalary: 250000,
  foodAllowance: 30000,
  transportAllowance: 15000,
  bankName: 'Banco Millennium',
  ibanMasked: '•••••••••1234',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
};

beforeEach(() => {
  queryResult = { data: full, isLoading: false };
});

describe('CompensationView', () => {
  test('mostra os campos da compensação actual', () => {
    render(<CompensationView />);
    expect(screen.getByText('Salário base')).toBeInTheDocument();
    expect(screen.getByText('Subsídio de alimentação')).toBeInTheDocument();
    expect(screen.getByText('Subsídio de transporte')).toBeInTheDocument();
    expect(screen.getByText('Banco Millennium')).toBeInTheDocument();
    expect(screen.getByText('•••••••••1234')).toBeInTheDocument();
  });

  test('rodapé indica desde quando a compensação está em vigor', () => {
    render(<CompensationView />);
    expect(
      screen.getByText((t) => t.startsWith('Em vigor desde')),
    ).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  test('esconde as linhas de subsídio quando são nulas', () => {
    queryResult = {
      data: { ...full, foodAllowance: null, transportAllowance: null },
      isLoading: false,
    };
    render(<CompensationView />);
    expect(
      screen.queryByText('Subsídio de alimentação'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Subsídio de transporte'),
    ).not.toBeInTheDocument();
    // Os campos base continuam presentes.
    expect(screen.getByText('Salário base')).toBeInTheDocument();
  });

  test('banco e IBAN em falta caem para travessão', () => {
    queryResult = {
      data: { ...full, bankName: null, ibanMasked: null },
      isLoading: false,
    };
    render(<CompensationView />);
    expect(screen.getByText('Banco')).toBeInTheDocument();
    expect(screen.getByText('IBAN')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
  });

  test('data a null mostra o estado vazio e nenhum valor', () => {
    queryResult = { data: null, isLoading: false };
    render(<CompensationView />);
    expect(
      screen.getByText(/Ainda não há informação de compensação registada/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Salário base')).not.toBeInTheDocument();
  });

  test('durante o carregamento não pisca o estado vazio', () => {
    queryResult = { data: undefined, isLoading: true };
    render(<CompensationView />);
    expect(
      screen.queryByText(/Ainda não há informação de compensação registada/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Salário base')).not.toBeInTheDocument();
  });
});
