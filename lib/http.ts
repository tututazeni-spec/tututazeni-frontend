// Patch global ao window.fetch para o frontend INNOVA.
//
// Porquê: depois da migração para cookie httpOnly e base same-origin `/api`,
// `credentials: 'include'` é mantido para garantir que o cookie acompanha
// todos os pedidos sem depender de cada página passar a opção individualmente.
//
// O logout automático em 401 (sessão expirada) delega em
// lib/apiClient.ts#logout() em vez de redireccionar aqui directamente.
// Isto corrigiu uma condição de corrida real: como este patch intercepta
// TODOS os fetch (incluindo os do apiClient.ts), um 401 disparava aqui um
// `window.location.href = '/login'` imediato, sem chamar POST /auth/logout
// primeiro — a navegação podia abortar a chamada de limpeza do cookie que o
// apiClient.ts tentava fazer a seguir, deixando o cookie httpOnly ainda
// válido. É o mesmo bug do loop de redireccionamento já documentado e
// corrigido nos outros clientes (o middleware só verifica a PRESENÇA do
// cookie, não a validade do JWT). Delegar em logout() partilha a guarda
// `loggingOut` com todos os outros pontos de entrada — só o primeiro 401
// dispara o fluxo completo (limpar cookie → redirect).

import { logout } from './apiClient';

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function isApiRequest(url: string): boolean {
  // Pedidos relativos são à NOSSA app (/api e rotas do Next); URLs absolutos
  // de terceiros (ex.: fontes externas) ficam intactos.
  return url.startsWith('/');
}

// Segunda camada de defesa CSRF (par do csrf-header-guard.ts no backend):
// pedidos de escrita levam este cabeçalho custom. Um <form>/navegação
// cross-site forjada não consegue defini-lo; o backend rejeita com 403
// qualquer escrita autenticada por cookie que não o traga.
const CSRF_HEADER = 'X-Requested-With';
const CSRF_HEADER_VALUE = 'XMLHttpRequest';
// Token double-submit assinado: o backend emite o cookie (legível por JS) csrf_token no login/refresh
// e em qualquer GET de uma sessão que ainda o não tenha; copiamo-lo para este cabeçalho. Sem o cookie
// (sessão anterior a esta defesa) o cabeçalho não é enviado e o backend aceita só X-Requested-With.
const CSRF_COOKIE = 'csrf_token';
const CSRF_TOKEN_HEADER = 'X-CSRF-Token';
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function readCsrfToken(cookieString?: string): string | null {
  const source =
    cookieString ?? (typeof document === 'undefined' ? '' : document.cookie);
  for (const part of source.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === CSRF_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function isStateChanging(method: string | undefined): boolean {
  return STATE_CHANGING_METHODS.has((method ?? 'GET').toUpperCase());
}

export function installApiFetch(): void {
  if (typeof window === 'undefined') return;
  const w = window as typeof window & { __innovaFetchPatched?: boolean };
  if (w.__innovaFetchPatched) return;
  w.__innovaFetchPatched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = resolveUrl(input);
    const api = isApiRequest(url);

    if (api && (!init || init.credentials === undefined)) {
      init = { ...init, credentials: 'include' };
    }

    if (api && isStateChanging(init?.method)) {
      const headers = new Headers(init?.headers);
      headers.set(CSRF_HEADER, CSRF_HEADER_VALUE);
      const csrfToken = readCsrfToken();
      if (csrfToken) headers.set(CSRF_TOKEN_HEADER, csrfToken);
      init = { ...init, headers };
    }

    const response = await originalFetch(input, init);

    // Sessão expirada/inválida -> logout automático (limpa o cookie httpOnly
    // e só depois redirecciona — ver logout() em apiClient.ts). A própria
    // função ignora chamadas repetidas e não faz nada se já estivermos
    // em /login.
    if (api && response.status === 401) {
      logout();
    }

    return response;
  };
}
