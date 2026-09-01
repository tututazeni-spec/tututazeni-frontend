import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

// useApiMutation: executa `fn` e encaminha para onSuccess/onError, como o
// mock de EnrollUserModal.test.tsx. useApiQuery: devolve o catálogo de
// cursos que o Combobox consome.
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
  useApiQuery: () => ({
    data: { data: [{ id: 7, title: 'Curso 7' }] },
    isLoading: false,
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

vi.mock('@/components/ui/Combobox', () => ({
  Combobox: ({
    items,
    onValueChange,
  }: {
    items: Array<{ value: string; label: string }>;
    onValueChange: (v: string) => void;
  }) => (
    <button type="button" onClick={() => onValueChange(items[0]?.value)}>
      stub-pick-course
    </button>
  ),
}));

vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

import { CreateLiveClassModal } from './CreateLiveClassModal';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function fillRequired() {
  fireEvent.click(screen.getByRole('button', { name: 'stub-pick-course' }));
  fireEvent.change(screen.getByLabelText('Tópico *'), {
    target: { value: '  Introdução ao CRM  ' },
  });
  fireEvent.change(screen.getByLabelText('Data e hora *'), {
    target: { value: '2026-12-31T14:30' },
  });
  fireEvent.change(screen.getByLabelText('Duração (min) *'), {
    target: { value: '90' },
  });
}

describe('CreateLiveClassModal', () => {
  test('payload mínimo — ids numéricos, data ISO, tópico trim', async () => {
    render(<CreateLiveClassModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Aula' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/live-classes', {
      courseId: 7,
      topic: 'Introdução ao CRM',
      scheduledAt: new Date('2026-12-31T14:30').toISOString(),
      duration: 90,
    });
  });

  test('campos opcionais — inclui recordingUrl + zoomMeetingId', async () => {
    render(<CreateLiveClassModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.change(screen.getByLabelText('URL da gravação'), {
      target: { value: ' https://rec.example/1 ' },
    });
    fireEvent.change(screen.getByLabelText('ID da reunião'), {
      target: { value: ' 123 456 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Aula' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/live-classes', {
      courseId: 7,
      topic: 'Introdução ao CRM',
      scheduledAt: new Date('2026-12-31T14:30').toISOString(),
      duration: 90,
      recordingUrl: 'https://rec.example/1',
      zoomMeetingId: '123 456',
    });
  });

  test('sem os obrigatórios — botão desactivado, não submete', () => {
    render(<CreateLiveClassModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Aula' }));
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Criar Aula' })).toBeDisabled();
  });

  test('erro da API — mostra mensagem', async () => {
    post.mockRejectedValueOnce(new Error('Boom'));
    render(<CreateLiveClassModal onClose={vi.fn()} />);
    fillRequired();
    fireEvent.click(screen.getByRole('button', { name: 'Criar Aula' }));

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });
});
