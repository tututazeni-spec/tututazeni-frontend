import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const post = vi.fn().mockResolvedValue({ id: 1 });
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
vi.mock('@/components/ui/Select', () => ({
  Select: () => <div data-testid="select" />,
}));

// Stub do campo de imagem: um botão que injecta um data URL no formulário.
vi.mock('./CourseImageField', () => ({
  CourseImageField: ({
    onChange,
  }: {
    onChange: (v: string | null) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange('data:image/jpeg;base64,ZZZZ')}
    >
      stub-pick-image
    </button>
  ),
}));

import { CreateCourseModal } from './CreateCourseModal';

beforeEach(() => post.mockClear());

describe('CreateCourseModal', () => {
  test('submete sem imagem — payload só com o título, sem thumbnailUrl', async () => {
    render(<CreateCourseModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Curso Novo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Curso' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/courses', { title: 'Curso Novo' });
  });

  test('com imagem escolhida — inclui thumbnailUrl no payload', async () => {
    render(<CreateCourseModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Curso Com Capa' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'stub-pick-image' }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar Curso' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/courses', {
      title: 'Curso Com Capa',
      thumbnailUrl: 'data:image/jpeg;base64,ZZZZ',
    });
  });

  test('sem título — não submete (validação)', () => {
    render(<CreateCourseModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Curso' }));
    expect(post).not.toHaveBeenCalled();
  });
});
