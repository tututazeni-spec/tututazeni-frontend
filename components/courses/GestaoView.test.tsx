import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GestaoView } from './GestaoView';

// ─── Mocks ────────────────────────────────────────────────────────────────────
// A vista orquestra: 1 GET /courses (tabela filtrada), 1 GET /courses/categories,
// 1 GET /departments (via useDepartmentOptions) + mutações de ciclo de vida.
// O menu de acções por linha (DropdownMenu, Radix) é substituído por um mock
// simples que renderiza sempre o conteúdo — testar a abertura real do popover
// exigiria polyfills de pointer capture que este repo não usa em mais nenhum
// teste (grep confirma: nenhum outro *.test.tsx interage com DropdownMenu).

const patch = vi.fn().mockResolvedValue({});
const put = vi.fn().mockResolvedValue({});
const del = vi.fn().mockResolvedValue({});
const post = vi.fn().mockResolvedValue({});
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    patch: (...args: unknown[]) => patch(...args),
    put: (...args: unknown[]) => put(...args),
    delete: (...args: unknown[]) => del(...args),
    post: (...args: unknown[]) => post(...args),
  },
}));

vi.mock('@/components/courses-modulos/ModuleModal', () => ({
  ModuleModal: ({ courseId }: { courseId: number }) => (
    <div data-testid="module-modal">module-modal for {courseId}</div>
  ),
}));

vi.mock('./EditCourseModal', () => ({
  EditCourseModal: ({ courseId }: { courseId: number }) => (
    <div data-testid="edit-course-modal">edit-course-modal for {courseId}</div>
  ),
}));

vi.mock('@/components/enrollments/EnrollUserModal', () => ({
  EnrollUserModal: ({ initialCourseId }: { initialCourseId: number }) => (
    <div data-testid="enroll-user-modal">enroll-user-modal for {initialCourseId}</div>
  ),
}));

vi.mock('@/components/ui/DropdownMenu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onSelect,
    disabled,
    className,
  }: {
    children: React.ReactNode;
    onSelect?: () => void;
    disabled?: boolean;
    className?: string;
  }) => (
    <button type="button" disabled={disabled} className={className} onClick={() => onSelect?.()}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

const confirmFn = vi.fn().mockResolvedValue(true);
vi.mock('@/providers/ConfirmProvider', () => ({
  useConfirm: () => confirmFn,
}));
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => vi.fn() }));

