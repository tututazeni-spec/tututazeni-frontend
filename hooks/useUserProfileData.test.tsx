import { beforeEach, describe, expect, test, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserLeave, useUserPdi, useUserTeam } from './useUserProfileData';

const get = vi.fn();
vi.mock('@/lib/apiClient', () => ({
  apiClient: { get: (...a: unknown[]) => get(...a) },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  get.mockReset();
});

describe('useUserProfileData', () => {
  test('cada hook chama o endpoint do módulo dono do dado, filtrado por utilizador', async () => {
    get.mockResolvedValue({ data: [] });
    const { result } = renderHook(() => useUserPdi(7), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(get).toHaveBeenCalledWith(
      '/development-plans',
      expect.objectContaining({ params: { userId: 7 } }),
    );
  });

  test('a equipa pede /users/:id/team', async () => {
    get.mockResolvedValue({ team: [] });
    const { result } = renderHook(() => useUserTeam(3), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(get.mock.calls[0][0]).toBe('/users/3/team');
    expect(result.current.data).toEqual({ team: [] });
  });

  test('férias: carrega enquanto faltar o pedido OU o saldo', async () => {
    let resolveBalance: (v: unknown) => void = () => undefined;
    get.mockImplementation((path: string) =>
      path === '/leave'
        ? Promise.resolve({ data: [] })
        : new Promise((r) => {
            resolveBalance = r;
          }),
    );
    const { result } = renderHook(() => useUserLeave(5), { wrapper });
    await waitFor(() => expect(result.current.requests).toEqual({ data: [] }));
    // pedidos já chegaram, o saldo ainda não
    expect(result.current.isLoading).toBe(true);
    resolveBalance([{ leaveTypeCode: 'ANNUAL', balance: 1, used: 0 }]);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.balance).toHaveLength(1);
    expect(get).toHaveBeenCalledWith('/leave/balance/5', expect.anything());
  });
});
