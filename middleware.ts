import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protege as rotas privadas com base no cookie httpOnly 'token' definido pelo
// backend no login. O middleware corre no servidor, por isso consegue ler o
// cookie httpOnly (o JavaScript do browser nunca lhe acede — mitiga XSS).
const PUBLIC_PATHS = ['/login'];
// Rotas totalmente abertas (verificação pública de certificados): acessíveis
// com ou sem login e sem qualquer redireccionamento.
const OPEN_PATHS = ['/verify'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const isAuth = Boolean(token);
  const { pathname } = request.nextUrl;

  const isOpen = OPEN_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isOpen) return NextResponse.next();

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

  return NextResponse.next();
}

export const config = {
  // Exclui rotas internas, API routes do Next, ficheiros estáticos e assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|.*\\..*).*)'],
};
