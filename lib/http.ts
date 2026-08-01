// Patch global ao window.fetch para o frontend INNOVA.
//
// Porquê: depois da migração para cookie httpOnly e base same-origin `/api`,
// `credentials: 'include'` é mantido para garantir que o cookie acompanha
// todos os pedidos sem depender de cada página passar a opção individualmente.
//
// Também centraliza o "logout automático" em 401 (sessão expirada), cumprindo
// o requisito do interceptor sem depender de cada página.

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
const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

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
      init = { ...init, headers };
    }

    const response = await originalFetch(input, init);

    // Sessão expirada/inválida -> logout automático. Não redirecciona quando já
    // estamos no login (evita ciclo e preserva a mensagem de credenciais).
    if (
      api &&
      response.status === 401 &&
      !window.location.pathname.startsWith('/login')
    ) {
      window.location.href = '/login';
    }

    return response;
  };
}
