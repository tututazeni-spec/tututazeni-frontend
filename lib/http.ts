// Patch global ao window.fetch para o frontend INNOVA.
//
// Porquê: depois da migração para cookie httpOnly, o token deixa de estar
// acessível ao JavaScript. Para que o cookie seja enviado em pedidos
// cross-origin (frontend :3000 -> backend :4000) é obrigatório
// `credentials: 'include'`. As ~60 páginas fazem `fetch` inline sem essa
// opção; em vez de editar cada uma, garantimos o comportamento num único sítio.
//
// Também centraliza o "logout automático" em 401 (sessão expirada), cumprindo
// o requisito do interceptor sem depender de cada página.

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

// Só forçamos credentials/401 nos pedidos à NOSSA API (backend ou rotas
// relativas). Pedidos a terceiros (ex.: Google Fonts) ficam intactos.
function isApiRequest(url: string): boolean {
  if (API_BASE && url.startsWith(API_BASE)) return true;
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
