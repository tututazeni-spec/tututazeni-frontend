import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 42 });
const notify = vi.fn();

vi.mock('@/lib/apiClient', () => ({ apiClient: { post: (...a: unknown[]) => post(...a) } }));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (fn: (v: unknown) => Promise<unknown>, opts: any) => ({
    mutate: (v: unknown) =>
      Promise.resolve(fn(v)).then((d) => opts?.onSuccess?.(d, v), (e) => opts?.onError?.(e)),
    isPending: false,
  }),
}));
vi.mock('@/components/ui/Modal', () => ({
  Modal: ({ children }: any) => <div>{children}</div>,
  ModalContent: ({ title, children }: any) => <div><h2>{title}</h2>{children}</div>,
}));
vi.mock('@/components/payslips/compensationData', () => ({
  useDirectoryUsers: () => ({
    users: [{ id: 7, fullName: 'Ana Silva', employeeNumber: 'E-7' }],
    loading: false,
  }),
}));

import { CreatePayslipModal } from './CreatePayslipModal';

beforeEach(() => { post.mockClear(); notify.mockClear(); });

describe('CreatePayslipModal', () => {
  test('submit is disabled until employee, period, payment date and base salary are set', () => {
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={vi.fn()} />);
    const submit = screen.getByRole('button', { name: 'Criar recibo' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    expect(submit).toBeEnabled();
  });

  test('sends only filled fields; blank advanced fields are omitted', async () => {
    const onCreated = vi.fn();
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={onCreated} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar recibo' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, body] = post.mock.calls[0];
    expect(url).toBe('/payslips');
    expect(body).toEqual({
      userId: 7, period: '2026-06', paymentDate: '2026-06-25', baseSalary: 250000,
    });
    expect(onCreated).toHaveBeenCalledWith(42);
  });

  test('409 shows an error toast', async () => {
    post.mockRejectedValueOnce(Object.assign(new Error('Recibo já existe'), { status: 409 }));
    render(<CreatePayslipModal onClose={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Pesquisar colaborador/i), { target: { value: 'Ana' } });
    fireEvent.click(screen.getByText('Ana Silva'));
    fireEvent.change(screen.getByLabelText(/Período/i), { target: { value: '2026-06' } });
    fireEvent.change(screen.getByLabelText(/Data de pagamento/i), { target: { value: '2026-06-25' } });
    fireEvent.change(screen.getByLabelText(/Salário base/i), { target: { value: '250000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar recibo' }));
    await waitFor(() => expect(notify).toHaveBeenCalledWith(expect.objectContaining({ intent: 'danger' })));
  });
});
