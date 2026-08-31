import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const put = vi.fn().mockResolvedValue({ id: 7 });
vi.mock('@/lib/apiClient', () => ({
  apiClient: { put: (...a: unknown[]) => put(...a) },
}));

const course = {
  id: 7,
  title: 'Curso 7',
  shortDescription: 'Resumo',
  description: 'Descrição longa',
  category: 'Compliance',
  level: 'BEGINNER',
  workloadHours: 8,
  thumbnailUrl: 'data:image/jpeg;base64,OLD',
};

vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: () => ({ data: course, isLoading: false, error: null }),
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
vi.mock('@/components/ui/Select', () => ({
  Select: () => <div data-testid="select" />,
}));

vi.mock('./CourseImageField', () => ({
  CourseImageField: ({
    onChange,
  }: {
    onChange: (v: string | null) => void;
  }) => (
    <>
      <button
        type="button"
        onClick={() => onChange('data:image/jpeg;base64,NEW')}
      >
        stub-set-image
      </button>
      <button type="button" onClick={() => onChange(null)}>
        stub-clear-image
      </button>
    </>
  ),
}));

import { EditCourseModal } from './EditCourseModal';

beforeEach(() => put.mockClear());

describe('EditCourseModal', () => {
  test('pré-preenche o título com o curso carregado', () => {
    render(
      <EditCourseModal courseId={7} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    expect(screen.getByLabelText('Título *')).toHaveValue('Curso 7');
  });

  test('Guardar envia PUT /courses/:id com os valores actuais', async () => {
    render(
      <EditCourseModal courseId={7} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith('/courses/7', {
      title: 'Curso 7',
      shortDescription: 'Resumo',
      description: 'Descrição longa',
      category: 'Compliance',
      workloadHours: 8,
      thumbnailUrl: 'data:image/jpeg;base64,OLD',
      level: 'BEGINNER',
    });
  });

  test('limpar a imagem envia thumbnailUrl: null', async () => {
    render(
      <EditCourseModal courseId={7} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'stub-clear-image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({ thumbnailUrl: null });
  });

  test('trocar a imagem envia o novo data URL', async () => {
    render(
      <EditCourseModal courseId={7} onClose={vi.fn()} onSuccess={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'stub-set-image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][1]).toMatchObject({
      thumbnailUrl: 'data:image/jpeg;base64,NEW',
    });
  });
});
