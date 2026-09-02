import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 99 });
const put = vi.fn().mockResolvedValue({ id: 5 });
const notify = vi.fn();
let directoryUsers: any[] = [];

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    post: (...a: unknown[]) => post(...a),
    put: (...a: unknown[]) => put(...a),
  },
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useDebounce', () => ({ useDebounce: (v: unknown) => v }));
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
  useDirectoryUsers: () => ({ users: directoryUsers, loading: false }),
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

import { CompensationFormModal } from './CompensationFormModal';

const record = {
  id: 5,
  userId: 7,
  baseSalary: 120000,
  countryCode: 'AO',
  bankName: 'BAI',
  iban: 'AO0600',
  accountNumber: '123',
  effectiveFrom: '2026-01-01T00:00:00.000Z',
  effectiveTo: null,
  foodAllowance: 10000,
  transportAllowance: 5000,
  components: [],
  user: {
    id: 7,
    fullName: 'Ana Silva',
    employeeNumber: 'E-7',
    department: null,
  },
};

beforeEach(() => {
  post.mockClear();
  put.mockClear();
  notify.mockClear();
  directoryUsers = [];
});

describe('CompensationFormModal', () => {
  test('create from toolbar shows the employee search', () => {
    render(<CompensationFormModal mode="create" onClose={vi.fn()} />);
    expect(
      screen.getByPlaceholderText(/Pesquisar.*colaborador/i),
    ).toBeInTheDocument();
  });

  test('create with a fixed userId hides the search and POSTs that userId', async () => {
    render(
      <CompensationFormModal mode="create" userId={7} onClose={vi.fn()} />,
    );
    expect(
      screen.queryByPlaceholderText(/Pesquisar.*colaborador/i),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Salário base/i), {
      target: { value: '130000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Criar/ }));
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/payroll/compensation',
      expect.objectContaining({
        userId: 7,
        baseSalary: 130000,
      }),
    );
  });

  test('create requires a positive base salary', () => {
    render(
      <CompensationFormModal mode="create" userId={7} onClose={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Criar/ }));
    expect(post).not.toHaveBeenCalled();
  });

  test('edit shows the in-place warning, no employee field, PUTs without userId', async () => {
    render(
      <CompensationFormModal mode="edit" record={record} onClose={vi.fn()} />,
    );
    expect(
      screen.getByText(/corrige este registo no lugar/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/Pesquisar.*colaborador/i),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Salário base/i), {
      target: { value: '125000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const [url, body] = put.mock.calls[0];
    expect(url).toBe('/payroll/compensation/5');
    expect(body).not.toHaveProperty('userId');
    expect(body).toMatchObject({ baseSalary: 125000 });
  });

  test('picking a searched employee enables create submit', async () => {
    directoryUsers = [{ id: 42, fullName: 'Rui Costa', department: null }];
    render(<CompensationFormModal mode="create" onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar.*colaborador/i), {
      target: { value: 'rui' },
    });
    fireEvent.click(screen.getByText('Rui Costa'));
    fireEvent.change(screen.getByLabelText(/Salário base/i), {
      target: { value: '90000' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Criar/ }));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/payroll/compensation',
        expect.objectContaining({ userId: 42, baseSalary: 90000 }),
      ),
    );
  });
});
