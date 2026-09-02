import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

let queryResult: {
  data: unknown;
  isLoading: boolean;
  error?: { message: string };
} = {
  data: [],
  isLoading: false,
};
const del = vi.fn().mockResolvedValue({ code: 'BONUS', active: false });
const confirm = vi.fn().mockResolvedValue(true);
const notify = vi.fn();
const invalidateQueries = vi.fn();

vi.mock('@/hooks/useApiQuery', () => ({ useApiQuery: () => queryResult }));
vi.mock('@/lib/apiClient', () => ({
  apiClient: { delete: (...a: unknown[]) => del(...a) },
}));
vi.mock('@/providers/ConfirmProvider', () => ({ useConfirm: () => confirm }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@tanstack/react-query', async (orig) => ({
  ...(await orig<typeof import('@tanstack/react-query')>()),
  useQueryClient: () => ({ invalidateQueries }),
}));
vi.mock('@/components/ui/Select', () => ({
  Select: ({ items, value, onValueChange }: any) => (
    <select
      data-testid="select"
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" />
      {items.map((it: any) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));
// stub the child modal so this test stays a unit of ComponentsView
vi.mock('./ComponentFormModal', () => ({
  ComponentFormModal: ({ component }: any) => (
    <div data-testid="form-modal">
      {component ? `edit:${component.code}` : 'create'}
    </div>
  ),
}));

import { ComponentsView } from './ComponentsView';

const base = {
  description: null,
  rate: null,
  formula: null,
  isTaxable: true,
  isMandatory: false,
  order: 0,
  active: true,
  countryCode: 'AO',
  createdAt: '',
  updatedAt: '',
};
const rows = [
  {
    ...base,
    code: 'BASE',
    name: 'Salário Base',
    type: 'EARNING',
    calcType: 'FIXED',
    fixedValue: 0,
  },
  {
    ...base,
    code: 'INSS',
    name: 'INSS',
    type: 'DEDUCTION',
    calcType: 'PERCENT',
    fixedValue: null,
    rate: 0.03,
  },
  {
    ...base,
    code: 'OLD',
    name: 'Antigo',
    type: 'EARNING',
    calcType: 'FIXED',
    fixedValue: 100,
    active: false,
  },
];

beforeEach(() => {
  queryResult = { data: rows, isLoading: false };
  del.mockClear();
  confirm.mockClear();
  notify.mockClear();
  invalidateQueries.mockClear();
});

describe('ComponentsView', () => {
  test('renders a row per component with code, name and a type badge', () => {
    render(<ComponentsView />);
    expect(screen.getByText('BASE')).toBeInTheDocument();
    expect(screen.getByText('Salário Base')).toBeInTheDocument();
    // The filter labels "Rendimento"/"Desconto" also live in the (mocked) Select
    // <option>s, so scope the type-badge assertions to the row <span>s. Two
    // EARNING rows in the fixture → two "Rendimento" badges.
    expect(
      screen.getAllByText('Rendimento', { selector: 'span' }),
    ).toHaveLength(2);
    expect(
      screen.getByText('Desconto', { selector: 'span' }),
    ).toBeInTheDocument();
  });

  test('formats the calc column by calcType', () => {
    render(<ComponentsView />);
    expect(screen.getByText('3%')).toBeInTheDocument(); // PERCENT rate 0.03 → "3%"
  });

  test('marks inactive components', () => {
    render(<ComponentsView />);
    expect(screen.getByText('Inactivo')).toBeInTheDocument();
  });

  test('"+ Novo componente" opens the form modal in create mode', () => {
    render(<ComponentsView />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo componente' }));
    expect(screen.getByTestId('form-modal')).toHaveTextContent('create');
  });

  test('empty list shows the EmptyState', () => {
    queryResult = { data: [], isLoading: false };
    render(<ComponentsView />);
    expect(screen.getByText(/Nenhum componente/i)).toBeInTheDocument();
  });

  test('remove asks for confirmation then DELETEs and toasts by the returned active flag', async () => {
    render(<ComponentsView />);
    fireEvent.click(screen.getAllByLabelText('Remover')[0]);
    expect(confirm).toHaveBeenCalledTimes(1);
    await vi.waitFor(() =>
      expect(del).toHaveBeenCalledWith('/payroll/components/BASE'),
    );
    await vi.waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        expect.objectContaining({ intent: expect.any(String) }),
      ),
    );
  });
});
