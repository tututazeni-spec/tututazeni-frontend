import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });

vi.mock('@/lib/apiClient', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    ApiError,
    apiClient: { post: (...a: unknown[]) => post(...a) },
  };
});

// Reimportado do módulo mockado para os testes construírem erros 409.
import { ApiError } from '@/lib/apiClient';

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

vi.mock('@/components/ui/Avatar', () => ({ Avatar: () => <span /> }));

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

vi.mock('./enrollData', () => ({
  useCourseOptions: () => ({
    options: [{ value: '7', label: 'Curso 7' }],
    loading: false,
  }),
  useDirectoryUsers: () => ({
    users: [
      {
        id: 42,
        fullName: 'Ana Silva',
        email: 'ana@x.com',
        avatarUrl: null,
        department: { name: 'TI' },
      },
    ],
    loading: false,
  }),
}));

import { EnrollUserModal } from './EnrollUserModal';

beforeEach(() => post.mockReset().mockResolvedValue({ id: 1 }));

function pickCourseAndUser() {
  fireEvent.click(screen.getByRole('button', { name: 'stub-pick-course' }));
  fireEvent.change(
    screen.getByPlaceholderText('Pesquisar por nome ou email…'),
    { target: { value: 'ana' } },
  );
  fireEvent.click(screen.getByRole('button', { name: /Ana Silva/ }));
}

describe('EnrollUserModal', () => {
  test('payload mínimo — só userId + courseId', async () => {
    render(<EnrollUserModal onClose={vi.fn()} />);
    pickCourseAndUser();
    fireEvent.click(screen.getByRole('button', { name: 'Matricular' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/enrollments', {
      userId: 42,
      courseId: 7,
    });
  });

  test('com prazo e obrigatória — inclui deadline + mandatory', async () => {
    render(<EnrollUserModal onClose={vi.fn()} />);
    pickCourseAndUser();
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), {
      target: { value: '2026-12-31' },
    });
    fireEvent.click(screen.getByLabelText('Matrícula obrigatória'));
    fireEvent.click(screen.getByRole('button', { name: 'Matricular' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/enrollments', {
      userId: 42,
      courseId: 7,
      deadline: '2026-12-31',
      mandatory: true,
    });
  });

  test('sem curso/colaborador — não submete', () => {
    render(<EnrollUserModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Matricular' }));
    expect(post).not.toHaveBeenCalled();
  });

  test('409 — mostra erro de já inscrito', async () => {
    post.mockRejectedValueOnce(new ApiError(409, 'conflito'));
    render(<EnrollUserModal onClose={vi.fn()} />);
    pickCourseAndUser();
    fireEvent.click(screen.getByRole('button', { name: 'Matricular' }));

    await waitFor(() =>
      expect(
        screen.getByText('Este colaborador já está inscrito neste curso.'),
      ).toBeInTheDocument(),
    );
  });
});
