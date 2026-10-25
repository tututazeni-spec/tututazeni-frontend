import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSessionBuilder } from './useSessionBuilder';
import type {
  BuilderStep,
  SessionDetail,
} from '@/components/avatar-training/types';

const patch = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: { patch: (...a: unknown[]) => patch(...a) },
}));
const notify = vi.fn();
vi.mock('@/providers/ToastProvider', () => ({ useToast: () => notify }));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const step = (key: string, over: Partial<BuilderStep> = {}): BuilderStep => ({
  key,
  title: key.toUpperCase(),
  type: 'CONTENT',
  ...over,
});

const session = (steps: BuilderStep[]) =>
  ({
    id: 7,
    title: 'Sessão',
    welcomeMessage: null,
    durationMinutes: 20,
    experienceType: 'GUIDED_LESSON',
    steps,
    rules: undefined,
  }) as unknown as SessionDetail;

beforeEach(() => {
  patch.mockReset();
  notify.mockReset();
});

describe('useSessionBuilder', () => {
  test('arranca com os dados da sessão e grava com PATCH', async () => {
    patch.mockResolvedValue({});
    const { result } = renderHook(
      () => useSessionBuilder(session([step('a')])),
      { wrapper },
    );
    expect(result.current).toMatchObject({
      title: 'Sessão',
      duration: '20',
      welcome: '',
    });
    act(() => result.current.setFields({ title: '  Nova  ', welcome: 'Olá' }));
    act(() => result.current.save());
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/avatar-training/sessions/7', {
        title: 'Nova',
        welcomeMessage: 'Olá',
        durationMinutes: 20,
        experienceType: 'GUIDED_LESSON',
        steps: [step('a')],
        rules: {},
      }),
    );
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        title: 'Sessão guardada',
        intent: 'success',
      }),
    );
  });

  test('etapa sem título bloqueia a gravação', () => {
    const { result } = renderHook(
      () => useSessionBuilder(session([step('a')])),
      { wrapper },
    );
    expect(result.current.canSave).toBe(true);
    act(() => result.current.patchStep(0, { title: '  ' }));
    expect(result.current.canSave).toBe(false);
  });

  test('adicionar, mover e remover etapas mantêm as ramificações válidas', () => {
    const { result } = renderHook(
      () =>
        useSessionBuilder(
          session([step('a', { branches: { onCorrect: 'b' } }), step('b')]),
        ),
      { wrapper },
    );
    act(() => result.current.addStep());
    expect(result.current.steps.map((s) => s.key)).toEqual([
      'a',
      'b',
      'etapa-3',
    ]);

    // b sobe: a deixa de ter b à frente → salto removido
    act(() => result.current.moveStep(1, -1));
    expect(result.current.steps.map((s) => s.key)).toEqual([
      'b',
      'a',
      'etapa-3',
    ]);
    expect(result.current.steps[1].branches).toBeUndefined();

    act(() => result.current.removeStep(0));
    expect(result.current.steps.map((s) => s.key)).toEqual(['a', 'etapa-3']);
  });

  test('erro do backend é mostrado tal como vem', async () => {
    patch.mockRejectedValue(new Error('Chaves de etapa repetidas'));
    const { result } = renderHook(
      () => useSessionBuilder(session([step('a')])),
      { wrapper },
    );
    act(() => result.current.save());
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith({
        title: 'Não foi possível guardar a sessão',
        description: 'Chaves de etapa repetidas',
        intent: 'danger',
      }),
    );
  });
});
