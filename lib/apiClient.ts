// lib/apiClient.ts
// Cliente HTTP único e canónico do frontend INNOVA.
//
// Decisões aplicadas:
// - Autenticação por cookie httpOnly: enviamos sempre `credentials: 'include'` e
//   NUNCA lemos/escrevemos o token em JS (mitiga XSS). Não há Authorization
//   Bearer nem localStorage — esse padrão antigo era código morto.
// - Suporte a AbortSignal: o React Query passa um `signal` por pedido, permitindo
//   cancelar requisições quando o componente desmonta ou a query fica obsoleta.
// - Monitorização: cada pedido regista tempo de resposta e erros (performanceMonitor).
// - Erros tipados (ApiError) com status, para a política de retry distinguir
//   4xx (não repetir) de 5xx/rede (repetir com backoff).

import { recordRequest, normalizePath } from './performanceMonitor';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 4xx (excepto 408/429) são erros do cliente — não vale a pena repetir. */
  get isClientError(): boolean {
    return (
      this.status >= 400 &&
      this.status < 500 &&
      this.status !== 408 &&
      this.status !== 429
    );
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Corpo já serializável (objecto) — é convertido para JSON automaticamente. */
  body?: unknown;
  /** Query string params; valores null/undefined/'' são omitidos (payload enxuto). */
  params?: Record<string, string | number | boolean | null | undefined>;
  signal?: AbortSignal;
}

function buildUrl(
  path: string,
  params?: RequestOptions['params'],
): string {
  const base = `${API_URL}${path}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    // Optimização de payload: só enviamos parâmetros com valor real.
    if (v !== null && v !== undefined && v !== '') qs.set(k, String(v));
  }
  const str = qs.toString();
  return str ? `${base}?${str}` : base;
}

function redirectToLoginIfNeeded(status: number): void {
  if (
    status === 401 &&
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    window.location.href = '/login';
  }
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, params, headers, signal, ...rest } = options;
  const url = buildUrl(path, params);
  const start =
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  let status = 0;
  let ok = false;
  try {
    const res = await fetch(url, {
      method,
      credentials: 'include', // cookie httpOnly
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...rest,
    });

    status = res.status;
    ok = res.ok;

    redirectToLoginIfNeeded(res.status);

    if (!res.ok) {
      const errBody = await res.json().catch(() => undefined);
      const message =
        (errBody as { message?: string } | undefined)?.message ??
        res.statusText ??
        `Erro ${res.status}`;
      throw new ApiError(res.status, message, errBody);
    }

    // 204 No Content → devolve undefined sem tentar parsear.
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  } catch (e) {
    // AbortError não é falha real — propaga sem poluir métricas como erro 5xx.
    if (e instanceof DOMException && e.name === 'AbortError') {
      ok = true;
      throw e;
    }
    if (!(e instanceof ApiError)) {
      // Erro de rede / timeout.
      throw new ApiError(0, e instanceof Error ? e.message : 'Erro de rede');
    }
    throw e;
  } finally {
    const end =
      typeof performance !== 'undefined' ? performance.now() : Date.now();
    recordRequest({
      key: `${method} ${normalizePath(path)}`,
      method,
      url: path,
      status,
      ok,
      durationMs: end - start,
      timestamp: Date.now(),
    });
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, { ...options, body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, { ...options, body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, { ...options, body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, options),
};
