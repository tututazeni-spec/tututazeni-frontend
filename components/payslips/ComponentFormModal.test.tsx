import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ code: 'NEW' });
const put = vi.fn().mockResolvedValue({ code: 'BASE' });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error),
      ),
    isPending: false,
  }),
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
// `Select` (design system) não encaminha `id`; damos `data-testid` estável a
// partir do primeiro item — `cf-type` começa em EARNING, `cf-calc` em FIXED.
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
      data-testid={items[0].value === 'EARNING' ? 'cf-type' : 'cf-calc'}
      value={value ?? ''}
      onChange={(e) => onValueChange(e.target.value)}
    >
      <option value="" />
      {items.map((it) => (
        <option key={it.value} value={it.value}>
          {it.label}
        </option>
      ))}
    </select>
  ),
}));

import { ComponentFormModal } from './ComponentFormModal';

const existing = {
  code: 'BASE',
  name: 'Salário Base',
  description: 'A base',
  type: 'EARNING' as const,
  calcType: 'FIXED' as const,
  fixedValue: 90000,
  rate: null,
  formula: null,
  isTaxable: true,
  isMandatory: true,
  order: 1,
  active: true,
  countryCode: 'AO',
  createdAt: '',
  updatedAt: '',
};

beforeEach(() => {
  post.mockClear();
  put.mockClear();
  notify.mockClear();
});

describe('ComponentFormModal — create', () => {
  test('shows the código field and "Novo componente" title', () => {
    render(<ComponentFormModal onClose={vi.fn()} />);
    expect(screen.getByText('Novo componente')).toBeInTheDocument();
    expect(screen.getByLabelText(/Código/)).toBeEnabled();
  });

  test('blocks submit when the calcType-required conditional field is empty', () => {
    render(<ComponentFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Código/), {
      target: { value: 'PREMIO' },
    });
    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: 'Prémio' },
    });
    fireEvent.change(screen.getByTestId('cf-type'), {
      target: { value: 'EARNING' },
    });
    fireEvent.change(screen.getByTestId('cf-calc'), {
      target: { value: 'FIXED' },
    });
    // fixedValue still empty
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(/Valor fixo.*obrigatóri/i)).toBeInTheDocument();
  });

  test('changing calcType swaps the conditional field', () => {
    render(<ComponentFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByTestId('cf-calc'), {
      target: { value: 'PERCENT' },
    });
    expect(screen.getByLabelText(/Taxa/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Valor fixo/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('cf-calc'), {
      target: { value: 'TABLE' },
    });
    expect(screen.queryByLabelText(/Taxa/)).not.toBeInTheDocument();
  });

  test('valid create POSTs the expected body', async () => {
    render(<ComponentFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Código/), {
      target: { value: ' premio ' },
    });
    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: 'Prémio' },
    });
    fireEvent.change(screen.getByTestId('cf-type'), {
      target: { value: 'EARNING' },
    });
    fireEvent.change(screen.getByTestId('cf-calc'), {
      target: { value: 'FIXED' },
    });
    fireEvent.change(screen.getByLabelText(/Valor fixo/), {
      target: { value: '25000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/payroll/components',
      expect.objectContaining({
        code: 'PREMIO',
        name: 'Prémio',
        type: 'EARNING',
        calcType: 'FIXED',
        fixedValue: 25000,
        isTaxable: true,
        isMandatory: false,
        order: 0,
        countryCode: 'AO',
      }),
    );
  });
});

describe('ComponentFormModal — edit', () => {
  test('hides the código field, prefills, PUTs without code', async () => {
    render(<ComponentFormModal component={existing} onClose={vi.fn()} />);
    expect(screen.getByText('Editar componente')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Código/)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Nome/)).toHaveValue('Salário Base');
    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: 'Salário Base X' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/payroll/components/BASE');
    expect(body).not.toHaveProperty('code');
    expect(body).toMatchObject({
      name: 'Salário Base X',
      calcType: 'FIXED',
      fixedValue: 90000,
    });
  });

  test('server 500 on duplicate code is shown verbatim', async () => {
    post.mockRejectedValueOnce(
      new Error('Unique constraint failed on the fields: (`code`)'),
    );
    render(<ComponentFormModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Código/), {
      target: { value: 'BASE' },
    });
    fireEvent.change(screen.getByLabelText(/Nome/), {
      target: { value: 'Dup' },
    });
    fireEvent.change(screen.getByTestId('cf-type'), {
      target: { value: 'EARNING' },
    });
    fireEvent.change(screen.getByTestId('cf-calc'), {
      target: { value: 'TABLE' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(
      await screen.findByText(/Unique constraint failed/),
    ).toBeInTheDocument();
  });
});
