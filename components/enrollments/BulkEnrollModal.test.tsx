import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const RESULT = {
  success: 2,
  skipped: 1,
  errors: 1,
  total: 4,
  details: {
    enrolled: [42, 43],
    errors: [{ userId: 9, error: 'Curso não encontrado' }],
  },
};

const post = vi.fn().mockResolvedValue(RESULT);

vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...a: unknown[]) => post(...a) },
}));

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
vi.mock('@/components/ui/Select', () => ({
  Select: () => <div data-testid="select" />,
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

vi.mock('./enrollData', () => ({
  useCourseOptions: () => ({
    options: [{ value: '7', label: 'Curso 7' }],
    loading: false,
  }),
  useDepartmentOptions: () => ({ options: [], loading: false }),
  useDirectoryUsers: () => ({
    users: [
      { id: 42, fullName: 'Ana Silva', avatarUrl: null, department: null },
      { id: 43, fullName: 'Bruno Costa', avatarUrl: null, department: null },
    ],
    loading: false,
  }),
}));

import { BulkEnrollModal } from './BulkEnrollModal';

beforeEach(() => post.mockReset().mockResolvedValue(RESULT));

describe('BulkEnrollModal', () => {
  test('submete userIds seleccionados + courseId e mostra o relatório', async () => {
    render(<BulkEnrollModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'stub-pick-course' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]); // Ana Silva

    fireEvent.click(screen.getByRole('button', { name: /Matricular/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/enrollments/bulk', {
      userIds: [42],
      courseId: 7,
    });

    await waitFor(() =>
      expect(screen.getByText('2 matriculados')).toBeInTheDocument(),
    );
    expect(screen.getByText('ID 9: Curso não encontrado')).toBeInTheDocument();
  });

  test('com prazo e obrigatória — inclui deadline + mandatory', async () => {
    render(<BulkEnrollModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'stub-pick-course' }));
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.change(screen.getByLabelText('Prazo (opcional)'), {
      target: { value: '2026-11-30' },
    });
    fireEvent.click(screen.getByLabelText('Matrícula obrigatória'));

    fireEvent.click(screen.getByRole('button', { name: /Matricular/ }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/enrollments/bulk', {
      userIds: [42],
      courseId: 7,
      deadline: '2026-11-30',
      mandatory: true,
    });
  });

  test('sem selecção — não submete', () => {
    render(<BulkEnrollModal onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'stub-pick-course' }));
    fireEvent.click(screen.getByRole('button', { name: /Matricular/ }));
    expect(post).not.toHaveBeenCalled();
  });
});
