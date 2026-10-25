import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateUserForm } from './useCreateUserForm';

const get = vi.fn();
const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
  },
}));
const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));
vi.mock('@/lib/image', () => ({
  resizeImageToDataUrl: vi.fn(async () => 'data:image/jpeg;base64,RESIZED'),
}));
// useDebounce real adia 300ms+; aqui o valor passa logo
vi.mock('./useDebounce', () => ({ useDebounce: <T,>(v: T) => v }));

let emailCheck: Record<string, unknown>;

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const noEvent = { preventDefault: vi.fn() };

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  notify.mockReset();
  emailCheck = {
    enforced: true,
    domain: 'empresa.ao',
    mode: 'SUGGEST',
    suggestion: 'ana.silva@empresa.ao',
    violations: [],
    taken: false,
    alternatives: [],
  };
  get.mockImplementation(async (path: string) => {
    if (path === '/users/email-check') return emailCheck;
    if (
      path === '/departments' ||
      path === '/courses' ||
      path === '/competencies'
    )
      return { data: [] };
    return [];
  });
});

describe('useCreateUserForm', () => {
  test('sem nome e email válidos não envia e mostra o erro de validação', () => {
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    act(() => result.current.submit(noEvent));
    expect(post).not.toHaveBeenCalled();
    expect(result.current.error).not.toBe('');
  });

  test('o email é sugerido a partir do nome enquanto não for editado', async () => {
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    act(() => result.current.setField('fullName', 'Ana Silva'));
    await waitFor(() =>
      expect(result.current.form.email).toBe('ana.silva@empresa.ao'),
    );
    expect(result.current.emailHint).toBe(
      'Formato da organização: nome.apelido@empresa.ao',
    );
  });

  test('depois de editado à mão, a sugestão deixa de sobrepor', async () => {
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    act(() => result.current.changeEmail('manual@x.ao'));
    act(() => result.current.setField('fullName', 'Ana Silva'));
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/users/email-check', expect.anything()),
    );
    // dar tempo à sugestão (que não deve ser aplicada)
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.form.email).toBe('manual@x.ao');
  });

  test('criação válida: POST /users com o payload normalizado e onCreated', async () => {
    post.mockResolvedValue({});
    const onCreated = vi.fn();
    const { result } = renderHook(() => useCreateUserForm(onCreated), {
      wrapper,
    });
    act(() => {
      result.current.setField('fullName', 'Ana Silva');
      result.current.changeEmail('ana@x.ao');
      result.current.setField('roleId', '3');
    });
    act(() => result.current.submit(noEvent));
    await waitFor(() => expect(onCreated).toHaveBeenCalledTimes(1));
    expect(post).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({
        fullName: 'Ana Silva',
        email: 'ana@x.ao',
        roleId: 3,
        employeeNumber: undefined,
        managerId: undefined,
      }),
    );
  });

  test('o gestor escolhido segue como managerId e a pesquisa limpa-se', async () => {
    post.mockResolvedValue({});
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    act(() => result.current.setManagerSearch('ru'));
    act(() => result.current.pickManager({ id: 9, fullName: 'Rui' } as never));
    expect(result.current.managerSearch).toBe('');
    expect(result.current.selectedManager).toMatchObject({ id: 9 });
    act(() => {
      result.current.setField('fullName', 'Ana');
      result.current.changeEmail('ana@x.ao');
    });
    act(() => result.current.submit(noEvent));
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/users',
        expect.objectContaining({ managerId: 9 }),
      ),
    );
    act(() => result.current.clearManager());
    expect(result.current.selectedManager).toBeNull();
  });

  test('erro do backend aparece no formulário', async () => {
    post.mockRejectedValue(new Error('Email já existe'));
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    act(() => {
      result.current.setField('fullName', 'Ana');
      result.current.changeEmail('ana@x.ao');
    });
    act(() => result.current.submit(noEvent));
    await waitFor(() => expect(result.current.error).toBe('Email já existe'));
  });

  test('fotografia grande demais é recusada com aviso', async () => {
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    const big = new File([new Uint8Array(3 * 1024 * 1024 + 1)], 'x.jpg');
    await act(async () => {
      await result.current.onPhotoChange({
        target: { files: [big], value: 'x' },
      } as never);
    });
    expect(notify).toHaveBeenCalledWith({
      title: 'Fotografia demasiado grande (máx. 3 MB)',
      intent: 'danger',
    });
    expect(result.current.form.avatarUrl).toBe('');
  });

  test('fotografia válida é redimensionada e removível', async () => {
    const { result } = renderHook(() => useCreateUserForm(vi.fn()), {
      wrapper,
    });
    const ok = new File(['abc'], 'x.jpg');
    await act(async () => {
      await result.current.onPhotoChange({
        target: { files: [ok], value: 'x' },
      } as never);
    });
    expect(result.current.form.avatarUrl).toBe(
      'data:image/jpeg;base64,RESIZED',
    );
    act(() => result.current.clearPhoto());
    expect(result.current.form.avatarUrl).toBe('');
  });
});
