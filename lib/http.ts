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
