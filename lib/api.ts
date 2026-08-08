// Base única da API (auditoria A-1, achado F3): caminho relativo same-origin.
// Em dev o rewrite do next.config.ts faz proxy para o Nest; em produção o
// Caddy interceta /api na borda. Zero dependência de NEXT_PUBLIC_API_URL.
export const API_URL = '/api';

// Cliente fetch tipado. Autenticação por cookie httpOnly: enviamos sempre
// `credentials: 'include'` e nunca lemos o token em JS (mitiga XSS).
// Evita disparar vários POST /auth/logout em paralelo quando várias
// chamadas falham com 401 ao mesmo tempo — só a primeira dispara o
// logout+redirect.
let loggingOut = false;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    // Sessão expirada -> logout automático. Limpa o cookie httpOnly (ainda
    // presente, só o JWT expirou) antes de redireccionar — sem isto, o
    // middleware só verifica a presença do cookie, não a validade do JWT,
    // e reenviava /login -> /dashboard -> 401 -> /login num loop infinito
    // (achado ao testar a app com uma sessão de várias horas).
    if (
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/login') &&
      !loggingOut
    ) {
      loggingOut = true;
      void fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      }).finally(() => {
        window.location.href = '/login';
      });
    }
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Erro na API');
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
