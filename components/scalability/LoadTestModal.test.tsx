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

import { LoadTestModal } from './LoadTestModal';

beforeEach(() => notify.mockReset());

describe('LoadTestModal', () => {
  test('submete com os valores por omissão — toast resume a configuração', () => {
    const onClose = vi.fn();
    render(<LoadTestModal onClose={onClose} />);

    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/api/courses' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Agendar teste' }));

    expect(notify).toHaveBeenCalledTimes(1);
    const arg = notify.mock.calls[0][0];
    expect(arg.intent).toBe('success');
    expect(arg.title).toContain('100');
    expect(arg.title).toContain('/api/courses');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('rejeita utilizadores simultâneos fora dos limites (1–10000)', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Utilizadores simultâneos *'), {
      target: { value: '99999' },
    });

    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Agendar teste' }));
    expect(notify).not.toHaveBeenCalled();
  });

  test('rejeita duração abaixo de 30s', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Duração (segundos) *'), {
      target: { value: '10' },
    });
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });

  test('endpoint alvo em falta — botão desactivado', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });

  test('rampa opcional inválida bloqueia a submissão', () => {
    render(<LoadTestModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Endpoint alvo *'), {
      target: { value: '/x' },
    });
    fireEvent.change(screen.getByLabelText('Rampa de subida (segundos)'), {
      target: { value: '-5' },
    });
    expect(
      screen.getByRole('button', { name: 'Agendar teste' }),
    ).toBeDisabled();
  });
});
