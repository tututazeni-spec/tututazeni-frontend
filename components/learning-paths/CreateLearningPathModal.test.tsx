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

import { CreateLearningPathModal } from './CreateLearningPathModal';

beforeEach(() => post.mockClear());

describe('CreateLearningPathModal', () => {
  test('submete só com o título — payload mínimo (mandatory: false)', async () => {
    render(<CreateLearningPathModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Trilha Nova' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/learning-paths', {
      title: 'Trilha Nova',
      mandatory: false,
    });
  });

  test('inclui os campos de texto preenchidos no payload', async () => {
    render(<CreateLearningPathModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Título *'), {
      target: { value: 'Onboarding 2026' },
    });
    fireEvent.change(screen.getByLabelText('Descrição curta'), {
      target: { value: 'Trilha de integração' },
    });
    fireEvent.change(screen.getByLabelText('Categoria'), {
      target: { value: 'RH' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith('/learning-paths', {
      title: 'Onboarding 2026',
      shortDescription: 'Trilha de integração',
      category: 'RH',
      mandatory: false,
    });
  });

  test('sem título — não submete (validação)', () => {
    render(<CreateLearningPathModal onClose={vi.fn()} onSuccess={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar Trilha' }));
    expect(post).not.toHaveBeenCalled();
  });
});
