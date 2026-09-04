import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
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

vi.mock('@/components/ui/Select', () => ({
  Select: ({ value }: { value?: string }) => <div data-testid="select">{value}</div>,
}));

import { CreateCycleModal } from './CreateCycleModal';

beforeEach(() => notify.mockReset());

describe('CreateCycleModal', () => {
  test('cria um ciclo em rascunho com os campos preenchidos', () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();
    render(<CreateCycleModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'Avaliação Anual 2026' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.change(screen.getByLabelText('Participantes'), {
      target: { value: '42' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Ciclo' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const cycle = onCreate.mock.calls[0][0];
    expect(cycle.name).toBe('Avaliação Anual 2026');
    expect(cycle.status).toBe('DRAFT');
    expect(cycle.participantsCount).toBe(42);
    expect(cycle.completedCount).toBe(0);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('botão desactivado sem nome', () => {
    render(<CreateCycleModal onClose={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-06-30' },
    });
    expect(
      screen.getByRole('button', { name: 'Criar Ciclo' }),
    ).toBeDisabled();
  });

  test('rejeita data de fim anterior à de início', () => {
    render(<CreateCycleModal onClose={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-01-01' },
    });
    expect(
      screen.getByRole('button', { name: 'Criar Ciclo' }),
    ).toBeDisabled();
    expect(
      screen.getByText('A data de fim não pode ser anterior à de início.'),
    ).toBeInTheDocument();
  });

  test('participantes não numérico bloqueia a submissão', () => {
    render(<CreateCycleModal onClose={vi.fn()} onCreate={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Nome *'), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-06-30' },
    });
    fireEvent.change(screen.getByLabelText('Participantes'), {
      target: { value: 'abc' },
    });
    expect(
      screen.getByRole('button', { name: 'Criar Ciclo' }),
    ).toBeDisabled();
  });
});
