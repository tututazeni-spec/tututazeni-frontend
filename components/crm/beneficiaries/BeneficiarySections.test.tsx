import { describe, expect, test, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

const addInteraction = { mutate: vi.fn(), isPending: false };
const addNeed = { mutate: vi.fn(), isPending: false };
vi.mock('@/hooks/useBeneficiaryActions', () => ({
  useAddBeneficiaryInteraction: () => addInteraction,
  useAddNeed: () => addNeed,
}));

import { InteractionsSection } from './InteractionsSection';
import { NeedsSection } from './NeedsSection';
import type { BeneficiaryDetail } from './types';

beforeEach(() => vi.clearAllMocks());

describe('InteractionsSection (beneficiário)', () => {
  test('é optimista: ao submeter fecha e limpa o formulário sem esperar pela API', () => {
    render(<InteractionsSection beneficiaryId="b1" interactions={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Interacção' }));
    fireEvent.change(screen.getByPlaceholderText('Assunto'), {
      target: { value: 'Visita' },
    });
    fireEvent.change(screen.getByPlaceholderText('Descrição'), {
      target: { value: 'Casa' },
    });
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Guardar Interacção' })
        .closest('form')!,
    );
    expect(addInteraction.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Visita', description: 'Casa' }),
    );
    // fechado sem ter chamado nenhum onSuccess
    expect(screen.queryByPlaceholderText('Assunto')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Interacção' }));
    expect(screen.getByPlaceholderText('Assunto')).toHaveValue('');
  });

  test('entrada optimista aparece esbatida com "A guardar…"', () => {
    const items = [
      {
        id: 'optimistic-1',
        type: 'NOTE',
        subject: 'Nova',
        description: 'x',
        date: new Date().toISOString(),
        outcome: null,
        satisfaction: null,
        user: null,
        _optimistic: true,
      },
    ] as unknown as BeneficiaryDetail['interactions'];
    render(<InteractionsSection beneficiaryId="b1" interactions={items} />);
    expect(screen.getByText('A guardar…')).toBeInTheDocument();
  });
});

describe('NeedsSection', () => {
  test('em sucesso fecha, limpa e avisa; em erro mantém o formulário', () => {
    render(<NeedsSection beneficiaryId="b1" needs={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Necessidade' }));
    fireEvent.change(screen.getByPlaceholderText(/Categoria/), {
      target: { value: 'Saúde' },
    });
    fireEvent.change(screen.getByPlaceholderText('Descrição'), {
      target: { value: 'Consulta' },
    });
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Guardar Necessidade' })
        .closest('form')!,
    );
    const [form, opts] = addNeed.mutate.mock.calls[0];
    expect(form).toMatchObject({ category: 'Saúde', description: 'Consulta' });
    // antes do onSuccess continua aberto
    expect(screen.getByPlaceholderText(/Categoria/)).toHaveValue('Saúde');

    act(() => opts.onSuccess());
    expect(screen.queryByPlaceholderText(/Categoria/)).toBeNull();
    expect(notify).toHaveBeenCalledWith({
      title: 'Necessidade registada.',
      intent: 'success',
    });
  });
});
