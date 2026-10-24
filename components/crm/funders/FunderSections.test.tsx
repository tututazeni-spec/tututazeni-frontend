import { describe, expect, test, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

// Mutations simuladas: guardam os argumentos e deixam o teste disparar o
// onSuccess, como o React Query faria depois do pedido.
const createGrant = { mutate: vi.fn(), isPending: false };
const createReport = { mutate: vi.fn(), isPending: false };
const submitReport = { mutate: vi.fn(), isPending: false };
const idle = { mutate: vi.fn(), isPending: false };
vi.mock('@/hooks/useFunderActions', () => ({
  useCreateGrant: () => createGrant,
  useUpdateGrantStatus: () => idle,
  useAddDisbursement: () => idle,
  useCreateReport: () => createReport,
  useSubmitReport: () => submitReport,
  useCreateInteraction: () => idle,
}));

import { GrantsSection } from './GrantsSection';
import { ReportsSection } from './ReportsSection';
import type { FunderDetail } from './types';

beforeEach(() => vi.clearAllMocks());

describe('GrantsSection', () => {
  test('submeter envia o formulário e, em sucesso, fecha-o e limpa os campos', () => {
    render(<GrantsSection funderId="f1" grants={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo Grant' }));
    fireEvent.change(screen.getByPlaceholderText('Título do grant'), {
      target: { value: 'Grant A' },
    });
    fireEvent.change(screen.getByPlaceholderText('Valor (AOA)'), {
      target: { value: '1000' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Criar Grant' }).closest('form')!,
    );

    const [form, opts] = createGrant.mutate.mock.calls[0];
    expect(form).toMatchObject({ title: 'Grant A', amount: '1000' });

    act(() => opts.onSuccess());
    // formulário fechado...
    expect(screen.queryByPlaceholderText('Título do grant')).toBeNull();
    // ...e limpo ao reabrir
    fireEvent.click(screen.getByRole('button', { name: '+ Novo Grant' }));
    expect(screen.getByPlaceholderText('Título do grant')).toHaveValue('');
  });

  test('em erro o formulário mantém-se aberto com o que foi escrito', () => {
    render(<GrantsSection funderId="f1" grants={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo Grant' }));
    fireEvent.change(screen.getByPlaceholderText('Título do grant'), {
      target: { value: 'Grant A' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Criar Grant' }).closest('form')!,
    );
    // sem chamar onSuccess
    expect(screen.getByPlaceholderText('Título do grant')).toHaveValue(
      'Grant A',
    );
  });
});

const REPORTS = [
  {
    id: 'r1',
    title: 'Q1',
    period: 'Q1 2026',
    dueDate: '2026-04-01',
    status: 'PENDING',
  },
  {
    id: 'r2',
    title: 'Q2',
    period: 'Q2 2026',
    dueDate: '2026-07-01',
    status: 'PENDING',
  },
] as unknown as FunderDetail['reports'];

describe('ReportsSection', () => {
  test('só um relatório de cada vez mostra o campo do link', () => {
    render(<ReportsSection funderId="f1" reports={REPORTS} grants={[]} />);
    const buttons = screen.getAllByRole('button', { name: 'Submeter' });
    fireEvent.click(buttons[0]);
    expect(screen.getAllByPlaceholderText(/link do relatório/)).toHaveLength(1);
    // o botão "Submeter" do relatório aberto desaparece; o outro mantém-se
    expect(screen.getAllByRole('button', { name: 'Submeter' })).toHaveLength(1);
  });

  test('confirmar envia o link sem espaços e, em sucesso, fecha e avisa', () => {
    render(<ReportsSection funderId="f1" reports={REPORTS} grants={[]} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Submeter' })[0]);
    const confirm = screen.getByRole('button', { name: 'Confirmar' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/link do relatório/), {
      target: { value: '  https://x.pt/r.pdf ' },
    });
    fireEvent.click(confirm);

    const [vars, opts] = submitReport.mutate.mock.calls[0];
    expect(vars).toEqual({ reportId: 'r1', fileUrl: 'https://x.pt/r.pdf' });

    act(() => opts.onSuccess());
    expect(screen.queryByPlaceholderText(/link do relatório/)).toBeNull();
    expect(notify).toHaveBeenCalledWith({
      title: 'Relatório submetido.',
      intent: 'success',
    });
  });

  test('cancelar limpa o link', () => {
    render(<ReportsSection funderId="f1" reports={REPORTS} grants={[]} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Submeter' })[0]);
    fireEvent.change(screen.getByPlaceholderText(/link do relatório/), {
      target: { value: 'https://x.pt' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Submeter' })[0]);
    expect(screen.getByPlaceholderText(/link do relatório/)).toHaveValue('');
  });
});
