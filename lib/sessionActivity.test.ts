// lib/sessionActivity.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const post = vi.fn().mockResolvedValue(null);
const logout = vi.fn();

vi.mock('./apiClient', () => ({
  apiClient: { post: (...args: unknown[]) => post(...args) },
  logout: (...args: unknown[]) => logout(...args),
}));

import { startSessionIdleWatcher, SESSION_IDLE_TIMEOUT_MS } from './sessionActivity';

function fireActivity() {
  window.dispatchEvent(new Event('keydown'));
}

describe('startSessionIdleWatcher', () => {
  let stop: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    post.mockClear();
    logout.mockClear();
  });

  afterEach(() => {
    stop?.();
    vi.useRealTimers();
  });

  it('renova o token logo ao arrancar (cobre reload tardio na vida do access token)', () => {
    stop = startSessionIdleWatcher();
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith('/auth/refresh');
  });

  it('continua a renovar periodicamente enquanto há actividade, sem chegar a fazer logout', () => {
    stop = startSessionIdleWatcher();
    post.mockClear();

    // 24 min, com um "toque" de actividade a cada 2 min — bem dentro da
    // janela de inactividade de 25 min.
    for (let i = 0; i < 12; i++) {
      vi.advanceTimersByTime(2 * 60 * 1000);
      fireActivity();
    }

    expect(logout).not.toHaveBeenCalled();
    expect(post.mock.calls.length).toBeGreaterThan(0);
  });

  it('força logout por inactividade ao fim de SESSION_IDLE_TIMEOUT_MS sem qualquer actividade', () => {
    stop = startSessionIdleWatcher();

    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS + 30_000);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(logout).toHaveBeenCalledWith('idle');
  });

  it('actividade recente adia o logout para lá do limite bruto', () => {
    stop = startSessionIdleWatcher();

    // Actividade pouco antes dos 25 min "resetarem" o relógio.
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS - 60_000);
    fireActivity();
    vi.advanceTimersByTime(60_000);

    expect(logout).not.toHaveBeenCalled();
  });

  it('a função de limpeza pára o temporizador — nada mais acontece depois', () => {
    stop = startSessionIdleWatcher();
    stop();
    stop = () => {};

    post.mockClear();
    vi.advanceTimersByTime(SESSION_IDLE_TIMEOUT_MS * 2);

    expect(post).not.toHaveBeenCalled();
    expect(logout).not.toHaveBeenCalled();
  });
});
