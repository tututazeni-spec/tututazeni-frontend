import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: any = { data: undefined, isLoading: false };
vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: () => queryResult }));
vi.mock('./CompensationFormModal', () => ({
  CompensationFormModal: ({ mode, userId, record }: any) => (
    <div data-testid="form-modal">{`${mode}:${userId ?? record?.id ?? 'none'}`}</div>
  ),
}));
vi.mock('./CompensationComponentsEditor', () => ({
  CompensationComponentsEditor: ({ record }: any) => (
    <div data-testid="components-editor">{record.id}</div>
  ),
}));

import { CompensationDetailView } from './CompensationDetailView';

const user = {
  id: 7,
  fullName: 'Ana Silva',
  employeeNumber: 'E-7',
  department: { id: 2, name: 'Financeiro' },
};
const history = [
  {
    id: 20,
    userId: 7,
    baseSalary: 150000,
    countryCode: 'AO',
    bankName: 'BAI',
    iban: 'AO06004400006729503010102',
    accountNumber: '99887',
    effectiveFrom: '2026-06-01T00:00:00.000Z',
    effectiveTo: null,
    foodAllowance: 20000,
    transportAllowance: 15000,
    components: [
      {
        id: 1,
        compensationId: 20,
        componentCode: 'TRANSPORT',
        value: 15000,
        override: false,
      },
    ],
    user,
  },
  {
    id: 10,
    userId: 7,
    baseSalary: 120000,
    countryCode: 'AO',
    bankName: 'BAI',
    iban: 'AO0600',
    accountNumber: '99887',
    effectiveFrom: '2026-01-01T00:00:00.000Z',
    effectiveTo: '2026-05-31T23:59:59.000Z',
    foodAllowance: null,
    transportAllowance: null,
    components: [],
    user,
  },
];

beforeEach(() => {
  queryResult = { data: history, isLoading: false };
});

describe('CompensationDetailView', () => {
  test('active card shows values and the raw IBAN', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    expect(screen.getByText('Ana Silva')).toBeInTheDocument();
    // baseSalary is rendered in the active card and again in its timeline row.
    expect(screen.getAllByText(/150.?000/).length).toBeGreaterThan(0);
    expect(screen.getByText('AO06004400006729503010102')).toBeInTheDocument();
  });

  test('timeline lists every record with an "Activo" badge on the open one and closed ranges', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    // "Activo" badge shows on the active card and on the open timeline row.
    expect(screen.getAllByText('Activo').length).toBeGreaterThanOrEqual(1);
    // two timeline entries
    expect(screen.getAllByText(/2026/).length).toBeGreaterThanOrEqual(2);
  });

  test('action buttons open the right modals', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Corrigir registo/ }));
    expect(screen.getByTestId('form-modal')).toHaveTextContent('edit:20');
  });

  test('"Gerir componentes" opens the editor for the active record', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Gerir componentes/ }));
    expect(screen.getByTestId('components-editor')).toHaveTextContent('20');
  });

  test('"Nova versão" opens create with the fixed userId', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Nova versão/ }));
    expect(screen.getByTestId('form-modal')).toHaveTextContent('create:7');
  });

  test('no active record → warning + "Criar compensação" CTA', () => {
    queryResult = { data: [history[1]], isLoading: false };
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    expect(
      screen.getByText(/sem registo de compensação activo/i),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Criar compensação/ }));
    expect(screen.getByTestId('form-modal')).toHaveTextContent('create:7');
  });

  test('empty history → EmptyState, header falls back to #id', () => {
    queryResult = { data: [], isLoading: false };
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    expect(screen.getByText('#7')).toBeInTheDocument();
  });

  test('expanding a timeline row reveals its components', () => {
    render(<CompensationDetailView userId={7} onBack={vi.fn()} />);
    fireEvent.click(
      screen.getAllByRole('button', { name: /ver componentes/i })[0],
    );
    expect(screen.getByText('TRANSPORT')).toBeInTheDocument();
  });
});