let courseList: unknown[] = [];
vi.mock('@/hooks/useApiQuery', () => ({
  useApiQuery: (_key: unknown, path: string) => {
    if (path === '/courses') return { data: { data: courseList, total: courseList.length, totalPages: 1, page: 1 }, isLoading: false };
    if (path === '/courses/categories') return { data: [], isLoading: false };
    if (path === '/departments') return { data: { data: [] }, isLoading: false };
    return { data: undefined, isLoading: false };
  },
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

function setData(courses: unknown[]) {
  courseList = courses;
}

const draftNoModules = {
  id: 1,
  title: 'Curso sem módulos',
  status: 'DRAFT',
  category: 'Compliance',
  type: null,
  modality: null,
  level: 'BEGINNER',
  internalCode: null,
  workloadHours: null,
  publishedAt: null,
  requiresApproval: false,
  avgProgress: 0,
  primaryInstructor: null,
  _count: { modules: 0, enrollments: 0, feedbacks: 0 },
};
const draftReady = {
  id: 2,
  title: 'Curso pronto',
  status: 'DRAFT',
  category: null,
  type: null,
  modality: null,
  level: 'BEGINNER',
  internalCode: null,
  workloadHours: null,
  publishedAt: null,
  requiresApproval: false,
  avgProgress: 0,
  primaryInstructor: null,
  _count: { modules: 3, enrollments: 0, feedbacks: 0 },
};
const archivedCourse = {
  id: 9,
  title: 'Curso antigo',
  status: 'ARCHIVED',
  category: null,
  type: null,
  modality: null,
  level: 'BEGINNER',
  internalCode: null,
  workloadHours: null,
  publishedAt: null,
  requiresApproval: false,
  avgProgress: 0,
  primaryInstructor: null,
  _count: { modules: 4, enrollments: 7, feedbacks: 2 },
};

beforeEach(() => {
  patch.mockClear();
  put.mockClear();
  del.mockClear();
  post.mockClear();
  confirmFn.mockClear();
});

describe('GestaoView', () => {
  test('lista os cursos devolvidos por /courses', () => {
    setData([draftNoModules, draftReady, archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.getByText('Curso sem módulos')).toBeInTheDocument();
    expect(screen.getByText('Curso pronto')).toBeInTheDocument();
    expect(screen.getByText('Curso antigo')).toBeInTheDocument();
  });

  test('Publicar fica desativado sem módulos e ativo com módulos', () => {
    setData([draftNoModules, draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    const publicar = screen.getAllByRole('button', { name: 'Publicar' });
    expect(publicar[0]).toBeDisabled(); // Curso sem módulos
    expect(publicar[1]).not.toBeDisabled(); // Curso pronto
  });

  test('Publicar chama PATCH /courses/:id/publish', async () => {
    setData([draftNoModules, draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Publicar' })[1]);
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/courses/2/publish'));
  });

  test('Arquivar confirma e chama PATCH /courses/:id/archive', async () => {
    setData([draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Arquivar' }));
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/courses/2/archive'));
  });

  test('Repor rascunho chama PUT /courses/:id com status DRAFT', async () => {
    setData([archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Repor rascunho' }));
    await waitFor(() => expect(put).toHaveBeenCalledWith('/courses/9', { status: 'DRAFT' }));
  });

  test('estado vazio quando não há cursos', () => {
    setData([]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.getByText('Nenhum curso encontrado')).toBeInTheDocument();
  });

  test('"Adicionar módulo" abre o modal de módulo para o curso da linha', () => {
    setData([draftNoModules]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.queryByTestId('module-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Adicionar módulo/ }));
    expect(screen.getByTestId('module-modal')).toHaveTextContent('module-modal for 1');
  });

  test('"Editar" abre o modal de edição para o curso da linha', () => {
    setData([draftReady, archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.queryByTestId('edit-course-modal')).not.toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0]);
    expect(screen.getByTestId('edit-course-modal')).toHaveTextContent('edit-course-modal for 2');
  });

  test('"Duplicar" chama POST /courses/:id/duplicate', async () => {
    setData([draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Duplicar' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/courses/2/duplicate'));
  });

  test('Eliminar um rascunho confirma e chama DELETE /courses/:id', async () => {
    setData([draftNoModules]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(confirmFn).toHaveBeenCalled());
    await waitFor(() => expect(del).toHaveBeenCalledWith('/courses/1'));
  });

  test('Eliminar também está disponível para arquivados', async () => {
    setData([archivedCourse]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(del).toHaveBeenCalledWith('/courses/9'));
  });

  test('"Gerir módulos" chama onManageModules com o id do curso da linha', () => {
    setData([draftReady]);
    const onManageModules = vi.fn();
    render(<GestaoView onSelect={vi.fn()} onManageModules={onManageModules} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gerir módulos' }));
    expect(onManageModules).toHaveBeenCalledWith(2);
  });

  test('"Gerir módulos" não aparece sem onManageModules', () => {
    setData([draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Gerir módulos' })).not.toBeInTheDocument();
  });

  test('"Ver inscrições / progresso" chama onViewEnrollments com o id do curso', () => {
    setData([draftReady]);
    const onViewEnrollments = vi.fn();
    render(<GestaoView onSelect={vi.fn()} onViewEnrollments={onViewEnrollments} />);
    fireEvent.click(screen.getByRole('button', { name: /Ver inscrições/ }));
    expect(onViewEnrollments).toHaveBeenCalledWith(2);
  });

  test('"Inscrever colaboradores" abre o EnrollUserModal pré-preenchido com o curso', () => {
    setData([draftReady]);
    render(<GestaoView onSelect={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Inscrever colaboradores' }));
    expect(screen.getByTestId('enroll-user-modal')).toHaveTextContent(
      'enroll-user-modal for 2',
    );
  });
});
