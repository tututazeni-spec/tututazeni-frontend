import { describe, expect, test, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

const createMilestone = { mutate: vi.fn(), isPending: false };
const completeMilestone = { mutate: vi.fn(), isPending: false };
const createInteraction = { mutate: vi.fn(), isPending: false };
vi.mock('@/hooks/usePartnerActions', () => ({
  useCreateMilestone: () => createMilestone,
  useCompleteMilestone: () => completeMilestone,
  useCreatePartnerInteraction: () => createInteraction,
}));

import { InteractionsSection } from './InteractionsSection';
import { MilestonesSection } from './MilestonesSection';
import type { PartnerDetail } from './types';

beforeEach(() => vi.clearAllMocks());

const MILESTONES = [
  {
    id: 'm1',
    title: 'Contrato',
    dueDate: '2026-01-01',
    status: 'PENDING',
    currency: 'AOA',
    value: null,
    description: null,
  },
  {
    id: 'm2',
    title: 'Entrega',
    dueDate: '2026-02-01',
    status: 'COMPLETED',
    currency: 'AOA',
    value: null,
    description: null,
  },
] as unknown as PartnerDetail['milestones'];

describe('MilestonesSection', () => {
  test('"Concluir" só aparece em marcos por concluir e chama a mutation com o id', () => {
    render(<MilestonesSection partnerId="p1" milestones={MILESTONES} />);
    const buttons = screen.getAllByRole('button', { name: 'Concluir' });
    expect(buttons).toHaveLength(1);
    fireEvent.click(buttons[0]);
    expect(completeMilestone.mutate).toHaveBeenCalledWith('m1');
  });

  test('criar envia o formulário (moeda AOA por omissão) e, em sucesso, fecha e limpa', () => {
    render(<MilestonesSection partnerId="p1" milestones={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Novo Marco' }));
    fireEvent.change(screen.getByPlaceholderText('Título'), {
      target: { value: 'Revisão' },
    });
    fireEvent.submit(
      screen.getByRole('button', { name: 'Criar Marco' }).closest('form')!,
    );
    const [form, opts] = createMilestone.mutate.mock.calls[0];
    expect(form).toMatchObject({
      title: 'Revisão',
      currency: 'AOA',
      priority: 'MEDIUM',
    });

    act(() => opts.onSuccess());
    expect(screen.queryByPlaceholderText('Título')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '+ Novo Marco' }));
    expect(screen.getByPlaceholderText('Título')).toHaveValue('');
  });
});

describe('InteractionsSection (parceiro)', () => {
  test('envia a satisfação e mantém o formulário aberto em erro', () => {
    render(<InteractionsSection partnerId="p1" interactions={[]} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Nova Interacção' }));
    fireEvent.change(screen.getByPlaceholderText('Assunto'), {
      target: { value: 'Reunião' },
    });
    fireEvent.change(screen.getByPlaceholderText('Satisfação (1-5)'), {
      target: { value: '4' },
    });
    fireEvent.submit(
      screen
        .getByRole('button', { name: 'Guardar Interacção' })
        .closest('form')!,
    );
    expect(createInteraction.mutate.mock.calls[0][0]).toMatchObject({
      subject: 'Reunião',
      satisfaction: '4',
    });
    // sem onSuccess: continua aberto com o que foi escrito
    expect(screen.getByPlaceholderText('Assunto')).toHaveValue('Reunião');
  });
});
