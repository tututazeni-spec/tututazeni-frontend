import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const notify = vi.fn();

vi.mock('@/providers/ToastProvider', () => ({
  useToast: () => notify,
}));

vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({ data: { fullName: 'Maria Santos' } }),
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

import { GiveFeedbackModal } from './GiveFeedbackModal';

beforeEach(() => notify.mockReset());

describe('GiveFeedbackModal', () => {
  test('envia feedback com a mensagem e o nome do utilizador actual', () => {
    const onClose = vi.fn();
    const onCreate = vi.fn();
    render(<GiveFeedbackModal onClose={onClose} onCreate={onCreate} />);

    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'Excelente trabalho na apresentação.' },
    });
    fireEvent.change(screen.getByLabelText('Competência'), {
      target: { value: 'Comunicação' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }));

    expect(onCreate).toHaveBeenCalledTimes(1);
    const fb = onCreate.mock.calls[0][0];
    expect(fb.message).toBe('Excelente trabalho na apresentação.');
    expect(fb.competency).toBe('Comunicação');
    expect(fb.fromName).toBe('Maria Santos');
    expect(fb.type).toBe('RECOGNITION');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('mensagem demasiado curta mantém o botão desactivado', () => {
    render(<GiveFeedbackModal onClose={vi.fn()} onCreate={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Enviar Feedback' }),
    ).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'ok' },
    });
    expect(
      screen.getByRole('button', { name: 'Enviar Feedback' }),
    ).toBeDisabled();
  });

  test('competência vazia é omitida do feedback', () => {
    const onCreate = vi.fn();
    render(<GiveFeedbackModal onClose={vi.fn()} onCreate={onCreate} />);
    fireEvent.change(screen.getByLabelText('Mensagem *'), {
      target: { value: 'Boa colaboração esta semana.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }));
    expect(onCreate.mock.calls[0][0].competency).toBeUndefined();
  });
});
