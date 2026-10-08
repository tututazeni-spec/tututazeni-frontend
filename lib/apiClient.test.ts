// lib/apiClient.test.ts
// Regressão: quando o refresh é recusado (inactivo além do limite do
// backend), o logout redirecciona para /login?reason=expired para o login
// poder explicar porquê. Um 401 que o refresh resolve não faz logout.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient } from './apiClient';

type Json = Record<string, unknown>;
const res = (status: number, body: Json = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

describe('apiClient — sessão expirada', () => {
  const originalLocation = window.location;
  let hrefs: string[];

  beforeEach(() => {
    hrefs = [];
    const loc = {
      pathname: '/dashboard',
      set href(v: string) {
        hrefs.push(v);
      },
      get href() {
        return hrefs[hrefs.length - 1] ?? '';
      },
    };
    Object.defineProperty(window, 'location', { value: loc, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('refresh recusado → /login?reason=expired', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes('/auth/refresh')) return res(401);
      if (url.includes('/auth/logout')) return res(200);
      return res(401);
    });

    await expect(apiClient.get('/courses')).rejects.toBeTruthy();
    await vi.waitFor(() => expect(hrefs).toContain('/login?reason=expired'));
  });
});
