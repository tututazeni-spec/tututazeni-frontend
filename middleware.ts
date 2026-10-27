import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildCsp, parseImageHosts } from './lib/csp';

// Protege as rotas privadas com base no cookie httpOnly 'token' definido pelo
// backend no login. O middleware corre no servidor, por isso consegue ler o
// cookie httpOnly (o JavaScript do browser nunca lhe acede — mitiga XSS).
const PUBLIC_PATHS = ['/login'];
// Rotas totalmente abertas (verificação pública de certificados): acessíveis
// com ou sem login e sem qualquer redireccionamento.
const OPEN_PATHS = [
  '/verify',
  '/health',
  '/auth/reset-password',
  '/auth/forgot-password',
  '/termos',
  '/privacidade',
];

function route(request: NextRequest, requestHeaders: Headers) {
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  const token = request.cookies.get('token')?.value;
  const isAuth = Boolean(token);
  const { pathname } = request.nextUrl;

  const isOpen = OPEN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isOpen) return next();

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // Não autenticado a tentar aceder a rota privada -> /login
  if (!isAuth && !isPublic) {
    const url = new URL('/login', request.url);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // Autenticado a tentar abrir /login -> dashboard
  if (isAuth && isPublic) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return next();
}

// CSP com nonce por pedido (lib/csp.ts). O nonce vai no header CSP do pedido —
// é de lá que o Next o lê para marcar os seus scripts — e a política na resposta.
export function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp({
    nonce,
    isDev: process.env.NODE_ENV !== 'production',
    imageHosts: parseImageHosts(process.env.IMG_ALLOWED_HOSTS),
    jitsiDomain: process.env.JITSI_DOMAIN,
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = route(request, requestHeaders);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  // Exclui rotas internas, API routes do Next, ficheiros estáticos e assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
