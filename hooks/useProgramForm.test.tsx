import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProgramForm } from './useProgramForm';
import type { AvatarProgramDetail } from '@/components/avatar-training/types';

const get = vi.fn();
const post = vi.fn();
const patch = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: (...a: unknown[]) => get(...a),
    post: (...a: unknown[]) => post(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));
const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  get.mockReset();
  post.mockReset();
  patch.mockReset();
  notify.mockReset();
  get.mockImplementation(async (path: string) =>
    path === '/avatar-training/avatars' ? [] : { data: [] },
  );
});

describe('useProgramForm', () => {
  test('criação: valida o título e faz POST com o payload normalizado', async () => {
    post.mockResolvedValue({});
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useProgramForm(undefined, onSaved, onClose),
      { wrapper },
    );
    expect(result.current.canSave).toBe(false);

    act(() => result.current.set({ title: '  Segurança ', duration: '45' }));
    expect(result.current.canSave).toBe(true);
    act(() => result.current.save());

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(post).toHaveBeenCalledWith(
      '/avatar-training/programs',
      expect.objectContaining({
        title: 'Segurança',
        durationMinutes: 45,
        courseId: undefined,
        certificateEnabled: false,
      }),
    );
    expect(patch).not.toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith({
      title: 'Formação criada',
      intent: 'success',
    });
  });

  test('edição: PATCH ao id da formação', async () => {
    patch.mockResolvedValue({});
    const program = {
      id: 42,
      title: 'Existente',
      objectives: [],
      prerequisiteCourseIds: [],
      competencyIds: [],
    } as unknown as AvatarProgramDetail;
    const { result } = renderHook(
      () => useProgramForm(program, vi.fn(), vi.fn()),
      { wrapper },
    );
    expect(result.current.form.title).toBe('Existente');
    act(() => result.current.save());
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith(
        '/avatar-training/programs/42',
        expect.objectContaining({ title: 'Existente' }),
      ),
    );
    expect(post).not.toHaveBeenCalled();
  });

  test('erro de gravação avisa e não fecha o modal', async () => {
    post.mockRejectedValue(new Error('Título repetido'));
    const onClose = vi.fn();
    const { result } = renderHook(
      () => useProgramForm(undefined, vi.fn(), onClose),
      { wrapper },
    );
    act(() => result.current.set({ title: 'X' }));
    act(() => result.current.save());
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        title: 'Não foi possível guardar a formação',
        description: 'Título repetido',
        intent: 'danger',
      }),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  test('mudar o curso volta o módulo a «curso inteiro»; o idioma limpa a variante', () => {
    const { result } = renderHook(
      () => useProgramForm(undefined, vi.fn(), vi.fn()),
      { wrapper },
    );
    act(() => result.current.set({ moduleId: '5', variant: 'AO' }));
    act(() => result.current.changeCourse('12'));
    expect(result.current.form).toMatchObject({
      courseId: '12',
      moduleId: 'ALL',
    });
    act(() => result.current.changeLanguage('en'));
    expect(result.current.form).toMatchObject({ language: 'en', variant: '' });
  });

  test('objectivo escrito entra na lista uma só vez e limpa a caixa', () => {
    const { result } = renderHook(
      () => useProgramForm(undefined, vi.fn(), vi.fn()),
      { wrapper },
    );
    act(() => result.current.setCustomObjective(' Reduzir acidentes '));
    act(() => result.current.addCustomObjective());
    expect(result.current.form.objectives).toEqual(['Reduzir acidentes']);
    expect(result.current.customObjective).toBe('');
    act(() => result.current.setCustomObjective('Reduzir acidentes'));
    act(() => result.current.addCustomObjective());
    expect(result.current.form.objectives).toEqual(['Reduzir acidentes']);
  });
});
