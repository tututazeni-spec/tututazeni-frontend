import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue([]);
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e),
      ),
    isPending: false,
  }),
}));
vi.mock('./compensationData', () => ({
  useSalaryComponentOptions: () => ({
    options: [
      { value: 'TRANSPORT', label: 'TRANSPORT — Transporte (Rendimento)' },
      { value: 'MEAL', label: 'MEAL — Alimentação (Rendimento)' },
    ],
    byCode: {},
    loading: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => (
    <div>
      <h2>{title}</h2>
      {children}
    </div>
  ),
}));
vi.mock('@/components/ui/Select', () => ({
  Select: ({ items, value, onValueChange }: any) => (
    <select
      data-testid="code-select"
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

import { CompensationComponentsEditor } from './CompensationComponentsEditor';

const record = {
  id: 5,
  userId: 7,
  baseSalary: 120000,
  countryCode: 'AO',
  bankName: null,
  iban: null,
  accountNumber: null,
  effectiveFrom: '2026-01-01',
  effectiveTo: null,
  foodAllowance: null,
  transportAllowance: null,
  components: [
    {
      id: 1,
      compensationId: 5,
      componentCode: 'TRANSPORT',
      value: 15000,
      override: false,
    },
  ],
};

beforeEach(() => {
  post.mockClear();
  notify.mockClear();
});

describe('CompensationComponentsEditor', () => {
  test('renders one row per existing override', () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    expect(screen.getAllByTestId('code-select')).toHaveLength(1);
    expect(screen.getByDisplayValue('15000')).toBeInTheDocument();
  });

  test('add + remove a row', () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    expect(screen.getAllByTestId('code-select')).toHaveLength(2);
    fireEvent.click(screen.getAllByLabelText('Remover linha')[1]);
    expect(screen.getAllByTestId('code-select')).toHaveLength(1);
  });

  test('blocks save on a duplicate componentCode', () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    const selects = screen.getAllByTestId('code-select');
    fireEvent.change(selects[1], { target: { value: 'TRANSPORT' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/duplicad/i)).toBeInTheDocument();
  });

  test('blocks save on an empty value', () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    const selects = screen.getAllByTestId('code-select');
    fireEvent.change(selects[1], { target: { value: 'MEAL' } });
    // value left empty on the new row
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(post).not.toHaveBeenCalled();
  });

  test('save POSTs the full items array to :id/components + wires success (toast + onClose)', async () => {
    const onClose = vi.fn();
    render(<CompensationComponentsEditor record={record} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    const selects = screen.getAllByTestId('code-select');
    fireEvent.change(selects[1], { target: { value: 'MEAL' } });
    const values = screen.getAllByLabelText('Valor');
    fireEvent.change(values[1], { target: { value: '8000' } });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/payroll/compensation/5/components', {
      items: [
        { componentCode: 'TRANSPORT', value: 15000, override: false },
        { componentCode: 'MEAL', value: 8000, override: false },
      ],
    });
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(notify).toHaveBeenCalled();
  });

  test('F1: a referenced-but-inactive code (absent from options) still renders + POSTs', async () => {
    const recWithInactive = {
      ...record,
      components: [
        {
          id: 9,
          compensationId: 5,
          componentCode: 'BONUS_2024',
          value: 30000,
          override: true,
        },
      ],
    };
    render(
      <CompensationComponentsEditor
        record={recWithInactive}
        onClose={vi.fn()}
      />,
    );
    // the option is surfaced labelled "(inactivo)" so the admin can see the row
    expect(screen.getByText(/BONUS_2024 — \(inactivo\)/i)).toBeInTheDocument();
    // and Guardar still round-trips that code untouched
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/payroll/compensation/5/components', {
      items: [{ componentCode: 'BONUS_2024', value: 30000, override: true }],
    });
  });

  test('F3: blocks save when a row has a value but no component selected', () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    const values = screen.getAllByLabelText('Valor');
    fireEvent.change(values[1], { target: { value: '5000' } });
    // component left unpicked on the new row
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/componente seleccionado/i)).toBeInTheDocument();
  });

  test('F3: a fully blank row is still dropped silently (clear-line path)', async () => {
    render(<CompensationComponentsEditor record={record} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionar linha/ }));
    // new row left entirely blank — no code, no value
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/payroll/compensation/5/components', {
      items: [{ componentCode: 'TRANSPORT', value: 15000, override: false }],
    });
  });
});
