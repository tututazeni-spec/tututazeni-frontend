import { beforeEach, describe, expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChangePassword } from './useChangePassword';

const post = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const submitEvent = () =>
  ({ preventDefault: vi.fn() }) as unknown as React.FormEvent;

function fill(
  result: { current: ReturnType<typeof useChangePassword> },
  current: string,
  next: string,
  confirm: string,
) {
  act(() => result.current.set('currentPassword', current));
  act(() => result.current.set('newPassword', next));
  act(() => result.current.set('confirmPassword', confirm));
}

beforeEach(() => {
  post.mockReset();
});

describe('useChangePassword', () => {
  test('senhas diferentes: avisa e não envia', () => {
    const toastFn = vi.fn();
    const { result } = renderHook(() => useChangePassword(toastFn), {
      wrapper,
    });
    fill(result, 'velha', 'abcdef', 'abcdeX');
    act(() => result.current.submit(submitEvent()));
    expect(toastFn).toHaveBeenCalledWith('As senhas não coincidem.', 'error');
    expect(post).not.toHaveBeenCalled();
  });

  test('senha curta: avisa e não envia', () => {
    const toastFn = vi.fn();
    const { result } = renderHook(() => useChangePassword(toastFn), {
      wrapper,
    });
    fill(result, 'velha', 'abc', 'abc');
    act(() => result.current.submit(submitEvent()));
    expect(toastFn).toHaveBeenCalledWith(
      'A nova senha deve ter pelo menos 6 caracteres.',
      'error',
    );
    expect(post).not.toHaveBeenCalled();
  });

  test('válida: envia só current+new e limpa o formulário no sucesso', async () => {
    post.mockResolvedValue({});
    const toastFn = vi.fn();
    const { result } = renderHook(() => useChangePassword(toastFn), {
      wrapper,
    });
    fill(result, 'velha', 'Nova#123', 'Nova#123');
    expect(result.current.strength).toBe(4);
    act(() => result.current.submit(submitEvent()));
    await waitFor(() =>
      expect(toastFn).toHaveBeenCalledWith(
        'Senha alterada com sucesso!',
        'success',
      ),
    );
    expect(post).toHaveBeenCalledWith('/auth/change-password', {
      currentPassword: 'velha',
      newPassword: 'Nova#123',
    });
    expect(result.current.form).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  });
});
