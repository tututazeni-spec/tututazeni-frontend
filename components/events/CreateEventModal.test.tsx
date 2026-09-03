import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

// useApiMutation: executa `fn` e encaminha para onSuccess/onError, como o
// mock de CreateLiveClassModal.test.tsx.
vi.mock('@/hooks/useApiQuery', () => ({
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
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

// Select stub: expõe um botão por opção que chama onValueChange.
vi.mock('@/components/ui/Select', () => ({
  Select: ({
    items,
    onValueChange,
  }: {
    items: Array<{ value: string; label: string }>;
    onValueChange: (v: string) => void;
  }) => (
    <div>
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onValueChange(it.value)}
        >
          {`pick:${it.value}`}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { CreateEventModal } from './CreateEventModal';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function fillRequired() {
  fireEvent.change(screen.getByLabelText('Título *'), {
    target: { value: '  Workshop Q1  ' },
  });
  fireEvent.change(screen.getByLabelText('Início *'), {
    target: { value: '2026-12-31T09:00' },
  });
  fireEvent.change(screen.getByLabelText('Fim *'), {
    target: { value: '2026-12-31T12:00' },
  });
}

describe('CreateEventModal', () => {
  test('payload mínimo — título trim, datas ISO, capacidade default numérica', async () => {
    render(<CreateEventModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/events', {
      title: 'Workshop Q1',
      type: 'TRAINING',
      modalidade: 'ONLINE',
      startAt: new Date('2026-12-31T09:00').toISOString(),
      endAt: new Date('2026-12-31T12:00').toISOString(),
      maxCapacity: 50,
    });
  });

  test('campos opcionais + selects — inclui type/modalidade escolhidos, local, link e descrição', async () => {
    render(<CreateEventModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'pick:WORKSHOP' }));
    fireEvent.click(screen.getByRole('button', { name: 'pick:PRESENCIAL' }));
    fireEvent.change(screen.getByLabelText('Capacidade máxima *'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByLabelText('Local'), {
      target: { value: '  Auditório  ' },
    });
    fireEvent.change(screen.getByLabelText('Link da reunião'), {
      target: { value: ' https://meet.example/1 ' },
    });
    fireEvent.change(screen.getByLabelText('Descrição'), {
      target: { value: '  Agenda cheia  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/events', {
      title: 'Workshop Q1',
      type: 'WORKSHOP',
      modalidade: 'PRESENCIAL',
      startAt: new Date('2026-12-31T09:00').toISOString(),
      endAt: new Date('2026-12-31T12:00').toISOString(),
      maxCapacity: 30,
      location: 'Auditório',
      meetingUrl: 'https://meet.example/1',
      description: 'Agenda cheia',
    });
  });

  test('sem obrigatórios — botão desactivado, não submete', () => {
    render(<CreateEventModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Criar evento' })).toBeDisabled();
  });

  test('fim antes do início — botão desactivado', () => {
    render(<CreateEventModal onClose={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'X' },
    });
    fireEvent.change(screen.getByLabelText('Início *'), {
      target: { value: '2026-12-31T12:00' },
    });
    fireEvent.change(screen.getByLabelText('Fim *'), {
      target: { value: '2026-12-31T09:00' },
    });
    expect(screen.getByRole('button', { name: 'Criar evento' })).toBeDisabled();
  });

  test('erro da API — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<CreateEventModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }));

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });
});
