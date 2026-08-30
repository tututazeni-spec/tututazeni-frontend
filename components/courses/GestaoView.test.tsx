import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GestaoView } from './GestaoView';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// A vista só orquestra: 2 GET (drafts/archived) + 3 mutações de ciclo de vida.
// Mockamos a camada de dados para testar a lógica de UI (Publicar bloqueado
// sem módulos, cada botão dispara o endpoint certo) sem rede nem React Query.

const patch = vi.fn().mockResolvedValue({});
const put = vi.fn().mockResolvedValue({});
const del = vi.fn().mockResolvedValue({});
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    patch: (...args: unknown[]) => patch(...args),
    put: (...args: unknown[]) => put(...args),
    delete: (...args: unknown[]) => del(...args),
  },
}));

vi.mock('@/components/courses-modulos/ModuleModal', () => ({
  ModuleModal: ({ courseId }: { courseId: number }) => (
    <div data-testid="module-modal">module-modal for {courseId}</div>
  ),
}));

const confirmFn = vi.fn().mockResolvedValue(true);
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => confirmFn,
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

vi.mock('next/link', () => ({
  default: ({ href, children }: { href: string; children: unknown }) => (
    <a href={href}>{children as never}</a>
  ),
}));

type QueryData = { data: unknown[] } | undefined; // molde de PaginatedCourses
const responses: Record<string, QueryData> = {};
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (
    _key: unknown,
    _path: string,
    opts: { params?: { status?: string } },
  ) => ({ data: responses[opts?.params?.status ?? ''], isLoading: false }),
  useApiMutation: (
    fn: (v: unknown) => Promise<unknown>,
    opts: {
      onSuccess?: (d: unknown, v: unknown) => void;
      onError?: (e: Error, v: unknown) => void;
    },
  ) => ({
    mutate: (v: unknown) =>
      fn(v).then(
        (d) => opts?.onSuccess?.(d, v),
        (e) => opts?.onError?.(e as Error, v),
      ),
    isPending: false,
    variables: undefined,
  }),
}));

function setData(drafts: unknown[], archived: unknown[]) {
  responses.DRAFT = { data: drafts };
  responses.ARCHIVED = { data: archived };
}

const draftNoModules = {
  id: 1,
  title: 'Curso sem módulos',
  status: 'DRAFT',
  category: 'Compliance',
  _count: { modules: 0, enrollments: 0, feedbacks: 0 },
};
const draftReady = {
  id: 2,
  title: 'Curso pronto',
  status: 'DRAFT',
  category: null,
  _count: { modules: 3, enrollments: 0, feedbacks: 0 },
};
const archivedCourse = {
  id: 9,
  title: 'Curso antigo',
  status: 'ARCHIVED',
  category: null,
  _count: { modules: 4, enrollments: 7, feedbacks: 2 },
};

beforeEach(() => {
  patch.mockClear();
  put.mockClear();
  del.mockClear();
  confirmFn.mockClear();
});

describe('GestaoView', () => {
  test('lista rascunhos e arquivados', () => {
    setData([draftNoModules, draftReady], [archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.getByText('Curso sem módulos')).toBeInTheDocument();
    expect(screen.getByText('Curso pronto')).toBeInTheDocument();
    expect(screen.getByText('Curso antigo')).toBeInTheDocument();
    expect(screen.getByText('Rascunhos (2)')).toBeInTheDocument();
    expect(screen.getByText('Arquivados (1)')).toBeInTheDocument();
  });

  test('Publicar fica desativado sem módulos e ativo com módulos', () => {
    setData([draftNoModules, draftReady], []);
    render(<GestaoView onSelect={vi.fn()} />);
    const publicar = screen.getAllByRole('button', { name: 'Publicar' });
    expect(publicar[0]).toBeDisabled(); // Curso sem módulos
    expect(publicar[1]).not.toBeDisabled(); // Curso pronto
    expect(
      screen.getByText(/só pode ser publicado depois de ter pelo menos um/i),
    ).toBeInTheDocument();
  });

  test('Publicar chama PATCH /courses/:id/publish', async () => {
    setData([draftNoModules, draftReady], []);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Publicar' })[1]);
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/courses/2/publish'),
    );
  });

  test('Arquivar confirma e chama PATCH /courses/:id/archive', async () => {
    setData([draftReady], []);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/courses/2/archive'),
    );
  });

  test('Repor chama PUT /courses/:id com status DRAFT', async () => {
    setData([], [archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Repor como rascunho' }),
    );
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/courses/9', { status: 'DRAFT' }),
    );
  });

  test('estado vazio quando não há rascunhos', () => {
    setData([], [archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.getByText('Sem rascunhos')).toBeInTheDocument();
  });

  test('"+ Módulo" abre o modal de módulo para o curso da linha', () => {
    setData([draftNoModules], []);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.queryByTestId('module-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Módulo/ }));
    expect(screen.getByTestId('module-modal')).toHaveTextContent(
      'module-modal for 1',
    );
  });

  test('Eliminar um rascunho confirma e chama DELETE /courses/:id', async () => {
    setData([draftNoModules], []);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() => expect(del).toHaveBeenCalledWith('/courses/1'));
  });

  test('Eliminar também está disponível para arquivados', async () => {
    setData([], [archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('/courses/9'));
  });
});
